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
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chatId);

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
          .select(`
            *,
            emotion_analysis!message_id(
              sender_id,
              emotion,
              accuracy
            )
          `)
          .eq("chat_id", chatId)
          .order("created_at", { ascending: false });
    
        if (messagesError) throw messagesError;
    
        const processedMessages = messagesData.map(message => {
          const emotionAnalyses = message.emotion_analysis || [];
          
          const senderEmotion = emotionAnalyses.find(e => e.sender_id === message.sender_id);
          const receiverEmotion = emotionAnalyses.find(e => e.sender_id !== message.sender_id);
    
          return {
            ...message,
            senderEmotion: senderEmotion ? {
              name: senderEmotion.emotion,
              score: senderEmotion.accuracy
            } : null,
            receiverEmotion: receiverEmotion ? {
              name: receiverEmotion.emotion,
              score: receiverEmotion.accuracy
            } : null
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
          receiverEmotion: null // Will be updated when receiver processes it
        },
        ...prevMessages,
      ]);

      // Broadcast new message to other users
      supabase.channel(`chat-room-${chatId}`).send({
        type: "broadcast",
        event: "new-message",
        payload: {
          ...result.message,
          senderEmotion: result.emotionAnalysis.emotion
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
    Entrancement: "#9370DB" 
  };

  const renderEmotionIndicator = (emotion, alignment) => {
    if (!emotion) return null;

    return (
      <View
        style={[
          styles.emotionContainer,
          alignment === 'right' ? styles.myEmotionContainer : styles.otherEmotionContainer,
        ]}
      >
        <View
          style={[
            styles.emotionCircle,
            { backgroundColor: emotionColorMap[emotion.name] || 'gray' },
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
            isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
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
  
        {/* Sender Emotion */}
        {item.senderEmotion && (
          <View
            style={[
              styles.emotionContainer,
              isMyMessage ? styles.myEmotionContainer : styles.otherEmotionContainer,
            ]}
          >
            <View
              style={[
                styles.emotionCircle,
                { backgroundColor: emotionColorMap[item.senderEmotion.name] || 'gray' },
              ]}
            />
            <Text style={styles.emotionText}>
              {`${item.senderEmotion.name} (${Math.round(item.senderEmotion.score * 100)}%)`}
            </Text>
          </View>
        )}
  
        {/* Receiver Emotion */}
        {item.receiverEmotion && (
          <View
            style={[
              styles.emotionContainer,
              isMyMessage ? styles.myEmotionContainer : styles.otherEmotionContainer,
            ]}
          >
            <View
              style={[
                styles.emotionCircle,
                { backgroundColor: emotionColorMap[item.receiverEmotion.name] || 'gray' },
              ]}
            />
            <Text style={styles.emotionText}>
              {`Receiver: ${item.receiverEmotion.name} (${Math.round(item.receiverEmotion.score * 100)}%)`}
            </Text>
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
            ref={flatListRef}
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
          <TouchableOpacity 
            style={styles.sendButtonContainer}
            onPress={handleSendMessage}
          >
            <Text style={styles.sendButton}>Send</Text>
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
  },
  myMessageText: {
    color: "#fff",
  },
  otherMessageText: {
    color: "#333",
  },
  messageTimestamp: {
    fontSize: 10,
    color: "#999",
    marginTop: 5,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  sendButtonContainer: {
    backgroundColor: "#007BFF",
    borderRadius: 20,
    padding: 10,
    marginLeft: 10,
  },
  sendButton: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 10,
  },
  emotionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  myEmotionContainer: {
    alignSelf: "flex-end",
    marginRight: 10,
  },
  otherEmotionContainer: {
    alignSelf: "flex-start",
    marginLeft: 10,
  },
  emotionCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  emotionText: {
    fontSize: 12,
    color: '#555',
  },
});

export default ChatDetailScreen;