import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Button,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import useStore from "../store/store";
import { initializeWebSocket, saveMessageToSupabase } from "../../emotion/api";
import { saveEmotionAnalysis } from "../../emotion/emotionAnalysis";
const noProfilePic = require("../../assets/icons/pfp_icon.png");

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
  const typingTimeoutRef = useRef(null);
  const wsRef = useRef(null);

  // Utility function to encode a string to Base64
  const encodeToBase64 = (str) => {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
      console.error("Failed to encode text to Base64:", e);
      return "";
    }
  };

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
      .subscribe();

    // Initialize WebSocket for emotion analysis
    wsRef.current = initializeWebSocket(handleWebSocketMessage);

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [chatId]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching messages:", error);
        setError("Failed to load messages");
      } else {
        setMessages(data);
      }
      setLoading(false);
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
      setTypingUser(null);
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
  
    const messageContent = newMessage.trim();
    setNewMessage("");
  
    // Save message to Supabase
    const savedMessage = await saveMessageToSupabase(messageContent, user.id, chatId);
  
    if (savedMessage) {
      // Update local state immediately
      setMessages((prevMessages) => [savedMessage, ...prevMessages]);
  
      // Encode the message content to Base64
      const base64MessageContent = encodeToBase64(messageContent);
  
      // Send message for emotion analysis with correct payload format for Hume API
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          data: base64MessageContent,
          models: {
            language: {
              granularity: "sentence",
            },
          },
        }));

        // Listen for emotion analysis response
        wsRef.current.onmessage = async (event) => {
          const emotionResponse = JSON.parse(event.data);

          if (emotionResponse.language && emotionResponse.language.predictions.length > 0) {
            const emotions = emotionResponse.language.predictions[0].emotions;

            // Log emotions received for debugging
            console.log("Emotions received:", emotions);

            // Save emotion analysis to Supabase
            await saveEmotionAnalysis(savedMessage.id, emotions);

            // Update local state with the top emotion
            const topEmotion = emotions.reduce((prev, current) => (prev.score > current.score ? prev : current));
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === savedMessage.id ? { ...msg, emotion: topEmotion } : msg
              )
            );
          }
        };
      }

      // Broadcast new message to other users
      supabase.channel(`chat-room-${chatId}`).send({
        type: "broadcast",
        event: "new-message",
        payload: savedMessage,
      });
    }
  };
  
  const handleWebSocketMessage = (event) => {
    const response = JSON.parse(event.data);
    console.log('Emotion analysis response:', response);
  
    if (response.error) {
      console.error('Emotion analysis error:', response.error);
      return;
    }
  
    if (response.language && response.language.predictions.length > 0) {
      const emotionScores = response.language.predictions[0].emotions;
      const topEmotion = emotionScores.reduce((prev, current) => (prev.score > current.score) ? prev : current);
  
      // Update the message with emotion data
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.content === response.language.predictions[0].text && !msg.emotion
            ? { ...msg, emotion: topEmotion }
            : msg
        )
      );
  
      // Save emotion analysis to the database
      const message = messages.find((msg) => msg.content === response.language.predictions[0].text);
      if (message) {
        saveEmotionAnalysis(message.id, [topEmotion]);
      }
    }
  };

  const emotionColorMap = {
    Joy: "#FFD700",
    Sadness: "#4169E1",
    Anger: "#FF4500",
    Fear: "#8B008B",
    Surprise: "#FF69B4",
    Disgust: "#32CD32",
    Love: "#FF1493",
    Confusion: "#808080",
    Neutral: "#A9A9A9",
    Interest: "#FDA172",
    Calmness: "#63C5DA",
    Enthusiasm: "#8A3324",
    Horror: "#8D021F",
    Excitement: "#FFEF00",
    'Surprise (negative)': "#4A3728",
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
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText,
            ]}
          >
            {item.content}
          </Text>
          <Text style={styles.messageTimestamp}>
            {new Date(item.created_at).toLocaleTimeString()}
          </Text>
        </View>
  
        {item.emotion && (
          <View
            style={[
              styles.emotionContainer,
              isMyMessage ? styles.myEmotionContainer : styles.otherEmotionContainer,
            ]}
          >
            <View
              style={[
                styles.emotionCircle,
                { backgroundColor: emotionColorMap[item.emotion.name] || 'gray' },
              ]}
            />
            <Text style={styles.emotionText}>{item.emotion.name}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.innerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("MainTabs")}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.profileContainer}>
          <Image
            source={otherPFP ? { uri: otherPFP } : noProfilePic}
            style={styles.profileImage}
          />
          <Text style={styles.title}>{username}</Text>
        </View>

        {typingUser && (
          <Text style={styles.typingIndicator}>{typingUser} is typing...</Text>
        )}

        {loading && <ActivityIndicator size="large" color="#007BFF" />}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            inverted
          />
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
          <TouchableOpacity onPress={handleSendMessage}>
            <Text style={styles.sendButton}>Send</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default ChatDetailScreen;

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
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#007BFF",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
  },
  chatIdContainer: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    marginBottom: 15,
  },
  chatIdText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },
  chatIdValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007BFF",
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
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    maxWidth: "80%",
  },
  myMessageContainer: {
    alignSelf: "flex-end",
    marginRight: 10,
    backgroundColor: "#007BFF",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
    marginLeft: 10,
    backgroundColor: "#E5E5E5",
  },
  messageText: {
    fontSize: 16,
    color: "#fff",
  },
  myMessageText: {
    color: "#fff",
  },
  otherMessageText: {
    color: "#333",
  },
  messageTimestamp: {
    fontSize: 10,
    color: "#fff",
    marginTop: 5,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  input: {
    flex: 1,
    borderColor: "#007BFF",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    backgroundColor: "#fff",
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#007BFF",
    color: "#fff",
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 10,
  },
  emotionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10, 
  },  
  myEmotionContainer: {
    marginRight: 10,
    alignSelf: "flex-end",
  },
  otherEmotionContainer: {
    marginLeft: 10,
    alignSelf: "flex-start",
  },
  emotionCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  emotionText: {
    fontSize: 12,
    color: 'black',
  },
});