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
  ScrollView,
  PanResponder,
  Button,
  ActivityIndicator,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons"; // For chat and call icons
import FeatherIcon from "react-native-vector-icons/Feather";
import FavoriteIcon from "../components/FavoriteIcon";
import { LinearGradient } from "expo-linear-gradient";
import useStore from "../store/store";
import { supabase } from "../lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Profile from "./ProfileScreen";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Dimensions } from "react-native";
import SplashScreen from "./SplashScreen";

const { height: screenHeight } = Dimensions.get("window"); // Get screen height
const { width, height } = Dimensions.get('window');
const scale = width / 375; // 375 is the base width (for example, iPhone 6)
const fontSize = 12 * scale; // Adjust base size (10) based on screen width

// Fetch mutual contacts from Supabase
const fetchMutualContacts = async ({ queryKey }) => {
  const [_, userId] = queryKey; // The second element in queryKey is userId
  const { data, error } = await supabase
    .from("contacts")
    .select(
      `profiles:contact_id (id, username, first_name, last_name, avatar_url)`
    )
    .or(`user_id.eq.${userId},contact_id.eq.${userId}`)
    .neq("contact_id", userId); // Exclude the logged-in user's ID

  if (error) throw new Error(error.message);
  return data;
};
const ContactScreen = ({ navigation }) => {
  const [profileVisible, setProfileVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [input, setInput] = useState("");
  const [favorites, setFavorites] = useState([]);
  const { user } = useStore();
  const queryClient = useQueryClient();
  const [members, setMembers] = useState();
  const flatListRef = useRef(null);

  const {
    data: contacts,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: fetchMutualContacts,
    enabled: !!user,
  });

  const groupContactsByLetter = (contacts) => {
    if (!contacts || contacts.length === 0) return {}; // Return empty object if no contacts

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
  const groupedData = Object.keys(groupedContacts).map((letter) => ({
    letter,
    contacts: groupedContacts[letter],
  }));

  // Function to render grouped contacts under each letter
  const RenderGroupedContacts = ({ item }) => (
    <View>
      <Text style={styles.groupHeader}>{item.letter}</Text>
      {item.contacts.map((contact, index) => (
        <RenderContact key={`${contact.profiles.id}-${index}`} item={contact} />
      ))}
    </View>
  );

  const RenderContact = ({ item }) => (
    <View style={styles.contactContainer}>
      <Text>{item.profiles.username}</Text>
    </View>
  );
  // Function to scroll to the selected letter section
  const scrollToLetter = (letter) => {
    // Check if groupedData is empty
    if (!groupedData || groupedData.length === 0) {
      return; // Do nothing if there are no contacts
    }

    const index = groupedData.findIndex((item) => item.letter === letter);

    if (index !== -1 && flatListRef.current) {
      // If the letter exists, scroll to its section
      flatListRef.current.scrollToIndex({ index });
    } else {
      // If the letter does not exist, find the closest letter
      const availableLetters = groupedData.map((item) => item.letter);

      // Find the closest letter alphabetically
      let closestLetter = availableLetters.reduce((prev, curr) => {
        return Math.abs(curr.charCodeAt(0) - letter.charCodeAt(0)) <
          Math.abs(prev.charCodeAt(0) - letter.charCodeAt(0))
          ? curr
          : prev;
      });

      // Find the index of the closest letter
      const closestIndex = groupedData.findIndex(
        (item) => item.letter === closestLetter
      );
      if (closestIndex !== -1 && flatListRef.current) {
        // Scroll to the closest available section
        flatListRef.current.scrollToIndex({ index: closestIndex });
      }
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

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    toggleFavorite(item.profiles.id); // Call the function to handle favorite toggling
  };

  const AlphabetList = ({ onLetterPress, onSwipeLetter, hasContacts }) => {
    const [alphabetWidth, setAlphabetWidth] = useState(0); // State to store alphabet item width
    const alphabetRef = useRef(); // Reference to track the position of the alphabet

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split(""); // Alphabet array

    // Helper function to calculate which letter corresponds to the Y position
    const getLetterFromPosition = (y) => {
      const letterHeight = alphabetWidth / alphabet.length;
      const index = Math.floor(y / letterHeight);
      if (index >= 0 && index < alphabet.length) {
        return alphabet[index];
      }
      return null;
    };

    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: () => hasContacts, // Only enable pan gesture if there are contacts
      onPanResponderGrant: (evt, gestureState) => {
        const { y0 } = gestureState;
        if (hasContacts) {
          const letter = getLetterFromPosition(y0);
          if (letter) onSwipeLetter(letter); // Trigger scroll to the letter on touch start
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const { moveY } = gestureState;
        if (hasContacts) {
          const letter = getLetterFromPosition(moveY);
          if (letter) onSwipeLetter(letter); // Trigger scroll to the letter on move
        }
      },
      onPanResponderRelease: () => {
        // Optional: Handle release event, e.g., resetting state if needed
      },
    });

    // Measure the width of the alphabet letters dynamically
    const onLayout = (event) => {
      const { height } = event.nativeEvent.layout;
      setAlphabetWidth(height); // Calculate the height of the alphabet column
    };

    return (
      <View style={styles.wrapperAlphabet}>
        <View
          style={styles.alphabetIndex}
          onLayout={onLayout}
          {...panResponder.panHandlers} // Attach pan gesture handlers
        >
          {alphabet.map((letter, index) => (
            <TouchableOpacity
              key={`${letter}-${index}`}
              style={styles.alphabetLetter} // Ensure enough padding and clickable space
              onPress={() => onLetterPress(letter)} // Handle tap
              activeOpacity={0.7} // Provides visual feedback on press
            >
              <Text style={styles.alphabetText}>{letter}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const handleLetterPress = (letter) => {
    scrollToLetter(letter); // Scroll on tap
  };

  const handleSwipeLetter = (letter) => {
    scrollToLetter(letter); // Scroll on swipe
  };

  // Safely access `contacts` when calling `.filter()`
  const filteredContacts = (contacts || []).filter(
    (contact) =>
      contact.profiles.username.toLowerCase().includes(input.toLowerCase()) ||
      contact.profiles.first_name.toLowerCase().includes(input.toLowerCase()) ||
      contact.profiles.last_name.toLowerCase().includes(input.toLowerCase())
  );

  // If no search input, show full contact list grouped by letter, otherwise show filtered contacts
  const dataToRender = input.length > 0 ? filteredContacts : groupedData;
  useEffect(() => {
    const fetchFavorites = async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("contact_id")
        .eq("user_id", user.id);
      if (!error) {
        // Store favorite contact IDs
        setFavorites(data.map((fav) => fav.contact_id));
      } else {
        console.error("Error fetching favorites:", error);
      }
    };

    fetchFavorites();
  }, [user]);

  const toggleFavorite = async (contactID) => {
    if (favorites.includes(contactID)) {
      // If the contact is already a favorite, remove them
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("contact_id", contactID);

      if (!error) {
        setFavorites(favorites.filter((id) => id !== contactID));
      } else {
        console.error("Error removing favorite:", error);
      }
    } else {
      // If the contact is not a favorite, add them
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, contact_id: contactID });

      if (!error) {
        setFavorites([...favorites, contactID]);
      } else {
        console.error("Error adding favorite:", error);
      }
    }
  };

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

  // Function to handle group chat creation
  const createGroupChat = () => {
    console.log("Create Group Chat Pressed");
    navigation.navigate("MembersChat", { contacts }); // Navigate to Members screen
  };

  const renderContact = ({ item }) => {
    const contactInfo = {
      contactID: item.profiles.id,
      contactPFP: item.profiles.avatar_url,
      contactFirst: item.profiles.first_name,
      contactLast: item.profiles.last_name,
      contactUsername: item.profiles.username,
      //setModalVisible: setProfileVisible,
    };
    const isFavorite = favorites.includes(item.profiles.id);

    return (
      <View style={styles.contactItem}>
        <View style={styles.wrapperRow}>
          <TouchableOpacity
            style={styles.touch}
            onPress={() => {
              setProfileVisible(true);
              setSelectedContact(contactInfo);
            }}
          >
            <Modal
              animationType="fade"
              transparent={true}
              visible={profileVisible}
              onRequestClose={() => setProfileVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Pressable onPress={() => setProfileVisible(false)}>
                    <Ionicons
                      name="close"
                      size={40}
                      color="#616061"
                      style={styles.close}
                    />
                  </Pressable>
                  <Profile
                    {...selectedContact}
                    setProfileVisible={setProfileVisible}
                    navigation={navigation}
                  />
                </View>
              </View>
            </Modal>
            {item.profiles.avatar_url ? (
              <Image
                source={{ uri: item.profiles.avatar_url }} // Use avatar_url to load the image
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.cardImg, styles.cardAvatar]}>
                <Text style={styles.cardAvatarText}>
                  {item.profiles.first_name[0].toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.wrapperCol}>
            <Text style={styles.contactText}>
              {item.profiles.first_name} {item.profiles.last_name}
            </Text>
            <Text style={styles.contactUsername}>
              @{item.profiles.username}
            </Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.favButton}
              onPress={() => toggleFavorite(item.profiles.id)}
            >
              <Image
                source={
                  isFavorite
                    ? require("../../assets/icons/red-heart.png") // Red heart if favorite
                    : require("../../assets/icons/white-heart.png") // White heart if not favorite
                }
                style={styles.favoriteIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => createChat(item.profiles.id)}
            >
              <Image
                source={require("../../assets/icons/chat-contact.png")}
                style={styles.chatIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };
  // Render grouped contacts
  const renderGroup = ({ item }) => (
    <View>
      {/* Title (letter) above the contact cards */}
      <Text style={styles.letterHeader}>{item.letter}</Text>
      {item.contacts.map((contact, index) => (
        // Adding a unique key for each contact
        <View key={contact.id}>{renderContact({ item: contact })}</View>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <SplashScreen />
      // <ActivityIndicator
      //   size="large"
      //   color="lightblue"
      //   style={{
      //     position: "absolute",
      //     top: "50%",
      //     left: "50%",
      //   }}
      // />
    );
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
            source={require("../../assets/icons/back_arrow.webp")}
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
            source={require("../../assets/icons/add_person.png")}
            style={styles.addPersonIcon}
          />
        </TouchableOpacity>
      </View>

      <AlphabetList
        onLetterPress={handleLetterPress} // Handle tap
        onSwipeLetter={handleSwipeLetter} // Handle swipe
      />

      <View style={styles.GCContainer}>
        <View style={styles.groupchatContainer}>
          {/* Group Chat Button */}
          <LinearGradient
            colors={["#FFDDF7", "#C5ECFF", "#DEE9FF", "#FFDCF8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientContainer} // Apply the gradient to the groupContainer
          >
            <TouchableOpacity
              style={styles.groupButton}
              onPress={() => {
                // Creating a group chat
                createGroupChat();
              }}
            >
              <View style={styles.buttonContent}>
                <Image
                  source={require("../../assets/icons/group_chat.png")}
                  style={styles.groupButtonImage}
                />
                <Text style={styles.buttonText}>Create Group</Text>
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
            placeholder="Search"
            placeholderTextColor="#848484"
            returnKeyType="done"
            style={styles.searchControl}
            value={input}
          />
        </View>
      </View>
      <FlatList
        ref={flatListRef}
        data={dataToRender} // Render either filtered or full contacts
        renderItem={input.length > 0 ? renderContact : renderGroup}
        keyExtractor={(item, index) =>
          input.length > 0 ? item.profiles.id : item.letter + index
        }
        style={styles.flatList}
        showsVerticalScrollIndicator={false}
        getItemLayout={(data, index) => ({
          length: 100, // Adjust item height as needed
          offset: 100 * index, // Adjust for the actual item height
          index,
        })}
      />
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Close modal when back button pressed
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <AddContact
              onClose={() => setModalVisible(false)}
              contacts={contacts}
            />
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
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
  profileImage: {
    width: 50, // Adjust width
    height: 50, // Adjust height
    borderRadius: 25, // Make it circular
    marginRight: 10, // Space between image and text
  },
  cardImg: {
    width: 50,
    height: 50,
    marginRight: 8,
    backgroundColor: "#FFADAD", // soft coral to complement pastel blue
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
  },
  cardAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF", // keeping the text white for readability
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 40,
    zIndex: 3,
  },
  favoriteIcon: {
    width: 22,
    height: 22,
    borderRadius: 155,
    justifyContent: "center",
    alignItems: "center",
    // margin: 20,
    //borderWidth: 3,
  },
  backButton: {
    paddingLeft: 10,
  },
  backArrow: {
    width: 30,
    height: 30,
    tintColor: "black",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "#444444",
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
    alignItems: "flex-start", // Center the profile image and text
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
    width: "90%", // Adjust the width to a percentage or fixed value
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
    fontSize: 16,
    fontWeight: "semibold",
  },
  contactUsername: {
    fontSize: 14,
    fontWeight: "300", // Use '300' for light or '400' for regular
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center", // Center them horizontally
    gap: 10,
  },
  favButton: {
    backgroundColor: "#FFC5D3",
    borderRadius: 25, // Circular shape
    // padding: 10,
    elevation: 10, // Depth effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#FFC5D3", // Matching pastel blue border
    width: 35, // Reduced button width
    height: 35, // Reduced button height
    justifyContent: "center",
    alignItems: "center",
  },
  chatButton: {
    backgroundColor: "rgba(195, 217, 246, 0.85)", // Soft pastel blue (same as the original)
    borderRadius: 25, // Circular shape
    // padding: 10,
    elevation: 10, // Depth effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(195, 217, 246, 0.85)", // Matching pastel blue border
    width: 35, // Reduced button width
    height: 35, // Reduced button height
    justifyContent: "center",
    alignItems: "center",
  },

  callButton: {
    backgroundColor: "rgba(158, 228, 173, 0.85)", // Pastel green (soft and pastel)
    borderRadius: 25, // Circular shape
    elevation: 10, // Same shadow as chatButton
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(158, 228, 173, 0.85)", // Matching pastel green border
    width: 35, // Reduced button width
    height: 35, // Reduced button height
    justifyContent: "center",
    alignItems: "center",
  },

  chatIcon: {
    width: 20,
    height: 20,
  },

  callIcon: {
    width: 20, // Fixed size of icon for consistency
    height: 20, // Fixed size of icon for consistency
    // top: "50%", // Center vertically
    left: 2,
    // transform: [{ translateY: -9 }], // Adjust to center it vertically
  },

  addButtonImage: {
    width: 50,
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  modalContent: {
    width: "85%",
    height: "70%",
    padding: 40,
    paddingTop: 40,
    backgroundColor: "#fff",
    borderRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    backgroundColor: "#FFABAB", // Cancel button color
    borderRadius: 25,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginRight: 15,
    width: "40%",
    alignSelf: "center",
    top: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
  },
  searchWrapper: {
    marginVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  search: {
    position: "relative",
    backgroundColor: "rgb(240, 240, 240)",
    justifyContent: "center",
    marginHorizontal: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#d1d1d1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIcon: {
    marginLeft: 10,
  },
  searchControl: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 5,
  },

  flatList: {
    flex: 1,
  },
  wrapperAlphabet: {
    position: "absolute",
    right: 0,
    paddingTop: 20,
    marginVertical: "50%",
    zIndex: 100,
    paddingHorizontal: 2,
    justifyContent: 'center'
  },
  alphabetIndex: {
    position: "relative",
    paddingHorizontal: 5,
    zIndex: 100,
  },
  alphabetLetter: {
    paddingVertical: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  alphabetText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
  },
  alphabetItem: {
    fontSize: 16, // Smaller text size
    color: "#555", // Lighter text color
  },
  letterHeader: {
    fontSize: 24,
    fontWeight: "semibold",
    color: "#333",
    marginBottom: 5,
    marginLeft: 10,
  },
  GCContainer: {
    justifyContent: "center", // Vertically center content
    alignItems: "center", // Horizontally center content
    marginTop: 20,
    marginBottom: 10,
  },
  groupchatContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2, // Adds depth and shadow
    elevation: 5, // For Android shadow
    height: 35, // Smaller height
    width: 200, // Smaller width
    justifyContent: "center", // Center content vertically
    alignItems: "center", // Center content horizontally
  },
  gradientContainer: {
    flexDirection: "row",
    borderRadius: 30, // Circular shape (bubble effect)
    paddingHorizontal: 5, // Shortened padding for smaller width
    justifyContent: "center",
  },
  groupButton: {
    flexDirection: "row", // Align text and icon in a row
    alignItems: "center", // Vertically center the content
    paddingHorizontal: 15, // Shortened padding for smaller width
    paddingVertical: 5, // Vertical padding to make the button bigger
    borderRadius: 30, // Circular shape (bubble effect)
  },
  groupButtonImage: {
    width: 40, // Adjust the size of the icon
    height: 40, // Adjust the size of the icon
    marginRight: 10, // Space between the icon and text
  },
  buttonText: {
    fontSize: 18, // Adjust font size as needed
    color: "white", // White text color
    fontWeight: "bold", // Bold text for emphasis
    textShadowColor: "#848484", // Grey outline color
    textShadowOffset: { width: 1, height: 1 }, // Controls the position of the shadow
    textShadowRadius: 3, // Controls the blur of the shadow
    shadowColor: "#000", // Black shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2, // Adds depth and shadow
    elevation: 3, // For Android shadow
  },
  buttonContent: {
    flexDirection: "row", // Arrange icon and text in a row
    alignItems: "center", // Center items vertically
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  modalContent: {
    width: "85%",
    height: "70%",
    padding: 40,
    paddingTop: 40,
    backgroundColor: "#fff",
    borderRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default ContactScreen;
