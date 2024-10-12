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
import React, { useEffect, useState } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import useStore from "../store/store";

const ChatDetailScreen = () => {
  const { user } = useStore();
  console.log("from chatdetail", user.id);
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId } = route.params;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState(""); // State to hold the new message input

  useEffect(() => {
    const fetchMessages = async () => {
      // Fetch messages using chatId
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true }); // Optional: order by time

      if (error) {
        console.error("Error fetching messages:", error);
        setError("Failed to load messages");
        setLoading(false);
        return;
      }
      setMessages(messages);
      setLoading(false);
    };

    fetchMessages();
  }, [chatId]);

  // Handle new message submission
  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      return; // Don't send empty messages
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          content: newMessage,
          chat_id: chatId,
          sender_id: user.id,
          created_at: new Date(), // Set the current timestamp
        },
      ])
      .select("*"); // Explicitly request the inserted data

    if (error) {
      console.error("Error inserting message:", error);
      return;
    }

    // Add the new message to the message list if data exists
    if (data && data.length > 0) {
      setMessages((prevMessages) => [data[0], ...prevMessages]);
    } else {
      console.error("No data returned from insert query.");
    }

    // Clear the input field after sending
    setNewMessage("");
  };

  // Render each message
  const renderMessage = ({ item }) => (
    <View style={styles.messageContainer}>
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.messageTimestamp}>
        {new Date(item.created_at).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
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

      {/* Display loading indicator */}
      {loading && <ActivityIndicator size="large" color="#007BFF" />}

      {/* Display error message if any */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Render messages */}
      {!loading && !error && (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
        />
      )}

      {/* New message input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={newMessage}
          onChangeText={setNewMessage}
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
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
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
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});
