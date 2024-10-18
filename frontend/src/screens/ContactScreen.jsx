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
  TextInput,
} from "react-native";
import useStore from "../store/store";
import { supabase } from "../lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesome } from "@expo/vector-icons"; // For chat and call icons
import FeatherIcon from "react-native-vector-icons/Feather";


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
  const [input, setInput] = useState("");

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
      <View style={styles.headerContainer}>
        {/* Back Arrow Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("MainTabs")}
        >
          <Image
            source={require('../../assets/icons/back_arrow.webp')}
            style={styles.backArrow}
          />
        </TouchableOpacity>

        {/* Header Title */}
        <Text style={styles.headerTitle}>Contacts</Text>

        {/* Add Person Icon */}
        <TouchableOpacity
          style={styles.addPersonButton}
          onPress={() => setModalVisible(true)}
        >
          <Image
            source={require('../../assets/icons/add_person.png')}
            style={styles.addPersonIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.search}>
          <View style={styles.searchIcon}>
            <FeatherIcon color="#848484" name="search" size={17} />
          </View>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            onChangeText={(val) => setInput(val)}
            placeholder="Search by Username"
            placeholderTextColor="#848484"
            returnKeyType="done"
            style={styles.searchControl}
            value={input}
          />
        </View>
      </View>
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.profiles.id.toString()}
        style={styles.contactList}
        showsVerticalScrollIndicator={false}
      />
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',  // Distribute space between items (arrow, title, add icon)
    marginTop: 20,
  },
  backButton: {
    paddingLeft: 10,  // Adds spacing to the left
  },
  backArrow: {
    width: 30,
    height: 30,
    tintColor: 'black',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    flex: 1,  // Takes up remaining space between arrow and add person icon
    textAlign: 'center',  // Centers the title
  },
  addPersonButton: {
    paddingRight: 10,  // Adds spacing to the right
  },
  addPersonIcon: {
    width: 30,  // Adjust size of Add Person icon
    height: 30,
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
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    justifyContent: "center", // Ensures content is centered
  },
  addButtonImage: {
    width: 50, // Adjust the size as needed
    height: 50, // Adjust the size as needed
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
  searchWrapper: {
    marginVertical: 15,
    alignItems: "center", // Center horizontally
    justifyContent: "center", // Center vertically if needed
    flexDirection: "row", // Align in a row
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgb(225, 225, 225)", // Lighter grey background
    borderRadius: 25, // Rounded edges
    paddingHorizontal: 15,
    paddingVertical: 5, // Adjust vertical padding for a shorter height
    borderWidth: 1,
    borderColor: "#d1d1d1", // Light border for definition
    width: '95%', // Set the width to 70% of the container (or adjust as needed)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, // Slight offset to make the shadow subtle
    shadowOpacity: 0.15, 
    shadowRadius: 5, 
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchControl: {
    flex: 1,
    height: 30, // Shorter height for a more compact input
    fontSize: 16,
    color: "#333", // Darker text for contrast
  },
});

export default ContactScreen;
