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
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import useStore from "../store/store";
const noProfilePic = require("../../assets/icons/pfp_icon.png");

const ChatDetailScreen = () => {
  const { user } = useStore();
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, otherPFP, otherUsername } = route.params;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const channel = supabase.channel(`chat-room-${chatId}`);

    channel
      .on("broadcast", { event: "new-message" }, (payload) => {
        const receivedMessage = payload.payload;
        setMessages((prevMessages) => [receivedMessage, ...prevMessages]);
      })
      .on("broadcast", { event: "typing" }, async (payload) => {
        const { userId, isTyping } = payload.payload;

        if (isTyping) {
          try {
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", userId)
              .single();

            if (error) {
              console.error("Error fetching username:", error);
              return;
            }

            if (profile) {
              setTypingUser(profile.username);
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
          }
        } else {
          setTypingUser(null);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
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

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          content: newMessage.trim(),
          chat_id: chatId,
          sender_id: user.id,
          created_at: new Date(),
        },
      ])
      .select("*");

    if (error) {
      console.error("Error inserting message:", error);
      return;
    }

    if (data && data.length > 0) {
      supabase.channel(`chat-room-${chatId}`).send({
        type: "broadcast",
        event: "new-message",
        payload: data[0],
      });
    }

    setNewMessage("");
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === user.id;

    return (
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
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
        <Text style={styles.title}>{otherUsername}</Text>
      </View>

      <View style={styles.chatIdContainer}>
        <Text style={styles.chatIdText}>Conversation ID:</Text>
        <Text style={styles.chatIdValue}>{chatId}</Text>
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
  );
};

export default ChatDetailScreen;

const styles = StyleSheet.create({
  container: {
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
  messageList: {
    marginTop: 20,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    maxWidth: "80%",
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessageContainer: {
    backgroundColor: "#e5f5ff",
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    backgroundColor: "#f0f0f0",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: "#333",
  },
  otherMessageText: {
    color: "#666",
  },
  messageTimestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: "#f1f3f6",
    fontSize: 16,
  },
  sendButton: {
    fontSize: 16,
    color: "#007BFF",
    marginLeft: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
});
