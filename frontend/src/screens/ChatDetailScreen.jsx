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

const ChatDetailScreen = () => {
  const { user } = useStore();
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, username, otherPFP } = route.params;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [participants, setParticipants] = useState(null);
  const typingTimeoutRef = useRef(null);
  const wsRef = useRef(null);
  const flatListRef = useRef(null);

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
      .on("broadcast", { event: "new-message" }, (payload) => {
        const receivedMessage = payload.payload;
        setMessages((prevMessages) => {
          if (prevMessages.find((msg) => msg.id === receivedMessage.id)) {
            return prevMessages;
          }
          return [receivedMessage, ...prevMessages];
        });
      })
      .on("broadcast", { event: "emotion-analysis" }, (payload) => {
        const { messageId, emotion, senderId, receiverId } = payload.payload;

        // Update message with emotion data for both users
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  emotion: emotion,
                  senderEmotion: senderId === user.id ? emotion : null,
                  receiverEmotion: receiverId === user.id ? emotion : null,
                }
              : msg
          )
        );
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        const { userId, isTyping } = payload.payload;
        if (userId !== user.id) {
          setTypingUser(isTyping ? username : null);
        }
      })
      .subscribe();

    // Initialize WebSocket for emotion analysis
    wsRef.current = initializeWebSocket();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [chatId, username, user.id]);

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
      payload: { userId: user.id, isTyping: true },
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(`chat-room-${chatId}`).send({
        type: "broadcast",
        event: "typing",
        payload: { userId: user.id, isTyping: false },
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
    Satisfaction: "#DDA0DD",
    Romance: "#FFB6C1",
    Admiration: "#FFE4B5",
    Adoration: "#FFB6C1",
    "Aesthetic Appreciation": "#E6E6FA",
    Amusement: "#FFDAB9",
    Awe: "#E0FFFF",
    Calmness: "#B0E0E6",

    // Neutral Emotions - Medium Intensity Colors
    Interest: "#DEB887",
    Contemplation: "#B8860B",
    Concentration: "#BDB76B",
    Desire: "#CD853F",
    Realization: "#DAA520",
    "Surprise (positive)": "#FF69B4",
    Nostalgia: "#DDA0DD",
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
    Tiredness: "#696969",

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
        <Text style={styles.emotionText}>
          {emotion.name} ({Math.round(emotion.score * 100)}%)
        </Text>
      </View>
    );
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === user.id;

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
                {`${item.senderEmotion.name} (${Math.round(
                  item.senderEmotion.score * 100
                )}%)`}
              </Text>
            </View>
          )}
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
            <Image
              source={otherPFP ? { uri: otherPFP } : noProfilePic}
              style={styles.profileImage}
            />
            <Text style={styles.title}>{username}</Text>
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
          <Text style={styles.typingIndicator}>{typingUser} is typing...</Text>
        )}
        <Text style={styles.typingIndicator}>Mirlan is typing...</Text>
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
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "rgba(209, 235, 239, 0.7)", // Set to a glassy transparent color
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(221, 221, 221, 0.5)", // Slightly transparent border for a softer look
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: "space-between",
  },
  backButton: {
    padding: 10,
  },
  backIcon: {
    width: 30,
    height: 30,
    marginRight: 5,
  },
  centerContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Allow it to take available space for centering
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 50,
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "400",
    color: "#333",
    marginLeft: 10,
  },
  callIconContainer: {
    padding: 10,
  },
  callIcon: {
    width: 27,
    height: 25,
  },
  typingIndicator: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginVertical: 10,
  },
  messageWrapper: {
    marginVertical: 5,
  },
  messageList: {
    marginTop: 20,
  },
  messageContainer: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
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
    paddingTop: 10,
    paddingLeft: 20,
    fontWeight: "semibold",
    borderBottomWidth: 1,
    borderBlockColor: "#F6D6EE",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingTop: 10,
    paddingRight: 20,
    paddingLeft: 10,
    fontWeight: "semibold",
    borderBottomWidth: 1,
    borderBlockColor: "#D1EBEF",
  },
  messageText: {
    fontSize: 16,
    fontWeight: "300",
  },
  myMessageText: {
    textAlign: "left", // Aligns the text to the right
    fontSize: 16,
    fontWeight: "300",
  },
  otherMessageText: {
    color: "#333",
  },
  messageTimestamp: {
    fontSize: 10,
    color: "#999",
    textAlign: "right",
    marginVertical: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ddd",
    margin: 10,
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
    borderTopLeftRadius: 0, // Round the top left corner
    borderBottomLeftRadius: 12, // Round the bottom left corner
    borderTopRightRadius: 12, // No rounding on the top right corner
    borderBottomRightRadius: 12, // Round the bottom right corner
    top: -15, // Adjust the vertical position as needed
    right: -10, // Move it to the right side, adjust as needed
  },
  otherEmotionContainer: {
    position: "absolute", // Allows it to be positioned absolutely within the parent
    padding: 5,
    borderTopLeftRadius: 0, // Round the top left corner
    borderTopRightRadius: 0, // No rounding on the top right corner
    top: -15, // Adjust the vertical position as needed
    left: 0, // Move it to the right side, adjust as needed
  },
  emotionText: {
    fontSize: 10,
    fontWeight: "semibold", // Change to bold for better visibility
    color: "#FFFFFF", // Change text color to white for high contrast
    textShadowColor: "rgba(0, 0, 0, 0.5)", // Softer gray shadow (semi-transparent black)
    textShadowOffset: { width: 1, height: 1 }, // Slight offset for depth
    textShadowRadius: 2, // Increase radius for a softer shadow effect
  },
});

export default ChatDetailScreen;
