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
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import useStore from "../store/store";

const ChatDetailScreen = () => {
  const { user } = useStore();
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId } = route.params;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [typingUser, setTypingUser] = useState(null); // Track the user who is typing
  const typingTimeoutRef = useRef(null); // Use ref to store the typing timeout

  useEffect(() => {
    const channel = supabase.channel(`chat-room-${chatId}`);

    channel
      .on("broadcast", { event: "new-message" }, (payload) => {
        const receivedMessage = payload.payload;
        setMessages((prevMessages) => [receivedMessage, ...prevMessages]);
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        const { userId, isTyping } = payload.payload; // Destructure userId and isTyping from payload
        if (isTyping) {
          setTypingUser(userId); // Set the typing user
        } else {
          setTypingUser(null); // Clear typing user if not typing
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // Fetch messages from the Supabase database
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
    if (!newMessage.trim()) return; // Prevent sending typing event if the input is empty

    // Send typing event to other clients
    supabase.channel(`chat-room-${chatId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { userId: user.id, isTyping: true },
    });

    // Clear existing timeout and set a new one
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      // Send typing event to other clients
      supabase.channel(`chat-room-${chatId}`).send({
        type: "broadcast",
        event: "typing",
        payload: { userId: user.id, isTyping: false },
      });
    }, 1000); // 1 second timeout
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return; // Prevent sending empty messages

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

    setNewMessage(""); // Clear the input after sending
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

      <Text style={styles.title}>Chat Detail Screen</Text>
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
            handleTyping(); // Call handleTyping on text change
          }}
        />
        <Button title="Send" onPress={handleSendMessage} />
      </View>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  typingIndicator: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginVertical: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
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
  messageList: {
    marginTop: 20,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  myMessageContainer: {
    backgroundColor: "#007BFF",
    alignSelf: "flex-end",
    borderTopRightRadius: 0,
  },
  otherMessageContainer: {
    backgroundColor: "#f1f1f1",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
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
    fontSize: 12,
    color: "#999",
    marginTop: 5,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
});
