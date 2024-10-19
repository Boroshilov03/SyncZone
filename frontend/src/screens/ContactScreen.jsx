import React, { useState, useEffect, useRef } from "react";
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
  SectionList,
} from "react-native";
import useStore from "../store/store";
import { supabase } from "../lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesome } from "@expo/vector-icons"; // For chat and call icons
import FeatherIcon from "react-native-vector-icons/Feather";
import FavoriteIcon from "../components/FavoriteIcon";
import { LinearGradient } from "expo-linear-gradient";



// Fetch mutual contacts from Supabase
const fetchMutualContacts = async ({ queryKey }) => {
  const [_, userId] = queryKey; // The second element in queryKey is userId
  const { data, error } = await supabase
    .from("contacts")
    .select(
      `profiles:contact_id (id, username, first_name, last_name, avatar_url)`)
    .or(`user_id.eq.${userId},contact_id.eq.${userId}`);

  if (error) throw new Error(error.message);
  return data;
};


const ContactScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { user } = useStore();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");

  const flatListRef = useRef(null); // Add this line at the top of the component


  const { data: contacts, error, isLoading } = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: fetchMutualContacts,
    enabled: !!user,
  });

  const groupContactsByLetter = (contacts) => {
    // First, sort contacts alphabetically by their first name
    const sortedContacts = contacts.sort((a, b) => 
      a.profiles.first_name.localeCompare(b.profiles.first_name)
    );
  
    return sortedContacts.reduce((acc, contact) => {
      const firstLetter = contact.profiles.first_name[0].toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(contact);
      return acc;
    }, {});
  };
  
  // Then render the grouped data
  const groupedContacts = groupContactsByLetter(contacts || []);
  const groupedData = Object.keys(groupedContacts).map(letter => ({
    letter,
    contacts: groupedContacts[letter],
  }));
  

  const scrollToLetter = (letter) => {
    const index = contacts.findIndex(contact =>
      contact.profiles.first_name[0].toUpperCase() === letter
    );
    if (index !== -1) {
      flatListRef.current.scrollToIndex({ index });
    }
  };



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

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    toggleFavorite(item.profiles.id); // Call the function to handle favorite toggling
  };

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split(""); // Alphabet array

const AlphabetList = ({ onLetterPress }) => (
  <View style={styles.alphabetIndex}>
    {alphabet.map((letter) => (
      <TouchableOpacity
        key={letter}
        style={styles.alphabetLetter}
        onPress={() => onLetterPress(letter)}
      >
        <Text style={styles.alphabetText}>{letter}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

{/* <FlatList
  ref={flatListRef} // Attach the ref here
  data={contacts}
  renderItem={renderContact}
  keyExtractor={(item) => item.profiles.id.toString()}
  style={styles.contactList}
  showsVerticalScrollIndicator={false}
/>
 */}

<FlatList
  data={groupedData}
  renderItem={renderGroup}
  keyExtractor={(item) => item.letter} // Use the letter as the key
  style={styles.contactList}
  showsVerticalScrollIndicator={false}
/>

const filteredContacts = contacts.filter(contact => 
  contact.profiles.username.toLowerCase().includes(input.toLowerCase())
);



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

  // Function to handle group chat creation
  const createGroupChat = () => {
    // Implement your logic here, such as navigating to a create group screen
    console.log("Create Group Chat Pressed");
  };


  const renderContact = ({ item }) => (
<View style={styles.contactItem}>
  <View style={styles.wrapperRow}>
    {/* Profile Image and Touchable to navigate to Profile */}
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
        source={{ uri: item.profiles.avatar_url }} // Load the profile image using avatar_url
        style={styles.profileImage}
      />
    </TouchableOpacity>

    {/* Contact's Name and Username */}
    <View style={styles.wrapperCol}>
      <Text style={styles.contactText}>
        {item.profiles.first_name} {item.profiles.last_name}
      </Text>
      <Text style={styles.contactUsername}>@{item.profiles.username}</Text>
    </View>

    {/* Chat and Call buttons */}
    <View style={styles.buttonContainer}>
      <Pressable
      style={styles.favoriteButton}
      onPress={() => toggleFavorite(item.profiles.id)} // Call the function to handle favorite toggling
    >
      <FavoriteIcon isFavorite={item.profiles.isFavorite} />
    </Pressable>
    <TouchableOpacity
        style={styles.chatButton}
        onPress={() => createChat(item.profiles.id)}
      >
        <FontAwesome name="comment" size={20} color="#fff" style={styles.chatIcon} />
      </TouchableOpacity>

      {/* Call Button */}
      <TouchableOpacity
        style={styles.callButton}
        onPress={() => createCall(item.profiles.id)}
      >
        <FontAwesome name="phone" size={20} color="#fff" style={styles.callIcon} />
      </TouchableOpacity>
    </View>
  </View>
</View>
);

  // Render grouped contacts
  const renderGroup = ({ item }) => (
    <View style={styles.groupContainer}>
      {/* Title (letter) above the contact cards */}
      <Text style={styles.letterHeader}>{item.letter}</Text>
      {item.contacts.map((contact) => renderContact({ item: contact }))}
    </View>
  );

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }


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
        <AlphabetList
          style={[styles.alphabetIndex, { position: 'absolute' }]} // Adding 'absolute' here
          renderItem={({ item }) => (
            <Text style={styles.alphabetItem}>{item}</Text>
          )}
          onLetterPress={(letter) => scrollToLetter(letter)}
        />
      </View>

      <View style={styles.GCContainer}>

      <View style={styles.groupchatContainer}>
      {/* Group Chat Button */}
      <LinearGradient
        colors={['#FFDDF7', '#C5ECFF', '#DEE9FF', '#FFDCF8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}  // Apply the gradient to the groupContainer
      >
        <TouchableOpacity
          style={styles.groupButton}
          onPress={() => {
            // Creating a group chat
            createGroupChat(item.profiles.id);
          }}
        >
          <View style={styles.buttonContent}>
            {/* Icon */}
            <Image
              source={require("../../assets/icons/group_chat.png")}
              style={styles.groupButtonImage}
            />
            {/* Text */}
            <Text style={styles.buttonText}>Create Group Chat</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
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
        ref={flatListRef}
        data={groupedData}
        renderItem={renderGroup}
        keyExtractor={(item) => item.letter}
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
    backgroundColor: "#fff",

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
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    paddingLeft: 10,
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
    flex: 1,
    textAlign: 'center',
  },
  addPersonButton: {
    paddingRight: 10,
  },
  addPersonIcon: {
    width: 25,
    height: 25,
  },
  contactItem: {
    marginTop: 8,
    backgroundColor: "#D1EBEF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, 
    flexDirection: "row", // Align content horizontally
    // alignItems: "center", // Center the profile image and text
    alignItems: "left", // Center the profile image and text
    justifyContent: "space-between", // Space between profile and contact details
    // borderWidth: 1,
    // borderColor: "#000",
    borderRadius: 25,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginHorizontal: 10,
    marginBottom: 5,
    width: '90%', // Adjust the width to a percentage or fixed value
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
    alignItems: "center",     // Center them horizontally
  },
  chatButton: {
    backgroundColor: "rgba(195, 217, 246, 0.85)",  // Soft pastel blue (same as the original)
    borderRadius: 25,  // Circular shape
    padding: 10,
    elevation: 10,  // Depth effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(195, 217, 246, 0.85)",  // Matching pastel blue border
    marginLeft: 3,
    width: 35,  // Reduced button width
    height: 35,  // Reduced button height
  },
  
  callButton: {
    backgroundColor: "rgba(158, 228, 173, 0.85)",  // Pastel green (soft and pastel)
    borderRadius: 25,  // Circular shape
    padding: 10,
    elevation: 10,  // Same shadow as chatButton
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(158, 228, 173, 0.85)",  // Matching pastel green border
    marginLeft: 10,
    width: 35,  // Reduced button width
    height: 35,  // Reduced button height
  },
  
  chatIcon: {
    width: 20,  // Fixed size of icon for consistency
    height: 20, // Fixed size of icon for consistency
    top: "45%",  // Center vertically
    left: "50%",  // Center horizontally
    transform: [{ translateX: -10 }, { translateY: -10 }], // Adjust to truly center it
  },
  
  callIcon: {
    width: 20,  // Fixed size of icon for consistency
    height: 20, // Fixed size of icon for consistency
    top: "50%",  // Center vertically
    right: 1,
    transform: [{ translateY: -9 }], // Adjust to center it vertically
  },
  
  
  
  addButtonImage: {
    width: 50,
    height: 50,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    height: 500,
    padding: 20,
    paddingTop: 40,
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
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgb(240, 240, 240)",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#d1d1d1",
    width: '90%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchControl: {
    flex: 1,
    height: 30,
    fontSize: 16,
    color: "#333",
  }, 
  alphabetIndex: {
    position: 'absolute',
    right: 0,
    top: 180,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  alphabetLetter: {
    paddingVertical: 1,
  },
  alphabetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  }, 
  alphabetItem: {
    fontSize: 10,           // Smaller text size
    color: "#555",          // Lighter text color
    paddingVertical: 5,     // Space between letters
  },
  letterHeader: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5, // Space between the letter and line
    marginLeft: 10,
  },
  GCContainer: {
    justifyContent: 'center',        // Vertically center content
    alignItems: 'center',            // Horizontally center content
    marginTop: 20,
    marginBottom: 10,
  },
  groupchatContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,               // Adds depth and shadow
    elevation: 5,                  // For Android shadow  
    height: 35,                    // Smaller height
    width: 200,                    // Smaller width  
    justifyContent: 'center',       // Center content vertically
    alignItems: 'center',           // Center content horizontally
  },
  gradientContainer: {
    flexDirection: 'row',
    borderRadius: 30,              // Circular shape (bubble effect)
    paddingHorizontal: 5,         // Shortened padding for smaller width
    justifyContent: 'center',
  },
  groupButton: {
    flexDirection: 'row',          // Align text and icon in a row
    alignItems: 'center',          // Vertically center the content
    paddingHorizontal: 15,         // Shortened padding for smaller width
    paddingVertical: 5,           // Vertical padding to make the button bigger
    borderRadius: 30,              // Circular shape (bubble effect)
    justifyContent: 'center',
  },
  groupButtonImage: {
    width: 40,                     // Adjust the size of the icon
    height: 40,                    // Adjust the size of the icon
    marginRight: 10,               // Space between the icon and text
  },
  buttonText: {
    fontSize: 18,                  // Adjust font size as needed
    color: '#fff',                 // White text color
    fontWeight: 'bold',            // Bold text for emphasis
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,               // Adds depth and shadow
    elevation: 3,                  // For Android shadow
  },
  buttonContent: {
    flexDirection: 'row',          // Arrange icon and text in a row
    alignItems: 'center',          // Center items vertically
    justifyContent: 'center',
  },
});

export default ContactScreen;
