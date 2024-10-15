import React, { useState, useEffect } from "react";
import AddContact from "../components/AddContact";
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  SafeAreaView,
  FlatList,
  Image,
} from "react-native";
import useStore from "../store/store";
import { supabase } from "../lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesome } from "@expo/vector-icons"; // For chat and call icons

// Fetch mutual contacts from Supabase
const fetchMutualContacts = async ({ queryKey }) => {
  const [_, userId] = queryKey; // The second element in queryKey is userId
  const { data, error } = await supabase
    .from("contacts")
    .select(
      `profiles:contact_id (id, username, first_name, last_name, avatar_url)`
    )
    .or(`user_id.eq.${userId},contact_id.eq.${userId}`);

  if (error) throw new Error(error.message);
  return data;
};

const ContactScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { user } = useStore();
  const queryClient = useQueryClient();

  // Correct useQuery syntax for v5
  const {
    data: contacts,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["contacts", user?.id], // Query key as an array with the user id
    queryFn: fetchMutualContacts,
    enabled: !!user, // Only run query if the user is defined
  });

  useEffect(() => {
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contacts",
        },
        () => {
          // Refetch contacts whenever a change occurs
          queryClient.invalidateQueries(["contacts", user?.id]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

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
      // Fetch the contact's details for navigation
      const { data: contactData, error: contactError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", contactID)
        .single();

      if (contactError) {
        console.error("Error fetching contact data:", contactError);
        return;
      }

      navigation.navigate("ChatDetail", {
        chatId: chatId,
        username: contactData.username,
        otherPFP: contactData.avatar_url,
      });
      return;
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
    const { error: participantsError } = await supabase
      .from("chat_participants")
      .insert([
        { chat_id: newChat[0].id, user_id: user.id },
        { chat_id: newChat[0].id, user_id: contactID },
      ]);

    if (participantsError) {
      console.error("Error adding participants:", participantsError);
      return;
    }

    // Fetch the contact's details for navigation
    const { data: contactData, error: contactError } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", contactID)
      .single();

    if (contactError) {
      console.error("Error fetching contact data:", contactError);
      return;
    }

    navigation.navigate("ChatDetail", {
      chatId: newChat[0].id,
      username: contactData.username,
      otherPFP: contactData.avatar_url,
    });
  };

  const createCall = (contactID) => {
    console.log("Creating call with", contactID);
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactItem}>
      <View style={styles.wrapperRow}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("Profile", {
              contactID: item.profiles.id,
              contactPFP: item.profiles.avatar_url,
              contactFirst: item.profiles.first_name,
              contactLast: item.profiles.last_name,
              contactUsername: item.profiles.username,
            })
          }
        >
          <Image
            source={{ uri: item.profiles.avatar_url }} // Use avatar_url to load the image
            style={styles.profileImage}
          />
        </TouchableOpacity>
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
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.profiles.id.toString()}
        style={styles.contactList}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Add Contact</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Close modal when back button pressed
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
            <AddContact
              onClose={() => setModalVisible(false)}
              contacts={contacts}
            />
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
  profileImage: {
    width: 50, // Adjust width
    height: 50, // Adjust height
    borderRadius: 25, // Make it circular
    marginRight: 10, // Space between image and text
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
    textAlign: "center",
  },
  contactList: {
    marginBottom: 20,
  },
  contactItem: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 15,
  },
  wrapperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wrapperCol: {
    flex: 1,
  },
  contactText: {
    fontSize: 18,
    fontWeight: "600",
  },
  contactUsername: {
    fontSize: 14,
    color: "#555",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  chatButton: {
    backgroundColor: "#007BAF",
    borderRadius: 5,
    padding: 10,
    marginRight: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  callButton: {
    backgroundColor: "#28a745",
    borderRadius: 5,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    marginLeft: 5,
  },
  addButton: {
    backgroundColor: "#007BAF",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    height: 500, // Changed to auto to fit content dynamically
    padding: 20,
    paddingTop: 40, // Added top padding to create space for the close button
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#333",
  },
});

export default ContactScreen;
