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
  Animated,
} from "react-native";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import useStore from "../store/store";
import GradientText from "react-native-gradient-texts";
import { initializeWebSocket, saveMessageToSupabase } from "../../emotion/api";
import { processMessageWithEmotion } from "../../emotion/emotionAnalysisService";
const noProfilePic = require("../../assets/icons/pfp_icon.png");
import { LinearGradient } from "expo-linear-gradient";
import ScheduleButton from "../../emotion/ScheduleButton";
import OwnedStickersModal from "../components/OwnedStickersModal";
import Icon from "react-native-vector-icons/FontAwesome";
import uuid from "react-native-uuid";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";

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
  const [attachmentPhoto, setAttachmentPhoto] = useState(null);
  const [base64Photo, setBase64Photo] = useState(null);
  //const [modalAnimation, setModalAnimation] = useState(new Animated.Value(0)); // Initialize modalAnimation here
  const [isModalVisible, setModalVisible] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;


    useEffect(() => {
      Animated.timing(translateY, {
        toValue: isModalVisible ? -215 : 0, // Adjust the distance to your needs
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, [isModalVisible]);
  
  useEffect(() => {
    fetchProfilePicture();
  }, []);
  

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Sorry, we need camera roll permissions to make this work!"
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0]; // Access the selected asset
      setAttachmentPhoto(asset.uri);
      setBase64Photo(asset.base64);
    }
    // sendImage();
  }, []);

  // Function to send the selected image
  const sendImage = async () => {
    console.log("sending image");
    if (!base64Photo) {
      Alert.alert("Error", "No photo selected.");
      return;
    }

    const photoPath = `${uuid.v4()}.png`;
    const decodedPhoto = decode(base64Photo);

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(photoPath, decodedPhoto, { contentType: "image/png" });

      if (uploadError) throw uploadError;

      const { data: publicUrlData, error: urlError } = supabase.storage
        .from("attachments")
        .getPublicUrl(photoPath);

      if (urlError) throw urlError;

      const imageUrl = publicUrlData.publicUrl;

      const newMessage = {
        chat_id: chatId,
        sender_id: user.id,
        content: "",
        created_at: new Date().toISOString(), // Add a proper timestamp
      };

      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert([newMessage])
        .select();

      if (messageError) throw messageError;

      const messageId = messageData[0].id;

      await supabase
        .from("attachments")
        .insert([{ message_id: messageId, image_url: imageUrl }]);

      setMessages((prevMessages) => [
        {
          ...newMessage,
          id: messageId,
          attachments: [{ image_url: imageUrl }],
        },
        ...prevMessages,
      ]);
      setAttachmentPhoto(null);
      console.log("Image sent successfully.");
    } catch (err) {
      console.error("Error sending image:", err);
      Alert.alert("Error", "Failed to send image. Please try again.");
    }
  };

  const fetchProfilePicture = async (senderId) => {
    if (profilePics[senderId]) return; // Skip if already fetched
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, username")
        .eq("id", senderId)
        .single();

      if (!error && data) {
        setProfilePics((prev) => ({
          ...prev,
          [senderId]: {
            avatar_url: data.avatar_url,
            username: data.username,
          },
        }));
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

  const fetchStickerUrl = async (stickerId) => {
    try {
      const { data, error } = await supabase
        .from("stickers")
        .select("image_url") // Selecting the image_url field
        .eq("id", stickerId) // Match the sticker_id
        .single(); // Expecting a single result

      if (error) {
        console.error("Error fetching sticker URL:", error);
        return null;
      }
      return data?.image_url;
    } catch (error) {
      console.error("Error fetching sticker URL:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select(
            `*,
            attachments(sticker_id, image_url),
            emotion_analysis!message_id(
              sender_id,
              emotion,
              accuracy
            )`
          )
          .eq("chat_id", chatId)
          .order("created_at", { ascending: false });

        if (messagesError) throw messagesError;

        const processedMessages = await Promise.all(
          messagesData.map(async (message) => {
            const emotionAnalyses = message.emotion_analysis || [];

            const senderEmotion = emotionAnalyses.find(
              (e) => e.sender_id === message.sender_id
            );
            const receiverEmotion = emotionAnalyses.find(
              (e) => e.sender_id !== message.sender_id
            );

            fetchProfilePicture(message.sender_id); // Fetch profile picture for each message

            const attachmentsWithUrls = await Promise.all(
              (message.attachments || []).map(async (attachment) => {
                const stickerUrl = attachment.sticker_id
                  ? await fetchStickerUrl(attachment.sticker_id)
                  : "";

                return {
                  ...attachment,
                  sticker_url: stickerUrl || "", // Default to empty string if null/undefined
                  image_url: attachment.image_url || "", // Default to empty string if null/undefined
                };
              })
            );

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
              attachments: attachmentsWithUrls,
            };
          })
        );

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
    if (!newMessage.trim() && !attachmentPhoto) return;

    if (attachmentPhoto) {
      await sendImage(); // Send the image if there's an attachment
    }

    if (newMessage.trim()) {
      const messageContent = newMessage.trim();
      setNewMessage(""); // Reset input field

      // Process the message with emotion analysis
      const result = await processMessageWithEmotion(
        messageContent,
        user.id,
        chatId,
        wsRef.current
      );

      if (result) {
        console.log("Messages before update:", messages);

        setMessages((prevMessages) => {
          const newMessage = {
            ...result.message,
            senderEmotion: result.emotionAnalysis.emotion,
            receiverEmotion: null,
          };

          console.log("New message being added:", newMessage);

          return [newMessage, ...prevMessages];
        });

        supabase.channel(`chat-room-${chatId}`).send({
          type: "broadcast",
          event: "new-message",
          payload: {
            ...result.message,
            senderEmotion: result.emotionAnalysis.emotion,
          },
        });

        console.log("Messages after update:", messages);
      }
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
    const senderProfile = profilePics[item.sender_id] || {
      avatar_url: null,
      username: "L",
    };
    const { avatar_url, username } = senderProfile;

    return (
      <View style={styles.messageWrapper}>
        <View
          style={[
            styles.messageContainer,
            isMyMessage
              ? [styles.myMessageContainer, { borderBottomRightRadius: 0 }] // Removes top-right radius for the tail effect
              : [styles.otherMessageContainer, { borderBottomLeftRadius: 0 }],
          ]}
        >
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: 4,
              borderRadius: 15,
            }}
          >
            {!isMyMessage && groupTitle ? (
              avatar_url ? (
                <Image
                  source={{ uri: avatar_url }}
                  style={[styles.profileImage, styles.otherProfileContainer]}
                />
              ) : (
                <View style={styles.cardImg}>
                  <Text style={styles.cardAvatarText}>
                    {username[0].toUpperCase() || "N/A"}
                  </Text>
                </View>
              )
            ) : null}

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
              {/* Render message content */}
              {item.content ? (
                <Text
                  style={[
                    styles.messageText,
                    isMyMessage
                      ? styles.myMessageText
                      : styles.otherMessageText,
                  ]}
                >
                  {item.content}
                </Text>
              ) : null}

              {/* Render sticker if available */}
              {item.attachments &&
                item.attachments.map((attachment, index) => {
                  const uri = attachment.image_url || attachment.sticker_url; // Prefer image_url, fallback to sticker_url

                  return uri && isMyMessage ? (
                    <Image
                      key={index}
                      source={{ uri }}
                      style={[
                        attachment.sticker_url
                          ? styles.stickerImage // Fixed size for stickers
                          : styles.attachmentImage, // Auto size for images
                      ]}
                    />
                  ) : (
                    <Image
                      key={index}
                      source={{ uri }}
                      style={[
                        attachment.sticker_url
                          ? styles.otherStickerImage // Fixed size for stickers
                          : styles.otherAttachmentImage, // Auto size for images
                      ]}
                    />
                  );
                })}

              {/* Message timestamp */}
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



// Modal toggle function
const toggleOwnedStickersModal = () => {
  setModalVisible(!isModalVisible);
};

return (
  <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    <View style={styles.innerContainer}>
      <SafeAreaView style={styles.innerContainer}>
        <View style={styles.profileContainer}>
          {/* Profile section */}
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
              onPress={() =>
                console.log("Opening profile", otherPFP, username)
              }
            >
              {otherPFP ? (
                <Image
                  alt="Avatar"
                  resizeMode="cover"
                  source={{ uri: otherPFP }}
                  style={styles.headerImage}
                />
              ) : (
                <View style={[styles.headerImg]}>
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
              source={require("../../assets/icons/telephone.png")}
              style={styles.callIcon}
            />
          </TouchableOpacity>
        </View>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#A0D7E5"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
            }}
          />
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={{ flex: 1, marginBottom: 70 }}>
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
        </View>

        {/* Wrap inputContainer with Animated.View */}
        <Animated.View
          style={[styles.inputContainer, { transform: [{ translateY }] }]}
        >
          {attachmentPhoto && (
            <View style={styles.attachmentPreviewContainer}>
              <Image
                source={{ uri: attachmentPhoto }}
                style={styles.attachmentPreviewImage}
              />
              <TouchableOpacity
                style={styles.removeAttachmentButton}
                onPress={() => setAttachmentPhoto(null)}
              >
                <Text style={styles.removeAttachmentText}>x</Text>
              </TouchableOpacity>
            </View>
          )}
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            value={newMessage}
            onChangeText={(text) => {
              setNewMessage(text);
              handleTyping();
            }}
          />
          <TouchableOpacity onPress={pickImage}>
            <Icon
              name="photo"
              size={23}
              style={{
                marginHorizontal: 3,
                transform: [{ rotate: "0deg" }],
                marginRight: 5,
              }}
              color={"#616061"}
            />
          </TouchableOpacity>

          {/* Secondary Button */}
          <TouchableOpacity
            style={styles.secondaryButtonContainer}
            onPress={toggleOwnedStickersModal}
          >
            <Image
              source={require("../../assets/icons/gift-icon.png")}
              style={styles.secondaryButtonIcon} // Add a style to control size and position
              color={"#616061"}
            />
            <Text style={styles.secondaryButtonText}></Text>

            {/* Owned Stickers Modal */}
            <OwnedStickersModal
              visible={isModalVisible}
              onClose={() => setModalVisible(false)} // Close modal on close
              chatID={chatId}
              setMessages={setMessages}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSendMessage}>
            <Image
              style={[
                styles.sendButton,
                {
                  tintColor: "#A0D7E5",
                  width: 20,
                  height: 20,
                  marginRight: 10,
                },
              ]}
              source={require("../../assets/icons/send_icon.png")}
            />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
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
    flex: 2,
  },
  profileContainer: {
    flexDirection: "row", // Keep the layout as a row
    width: "100%",
    alignItems: "center", // Center items vertically
    justifyContent: "space-between", // Space out items
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "#D1EBEF",
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
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
    color: "black",
    marginLeft: 10,
  },
  callIconContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  callIcon: {
    width: 25.5,
    height: 25.5,
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
    marginHorizontal: 10,
  },
  messageList: {},
  messageContainer: {
    borderRadius: 15,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D1EBEF",
    maxWidth: "80%",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    marginBottom: 20,
  },
  myMessageContainer: {
    alignSelf: "flex-end",
    fontWeight: "semibold",
    borderBottomWidth: 1,
    borderRadius: 8,
    borderBlockColor: "#F6D6EE",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  messageText: {
    fontWeight: "300",
    marginLeft: 5,
    fontSize: 19,
    textAlign: "left", // Ensure proper text alignment
  },
  otherMessageText: {},
  stickerImage: {
    width: 80,
    height: 80,
  },
  otherStickerImage: {
    width: 80,
    height: 80,
    borderRadius: 13,
  },
  attachmentImage: {
    flex: 1,
    aspectRatio: 1,
    height: 200,
    borderRadius: 13,
  },
  otherAttachmentImage: {
    aspectRatio: 1,
    height: 200,
    borderRadius: 13,
  },
  messageTimestamp: {
    fontSize: 10,
    color: "#999",
    textAlign: "right",
  },
  inputContainer: {
    //position: "absolute",
    bottom: 15,
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
  },
  input: {
    flex: 1,
    padding: 5,
    fontSize: 16,
  },
  sendButtonContainer: {
    borderRadius: "50%",
    padding: 10,
    alignItems: "center", // Center horizontally
    justifyContent: "center", // Center vertically
    borderRadius: 20,
    color: "black",
  },
  sendButton: {
    alignItems: "center", // Center horizontally
    justifyContent: "center", // Center vertically
    alignSelf: "center",
    transform: [{ rotate: "-45deg" }], // Apply the 45 degree tilt
  },
  secondaryButtonContainer: {
    flexDirection: "row",
    padding: 8,
    marginRight: 5, // Added space between secondary button and send button
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonIcon: {
    width: 25,
    height: 25,
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
    paddingBottom: 2,
    paddingTop: 2,
    paddingHorizontal: 6,
    top: -15, // Adjust the vertical position as needed
  },
  myEmotionContainer: {
    borderTopLeftRadius: 12, // Round the top left corner
    borderTopRightRadius: 12, // No rounding on the top right corner
    borderBottomLeftRadius: 12, // Round the bottom left corner
    right: 0, // Move it to the right side, adjust as needed
  },
  otherEmotionContainer: {
    borderTopLeftRadius: 12, // Round the top left corner
    borderTopRightRadius: 12, // No rounding on the top right corner
    borderBottomRightRadius: 12,
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
  headerImg: {
    width: 40,
    height: 40,
    backgroundColor: "#FFADAD", // soft coral to complement pastel blue
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  cardImg: {
    width: 40,
    height: 40,
    backgroundColor: "#FFADAD", // soft coral to complement pastel blue
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerImage: {
    width: 40,
    height: 40,
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
  attachmentPreviewContainer: {
    flexDirection: "row",
  },
  attachmentPreviewImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  removeAttachmentButton: {
    position: "absolute",
    backgroundColor: "#ff4d4d",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: "50%",
  },
  removeAttachmentText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ChatDetailScreen;