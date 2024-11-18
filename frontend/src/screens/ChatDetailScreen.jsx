import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Image,
  Button,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import useStore from "../store/store";
import { initializeWebSocket, saveMessageToSupabase } from "../../emotion/api";
import { processMessageWithEmotion } from "../../emotion/emotionAnalysisService";
const noProfilePic = require("../../assets/icons/pfp_icon.png");
import { LinearGradient } from "expo-linear-gradient";
import ScheduleButton from "../../emotion/ScheduleButton";
import OwnedStickersModal from "../components/OwnedStickersModal";

const ChatDetailScreen = () => {
  const { user } = useStore();
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, username, otherPFP, groupTitle } = route.params;
  const [senderPFP, setSenderPFP] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [participants, setParticipants] = useState(null);
  const [profilePics, setProfilePics] = useState({});
  const typingTimeoutRef = useRef(null);
  const wsRef = useRef(null);
  const flatListRef = useRef(null);

  const [ownedStickersVisible, setOwnedStickersVisible] = useState(false);

  const toggleOwnedStickersModal = () => {
    setOwnedStickersVisible(!ownedStickersVisible);
  };
  useEffect(() => {
    // Example API call to fetch profile picture
    fetchProfilePicture()
  }, []);

  const fetchProfilePicture = async (senderId) => {
    if (profilePics[senderId]) return; // Skip if already fetched
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", senderId)
        .single();

      if (!error && data) {
        setProfilePics((prev) => ({ ...prev, [senderId]: data.avatar_url }));
      }
    } catch (error) {
      console.error("Error fetching profile picture:", error);
    }
  };

  useEffect(() => {
    const fetchParticipants = async () => {
      const { data, error } = await supabase
        .from("chat_participants")
        .select("user_id")
        .eq("chat_id", chatId);

      if (!error && data) {
        setParticipants(data);
      }
    };

    fetchParticipants();
  }, [chatId]);

  useEffect(() => {
    const channel = supabase.channel(`chat-room-${chatId}`);

    channel
      .on("broadcast", { event: "new-message" }, async (payload) => {
        const receivedMessage = payload.payload;
        await fetchProfilePicture(receivedMessage.sender_id);

        setMessages((prevMessages) => {
          if (prevMessages.find((msg) => msg.id === receivedMessage.id)) {
            return prevMessages;
          }
          return [receivedMessage, ...prevMessages];
        });
      })
      .on("broadcast", { event: "typing" }, async (payload) => {
        const { userId, isTyping } = payload.payload;
        if (userId !== user.id) {
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", userId)
              .single();

            if (!error) {
              setTypingUser(isTyping ? data.username : null);
            }
          } catch (error) {
            console.error("Error fetching typing user:", error);
          }
        }
      })
      .subscribe();

    wsRef.current = initializeWebSocket();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [chatId, username, user.id]);

  const updateReadStatus = async () => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("chat_id", chatId)
        .neq("sender_id", user.id)
        .is("is_read", false); // Only update unread messages

      if (error) {
        console.error("Error updating read status:", error);
      }
    } catch (err) {
      console.error("Unexpected error updating read status:", err);
    }
  };

  useEffect(() => {
    updateReadStatus(); // Mark messages as read when the screen loads

    // Optional: Call again when new messages arrive
    const channel = supabase.channel(`chat-room-${chatId}`);
    channel.on("broadcast", { event: "new-message" }, () => {
      updateReadStatus();
    });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [chatId, user.id]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select(
            `
            *,
            emotion_analysis!message_id(
              sender_id,
              emotion,
              accuracy
            )
          `
          )
          .eq("chat_id", chatId)
          .order("created_at", { ascending: false });

        if (messagesError) throw messagesError;

        const processedMessages = messagesData.map((message) => {
          const emotionAnalyses = message.emotion_analysis || [];

          const senderEmotion = emotionAnalyses.find(
            (e) => e.sender_id === message.sender_id
          );
          const receiverEmotion = emotionAnalyses.find(
            (e) => e.sender_id !== message.sender_id
          );

          fetchProfilePicture(message.sender_id); // Fetch profile picture for each message

          return {
            ...message,
            senderEmotion: senderEmotion
              ? {
                  name: senderEmotion.emotion,
                  score: senderEmotion.accuracy,
                }
              : null,
            receiverEmotion: receiverEmotion
              ? {
                  name: receiverEmotion.emotion,
                  score: receiverEmotion.accuracy,
                }
              : null,
          };
        });

        setMessages(processedMessages);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load messages");
        setLoading(false);
      }
    };

    fetchMessages();
  }, [chatId]);

  const handleTyping = () => {
    if (!newMessage.trim()) return;
    supabase.channel(`chat-room-${chatId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { userId: user.id, username: user.username, isTyping: true },
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(`chat-room-${chatId}`).send({
        type: "broadcast",
        event: "typing",
        payload: { userId: user.id, username: user.username, isTyping: false },
      });
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    const result = await processMessageWithEmotion(
      messageContent,
      user.id,
      chatId,
      wsRef.current
    );

    if (result) {
      // Update local state with the new message and emotion
      setMessages((prevMessages) => [
        {
          ...result.message,
          senderEmotion: result.emotionAnalysis.emotion,
          receiverEmotion: null, // Will be updated when receiver processes it
        },
        ...prevMessages,
      ]);

      // Broadcast new message to other users
      supabase.channel(`chat-room-${chatId}`).send({
        type: "broadcast",
        event: "new-message",
        payload: {
          ...result.message,
          senderEmotion: result.emotionAnalysis.emotion,
        },
      });
    }
  };

  const emotionColorMap = {
    // Positive Emotions - Bright Colors
    Joy: "#FFD700",
    Love: "#FF69B4",
    Gratitude: "#98FB98",
    Pride: "#FFA500",
    Excitement: "#FFEF00",
    Enthusiasm: "#FF7F50",
    Triumph: "#FFB6C1",
    Ecstasy: "#FFC0CB",
    Contentment: "#87CEEB",
    Relief: "#98FF98",
    Satisfaction: "#C5DCB6",
    Romance: "#DF2C1C",
    Admiration: "#FFE4B5",
    Adoration: "#FBFBFB",
    "Aesthetic Appreciation": "#E6E6FA",
    Amusement: "#FFDAB9",
    Awe: "#E0FFFF",
    Calmness: "#B0E0E6",

    // Neutral Emotions - Medium Intensity Colors
    Interest: "#DEB887",
    Contemplation: "#B8860B",
    Concentration: "#BDB76B",
    Desire: "#EA3B52",
    Realization: "#DAA520",
    "Surprise (positive)": "#FF9CCE",
    Nostalgia: "#EBC6EB",
    Determination: "#CD853F",
    Craving: "#D2691E",

    // Negative Emotions - Darker Colors
    Sadness: "#4169E1",
    Anger: "#DC143C",
    Fear: "#8B008B",
    Disgust: "#006400",
    Horror: "#8B0000",
    "Surprise (negative)": "#4A3728",
    Anxiety: "#483D8B",
    Confusion: "#696969",
    Disappointment: "#708090",
    Distress: "#800000",
    Pain: "#A52A2A",
    Shame: "#4B0082",
    Guilt: "#2F4F4F",
    Contempt: "#556B2F",
    Disapproval: "#8B4513",
    Awkwardness: "#9932CC",
    Doubt: "#4682B4",
    Annoyance: "#CD5C5C",
    Boredom: "#778899",
    "Empathic Pain": "#8B4513",
    Embarrassment: "#DB7093",
    Envy: "#6B8E23",
    Tiredness: "#515DDC",

    // Special Cases
    Sympathy: "#DDA0DD",
    Entrancement: "#9370DB",
  };

  const renderEmotionIndicator = (emotion, alignment) => {
    if (!emotion) return null;

    return (
      <View
        style={[
          styles.emotionContainer,
          { backgroundColor: emotionColorMap[emotion.name] || "gray" },
          alignment === "right"
            ? styles.myEmotionContainer
            : styles.otherEmotionContainer,
        ]}
      >
        <View
          style={[
            styles.emotionCircle,
            { backgroundColor: emotionColorMap[emotion.name] || "gray" },
          ]}
        />
        <Text style={styles.emotionText}>{emotion.name}</Text>
      </View>
    );
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === user.id;
    const senderPFP = profilePics[item.sender_id] || noProfilePic;
    console.log(senderPFP);
    return (
      <View style={styles.messageWrapper}>
        <View
          style={[
            styles.messageContainer,
            isMyMessage
              ? styles.myMessageContainer
              : styles.otherMessageContainer,
          ]}
        >
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {!isMyMessage && (
              <Image
                source={
                  loading || !senderPFP ? noProfilePic : { uri: senderPFP }
                }
                style={[styles.profileImage, styles.otherProfileContainer]}
              />
            )}

            {item.senderEmotion && (
              <View
                style={[
                  styles.emotionContainer,
                  {
                    backgroundColor:
                      emotionColorMap[item.senderEmotion.name] || "gray",
                  },
                  isMyMessage
                    ? styles.myEmotionContainer
                    : styles.otherEmotionContainer,
                ]}
              >
                <Text style={styles.emotionText}>
                  {`${item.senderEmotion.name}`}
                </Text>
              </View>
            )}
            <View style={{ display: "flex" }}>
              <Text
                style={[
                  styles.messageText,
                  isMyMessage ? styles.myMessageText : styles.otherMessageText,
                ]}
              >
                {item.content}
              </Text>
              <Text style={styles.messageTimestamp}>
                {new Date(item.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.innerContainer}>
        <View style={styles.profileContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("MainTabs")}
          >
            <Image
              source={require("../../assets/icons/back_arrow.webp")}
              style={styles.backIcon}
            />
          </TouchableOpacity>

          <View style={styles.centerContainer}>
            <TouchableOpacity
              onPress={() => console.log("Opening profile", otherPFP, username)}
            >
              {/* {console.log("otherPFP:", otherPFP)} */}
              {otherPFP ? (
                <Image
                  alt="Avatar"
                  resizeMode="cover"
                  source={{ uri: otherPFP }}
                  style={styles.cardImg}
                />
              ) : (
                <View style={[styles.cardImg]}>
                  <Text style={styles.cardAvatarText}>
                    {groupTitle
                      ? groupTitle[0].toUpperCase()
                      : username[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.title}>
              {groupTitle ? groupTitle : username}
            </Text>
          </View>

          <TouchableOpacity style={styles.callIconContainer}>
            <Image
              source={require("../../assets/icons/call-icon.png")}
              style={styles.callIcon}
            />
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color="#007BFF" />}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            inverted
          />
        )}
        {typingUser && (
          <View style={styles.mainTyping}>
            <View style={styles.typingIndicatorBubble}>
              <Text style={styles.typingIndicator}>
                {typingUser} is typing...
              </Text>
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            value={newMessage}
            onChangeText={(text) => {
              setNewMessage(text);
              handleTyping();
            }}
          />
          {/* Secondary Button */}
          <TouchableOpacity
            style={styles.secondaryButtonContainer}
            onPress={toggleOwnedStickersModal}
          >
            <Image
              source={require("../../assets/icons/gift-icon.png")}
              style={styles.secondaryButtonIcon} // Add a style to control size and position
            />
            <Text style={styles.secondaryButtonText}></Text>

            {/* Owned Stickers Modal */}
            <OwnedStickersModal
              visible={ownedStickersVisible}
              onClose={() => setOwnedStickersVisible(false)}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSendMessage}>
            <LinearGradient
              colors={["#A0D7E5", "#D1EBEF"]}
              style={styles.sendButtonContainer}
            >
              <Image
                style={[
                  styles.sendButton,
                  {
                    tintColor: "white",
                    transform: [{ rotate: "-45deg" }],
                    width: 20,
                    height: 20,
                  },
                ]}
                source={require("../../assets/icons/send_icon.png")}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const negativeEmotions = [
  "Sadness",
  "Anger",
  "Fear",
  "Disgust",
  "Horror",
  "Surprise (negative)",
  "Anxiety",
  "Confusion",
  "Disappointment",
  "Distress",
  "Pain",
  "Shame",
  "Guilt",
  "Contempt",
  "Disapproval",
  "Awkwardness",
  "Doubt",
  "Annoyance",
  "Boredom",
  "Empathic Pain",
  "Embarrassment",
  "Envy",
  "Tiredness",
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f4f8",
  },
  profileContainer: {
    flexDirection: "row", // Keep the layout as a row
    alignItems: "center", // Center items vertically
    justifyContent: "space-between", // Space out items
    padding: 15, // Padding around the container
    borderColor: "rgba(209, 235, 239, 0.5)", // Semi-transparent border color
    backgroundColor: "rgba(240, 249, 249, 0.7)", // Semi-transparent background color for glassy effect
    backdropFilter: "blur(10px)", // Add blur effect (may need alternative library)
    borderRadius: 10, // Rounded corners
    borderWidth: 1, // Border width
    shadowColor: "#000", // Shadow color
    shadowOffset: { width: 0, height: 2 }, // Shadow offset
    shadowOpacity: 0.1, // Light shadow effect
    shadowRadius: 4, // Soft shadow
    elevation: 3, // For Android shadow effect
  },
  backButton: {
    flex: 1,
    justifyContent: "flex-start",
  },
  backIcon: {
    width: 30,
    height: 30,
  },
  centerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flex: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "400",
    color: "#333",
    marginLeft: 10,
  },
  callIconContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  callIcon: {
    width: 27,
    height: 25,
  },
  typingIndicator: {
    fontSize: 12,
    color: "#333", // Darker color for better readability
    textAlign: "center",
    fontWeight: "400", // Slightly bolder font for emphasis
    marginVertical: 2, // Add some vertical space around the text
  },
  mainTyping: {
    position: "relative", // Allows absolute positioning of child elements
  },
  typingIndicatorBubble: {
    position: "absolute", // Change to absolute positioning
    alignItems: "flex-start", // Align items to the start
    alignSelf: "flex-start", // Allow the bubble to size to the text
    borderRadius: 12, // Make the overall bubble more rounded
    bottom: 0,
    left: 10,
    padding: 5, // Increased padding for a more spacious feel
    borderWidth: 1,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderColor: "rgba(209, 235, 239, 0.5)", // Use a semi-transparent border color
    backgroundColor: "rgba(240, 249, 249, 0.7)", // Semi-transparent background color for glassy effect
    backdropFilter: "blur(10px)", // Add blur effect (not supported in all RN versions)
    shadowColor: "#000", // Shadow color
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2, // Light shadow effect
    shadowRadius: 2, // Soft shadow
    elevation: 3, // For Android shadow effect
  },

  messageWrapper: {
    marginVertical: 5,
    marginHorizontal: 10,
  },
  messageList: {
    marginTop: 10,
  },
  messageContainer: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "white",
    borderWidth: 2, // Border width
    borderColor: "#D1EBEF",
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    marginBottom: 20,
  },
  myMessageContainer: {
    alignSelf: "flex-end",
    paddingLeft: 20,
    fontWeight: "semibold",
    borderBottomWidth: 1,
    borderBlockColor: "#F6D6EE",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingRight: 20,
    paddingLeft: 10,
    fontWeight: "semibold",
    borderBottomWidth: 1,
    borderBlockColor: "#D1EBEF",
  },
  messageText: {
    fontSize: 20,
    fontWeight: "300",
  },
  myMessageText: {
    textAlign: "right", // Aligns the text to the right
    fontSize: 20,
    fontWeight: "300",
  },
  otherMessageText: {
    color: "#333",
  },
  messageTimestamp: {
    fontSize: 10,
    color: "#999",
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    marginBottom: 5,
  },
  input: {
    flex: 1,
    padding: 5,
    fontSize: 16,
  },
  sendButtonContainer: {
    borderRadius: "50%",
    padding: 8,
    alignItems: "center", // Center horizontally
    justifyContent: "center", // Center vertically
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: "center", // Center horizontally
    justifyContent: "center", // Center vertically
  },
  secondaryButtonContainer: {
    flexDirection: "row",
    padding: 8,
    marginRight: 10, // Added space between secondary button and send button
    alignItems: "center",
    justifyContent: "center",
  },
  //secondaryButtonText: {
  //fontSize: 16,
  //left: -20,
  //},
  secondaryButtonIcon: {
    width: 25,
    height: 25,
    marginRight: 5, // Space between icon and text
    alignItems: "center", // Center horizontally
    justifyContent: "center", // Center vertically
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 10,
  },
  emotionContainer: {
    position: "absolute",
    padding: 5,
    borderTopLeftRadius: 12, // Only round the top left corner
    borderBottomLeftRadius: 0, // Only round the bottom left corner
    borderTopRightRadius: 12, // No rounding on the top right corner
    borderBottomRightRadius: 12, // No rounding on the bottom right corner
    top: -15,
    left: -10,
  },
  myEmotionContainer: {
    position: "absolute", // Allows it to be positioned absolutely within the parent
    padding: 5,
    borderTopLeftRadius: 12, // Round the top left corner
    borderBottomLeftRadius: 12, // Round the bottom left corner
    borderTopRightRadius: 12, // No rounding on the top right corner
    borderBottomRightRadius: 0, // Round the bottom right corner
    top: -15, // Adjust the vertical position as needed
    right: -10, // Move it to the right side, adjust as needed
    borderWidth: 1,
  },
  otherEmotionContainer: {
    position: "absolute", // Allows it to be positioned absolutely within the parent
    padding: 4,
    borderTopLeftRadius: 12, // Round the top left corner
    borderTopRightRadius: 12, // No rounding on the top right corner
    borderBottomLeftRadius: 0, // Round the bottom left corner
    top: -15, // Adjust the vertical position as needed
    left: -10, // Move it to the right side, adjust as needed
  },
  otherProfileContainer: {
    marginRight: 4, // Adds space between the profile image and message for other users
  },
  emotionText: {
    fontSize: 12,
    fontWeight: "bold", // Change to bold for better visibility
    color: "#FFFFFF", // Change text color to white for high contrast
    textShadowColor: "rgba(0, 0, 0, 0.5)", // Softer gray shadow (semi-transparent black)
    textShadowOffset: { width: 1, height: 1 }, // Slight offset for depth
    textShadowRadius: 2, // Increase radius for a softer shadow effect
  },
  scheduleButton: {
    position: "absolute",
    right: -65,
    bottom: 5,
    backgroundColor: "#A0D7E5",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  scheduleButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
  },
  cardImg: {
    width: 40,
    height: 40,
    marginRight: 8,
    backgroundColor: "#FFADAD", // soft coral to complement pastel blue
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  cardAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF", // keeping the text white for readability
  },
});

export default ChatDetailScreen;
