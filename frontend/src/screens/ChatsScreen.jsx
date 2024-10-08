import {
  StyleSheet,
  Text,
  View,
  Button,
  Image,
  FlatList,
  TextInput,
} from "react-native";
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // Ensure this path is correct
import useStore from "../store/store"; // Ensure this path is correct
const ChatsScreen = () => {
  const { setUser, setAccessToken, setRefreshToken, user } = useStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const conversationId = 1;
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("message")
        .select("*")
        .eq("conversation_id", conversationId);

      if (error) {
        console.log(error);
      } else {
        setMessages(data);
        console.log(data);
      }
    };
    fetchMessages();

    const messageListener = supabase
      .channel("public:message")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Add the new message to the state
          setMessages((currentMessages) => [...currentMessages, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageListener);
    };
  }, [conversationId]);

  // Function to send a message
  const sendMessage = async () => {
    if (newMessage.trim().length > 0) {
      const { error } = await supabase.from("Message").insert([
        {
          conversation_id: conversationId,
          sender_id: 1, // Replace with the actual user ID
          content: newMessage,
          timestamp: new Date(),
        },
      ]);

      if (error) {
        console.error("Error sending message:", error);
      } else {
        setNewMessage(""); // Clear the input field
      }
    }
  };
  // Render each message
  const renderItem = ({ item }) => (
    <View style={styles.messageContainer}>
      <Text style={styles.messageContent}>{item.content}</Text>
      <Text style={styles.messageTimestamp}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut(); // Sign out from Supabase
    if (!error) {
      setUser(null); // Clear user data
      setAccessToken(null); // Clear access token
      setRefreshToken(null); // Clear refresh token
      // Optionally navigate back to the SignIn screen
      // navigation.navigate('SignIn'); // Uncomment if using navigation prop
    } else {
      console.error("Error logging out:", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
      {user ? (
        <>
          <Image
            source={{
              uri:
                user.user_metadata?.avatar_url ||
                "https://placehold.co/100x100",
            }}
            style={styles.profilePhoto}
          />
          <Text style={styles.userName}>
            {user.user_metadata?.first_name || ""}{" "}
            {user.user_metadata?.last_name || ""} (
            {user.user_metadata?.username || "Unknown User"})
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </>
      ) : (
        <Text>No user data available.</Text>
      )}
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

export default ChatsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 16,
    color: "gray",
    marginBottom: 20,
    textAlign: "center",
  },
  messageContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  messageContent: {
    fontSize: 16,
  },
  messageTimestamp: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  input: {
    flex: 1,
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 10,
    marginRight: 10,
  },
});
