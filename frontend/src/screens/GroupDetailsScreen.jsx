import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import FeatherIcon from "react-native-vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { useRoute } from "@react-navigation/native";
import useStore from "../store/store";
import { supabase } from "../lib/supabase";

const GroupDetailsScreen = ({ navigation }) => {
  const route = useRoute();
  const { user } = useStore();
  const { contacts, selectedUsers, selectedPeople } = route.params;
  const [input, setInput] = useState("");
  const [selectedPeopleData, setSelectedPeopleData] = useState(selectedPeople); // Track selected contact IDs in an array

  const createChat = async (selectedPeopleData) => {
    try {
      // Combine user ID with selected participants to form the group participants
      const allParticipants = [user.id, ...selectedPeopleData];

      // Step 1: Check if there's an existing chat with the same participants
      const { data: userChats, error: userChatsError } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id);

      if (userChatsError) throw new Error("Error fetching user's chats.");

      const userChatIds = userChats.map((chat) => chat.chat_id);

      // Get chat IDs for each participant and find common chats among them
      const commonChatIds = await Promise.all(
        allParticipants.map(async (participantId) => {
          const { data } = await supabase
            .from("chat_participants")
            .select("chat_id")
            .eq("user_id", participantId);
          return data ? data.map((chat) => chat.chat_id) : [];
        })
      ).then((chatsArray) =>
        chatsArray.reduce((acc, chatIds) =>
          acc.filter((id) => chatIds.includes(id))
        )
      );

      const existingChatId = commonChatIds.find((id) =>
        userChatIds.includes(id)
      );

      // Step 2: If an existing chat is found, navigate to it
      if (existingChatId) {
        const { data: contactData, error: contactError } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", selectedPeopleData[0]) // Using the first participant as the contact
          .single();

        if (contactError) throw new Error("Error fetching contact data.");

        navigation.navigate("ChatDetail", {
          chatId: existingChatId,
          username: contactData.username,
          otherPFP: contactData.avatar_url,
        });
        return;
      }

      // Step 3: If no existing chat, create a new one
      const { data: newChat, error: newChatError } = await supabase
        .from("chats")
        .insert([{ is_group: true, group_title: input }])
        .select();

      if (newChatError) throw new Error("Error creating new chat.");

      // Add all participants (including the user) to the new chat
      const participants = allParticipants.map((participantId) => ({
        chat_id: newChat[0].id,
        user_id: participantId,
      }));

      const { error: participantsError } = await supabase
        .from("chat_participants")
        .insert(participants);

      if (participantsError) throw new Error("Error adding participants.");

      // Fetch contact data for navigation
      const { data: contactData, error: contactError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", selectedPeopleData[0]) // Using the first participant as the contact
        .single();

      if (contactError) throw new Error("Error fetching contact data.");

      navigation.navigate("ChatDetail", {
        chatId: newChat[0].id,
        username: contactData.username,
        otherPFP: contactData.avatar_url,
        groupTitle: input,
      });
    } catch (error) {
      console.error("Error in createChat:", error.message);
    }
  };

  const handleCheckboxToggle = (id) => {
    // Toggle selection for this contact by adding/removing from setSelectedPeopleData array
    setSelectedPeopleData((prevSelectedIds) => {
      if (prevSelectedIds.includes(id)) {
        return prevSelectedIds.filter((selectedId) => selectedId !== id); // Remove from array
      } else {
        return [...prevSelectedIds, id]; // Add to array
      }
    });
  };

  const renderContactItem = ({ item }) => (
    <View style={styles.contactItem}>
      <Image source={{ uri: item.avatar_url }} style={styles.profileImage} />
      <View style={styles.wrapperCol}>
        <View style={styles.wrapperRow}>
          <Text style={styles.contactText}>{item.first_name}</Text>
          <Text>{}</Text>
          <Text style={styles.contactText}>{item.last_name}</Text>
        </View>

        <Text style={styles.contactUsername}>{item.username}</Text>
      </View>
      {/* Checkbox */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => handleCheckboxToggle(item.id)} // Pass the contact's id to toggle
      >
        <View
          style={[
            styles.checkboxWrapper,
            {
              backgroundColor: selectedPeopleData.includes(item.id)
                ? "#B0D8FF"
                : "#ccc",
            }, // Check if this contact is selected
          ]}
        >
          {selectedPeopleData.includes(item.id) && (
            <View style={styles.checkmark} />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        {/* Back Arrow Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("MembersChat", { contacts })}
        >
          <Image
            source={require("../../assets/icons/back_arrow.webp")}
            style={styles.backArrow}
          />
        </TouchableOpacity>
        {/* Header Title */}
        <Text style={styles.headerTitle}>Group Details</Text>

        {/* Right Arrow Button */}
        <View style={styles.rightArrowButton}>
          <Image
            source={require("../../assets/icons/back_arrow.webp")} // Reuse the same image
            style={[
              styles.backArrow,
              { transform: [{ rotate: "180deg" }] }, // Rotate 180 degrees to point right
              { tintColor: "white" }, // Set the color to white
            ]}
          />
        </View>
      </View>

      <View style={styles.groupchatContainer}>
        {/* Group Chat Picture */}
        <Image
          source={require("../../assets/icons/group_chat.png")} // Replace with the actual image path
          style={styles.groupChatImage}
        />

        {/* Group Name Text Input */}
        <TextInput
          style={styles.groupNameInput}
          placeholder="Group Name"
          value={input} // If you need to handle the input state
          onChangeText={(text) => setInput(text)} // If you need to update input state
        />
      </View>

      <View style={styles.membersTitleContainer}>
        <Text style={styles.membersTitle}>
          Members ({selectedUsers.length + 1})
        </Text>
      </View>

      {/* List of Contact Cards */}
      <FlatList
        data={selectedUsers}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Save Button */}
      <LinearGradient
        colors={["#FFDDF7", "#C5ECFF", "#DEE9FF", "#FFDCF8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <TouchableOpacity onPress={() => createChat(selectedPeopleData)}>
          <Text style={styles.saveButtonText}>Create</Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    zIndex: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "semibold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    zIndex: 3,
  },
  groupchatContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
    height: 80,
    width: 350,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    alignSelf: "center",
    margin: 10,
    borderRadius: 25,
    flexDirection: "row", // Arrange image and text input horizontally
    paddingHorizontal: 15, // Space around content
  },

  groupChatImage: {
    width: 60,
    height: 60,
    borderRadius: 20, // Circular shape for the image
    marginRight: 10, // Space between image and text input
  },

  groupNameInput: {
    flex: 1, // Make the input take available space
    height: 40,
    borderRadius: 20,
    // backgroundColor: "#fff",
    paddingHorizontal: 15,
    fontSize: 22,
    color: "#333",
    // borderWidth: 1,
    borderColor: "#ccc",
  },
  backButton: {
    paddingLeft: 10,
  },
  backArrow: {
    width: 30,
    height: 30,
    tintColor: "black",
  },
  rightArrowButton: {
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
    flex: 1,
    textAlign: "center",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  membersTitleContainer: {
    marginBottom: 10, // Space between the title and the list
    paddingHorizontal: 20, // Optional: add horizontal padding if needed
  },

  membersTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "left", // Center the title
    marginTop: 10,
  },

  contactItem: {
    marginTop: 8,
    backgroundColor: "#D1EBEF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    marginBottom: 5,
    width: "90%",
    alignSelf: "center",
  },
  wrapperCol: {
    flex: 1,
  },
  wrapperRow: {
    flexDirection: "row",
  },
  contactText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  contactUsername: {
    fontSize: 14,
    fontWeight: "300",
    color: "#666",
  },
  checkboxContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  checkboxWrapper: {
    width: 25,
    height: 25,
    backgroundColor: "#ccc",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
  },
  checkmark: {
    width: 8,
    height: 15,
    borderColor: "white",
    borderWidth: 2,
    borderTopWidth: 0,
    borderRightWidth: 0,
    transform: [{ rotate: "50deg" }, { scaleX: -1 }],
  },
  gradientContainer: {
    marginVertical: 20, // Space above and below the button
    alignSelf: "center",
    borderRadius: 25, // Rounded corners
    paddingVertical: 12, // Vertical padding for the button
    width: "30%", // Adjust the button width as needed
  },
  saveButtonText: {
    color: "#fff", // Dark text color for contrast
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.5,
    shadowRadius: 1, // Adds depth and shadow
    elevation: 2, // For Android shadow
  },
});

export default GroupDetailsScreen;