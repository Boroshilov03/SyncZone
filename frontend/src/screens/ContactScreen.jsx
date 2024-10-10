import React, { useState } from "react";
import AddContact from "../components/AddContact";
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  SafeAreaView,
  FlatList,
} from "react-native";
import useStore from "../store/store";
import { supabase } from "../lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { FontAwesome } from "@expo/vector-icons"; // For chat and call icons

// Fetch mutual contacts from Supabase
const fetchMutualContacts = async ({ queryKey }) => {
  const [_, userId] = queryKey; // The second element in queryKey is userId
  const { data, error } = await supabase
    .from("contacts")
    .select(`profiles:contact_id (id, username, first_name, last_name)`)
    .or(`user_id.eq.${userId},contact_id.eq.${userId}`);

  if (error) throw new Error(error.message);
  return data;
};

const ContactScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { user } = useStore();

  // Correct useQuery syntax for v5, passing options as a single object
  const {
    data: contacts,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["contacts", user?.id], // Query key as an array with the user id
    queryFn: fetchMutualContacts, // Function to fetch the contacts
    enabled: !!user, // Only run query if the user is defined
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error fetching contacts: {error.message}</Text>
      </View>
    );
  }

  const createChat = async (contactID) => {
    // console.log("my id", user.id);
    // console.log("creating chat... with ", contactID);

    // Check if a 1-on-1 chat already exists between the two users
    const { data: existingChats, error: chatError } = await supabase
      .from("chats")
      .select("id")
      .eq("is_group", false)
      .in(
        "id",
        (
          await supabase
            .from("chat_participants")
            .select("chat_id")
            .eq("user_id", user.id)
        ).data.map((chat) => chat.chat_id)
      )
      .in(
        "id",
        (
          await supabase
            .from("chat_participants")
            .select("chat_id")
            .eq("user_id", contactID)
        ).data.map((chat) => chat.chat_id)
      );

    if (chatError) {
      console.error("Error checking existing chats:", chatError);
      return;
    }

    // If chat already exists, return its ID
    if (existingChats && existingChats.length > 0) {
      const chatId = existingChats[0].id;
      console.log("Chat already exists with ID:", chatId);
      navigation.navigate("ChatDetail", { chatId }); // Navigate to the chat screen
    }

    // If no chat exists, create a new one
    const { data: newChat, error: newChatError } = await supabase
      .from("chats")
      .insert([{ is_group: false }])
      .select();

    if (newChatError) {
      console.error("Error creating new chat:", newChatError);
      return;
    }

    // Add both users to the participants table
    const { data: participants, error: participantsError } = await supabase
      .from("chat_participants")
      .insert([
        { chat_id: newChat[0].id, user_id: user.id },
        { chat_id: newChat[0].id, user_id: contactID },
      ]);

    if (participantsError) {
      console.error("Error adding participants:", participantsError);
      return;
    }

    console.log("Chat created with ID:", newChat[0].id);
    return newChat.id;
  };

  const createCall = (contactID) => {
    console.log("creating call...with", contactID);
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactItem}>
      <View style={styles.wrapperRow}>
        <View style={styles.wrapperCol}>
          <Text style={styles.contactText}>
            {item.profiles.first_name} {item.profiles.last_name}
          </Text>
          <Text style={styles.contactUsername}>@{item.profiles.username}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => createChat(item.profiles.id)}
          >
            <FontAwesome name="comment" size={20} color="#fff" />
            <Text style={styles.buttonText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => createCall(item.profiles.id)}
          >
            <FontAwesome name="phone" size={20} color="#fff" />
            <Text style={styles.buttonText}>Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate("MainTabs")}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Contacts</Text>
      {/* Contact List */}
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.profiles.id.toString()}
        style={styles.contactList}
        showsVerticalScrollIndicator={false}
      />

      {/* Custom Add Contact button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Add Contact</Text>
      </TouchableOpacity>

      {/* Modal for adding contacts */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Close modal when back button pressed
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Close button for modal */}
            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>

            {/* Render the AddContact component inside the modal */}
            <AddContact />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    margin: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  backButton: {
    padding: 10,
    marginBottom: 20,
    backgroundColor: "#007BAF",
    borderRadius: 5,
    width: 100,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  addButton: {
    padding: 15,
    backgroundColor: "#11b0A5",
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  contactList: {
    flex: 1,
    marginVertical: 10,
  },
  wrapperRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between", // Space out items in the row
    alignItems: "center",
  },
  wrapperCol: {
    display: "flex",
  },
  contactItem: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactText: {
    fontSize: 18,
    color: "#333",
  },
  contactUsername: {
    fontSize: 14,
    color: "#777",
  },
  buttonContainer: {
    flexDirection: "row",
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50", // Green for chat
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007BAF", // Blue for call
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    height: 300,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    alignSelf: "flex-end",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#333",
  },
});

export default ContactScreen;
