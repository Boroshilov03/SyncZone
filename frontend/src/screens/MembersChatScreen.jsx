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
import React, { useState, useEffect } from "react";
import FeatherIcon from "react-native-vector-icons/Feather";
import { useRoute } from "@react-navigation/native";
import { Dimensions } from "react-native";
import useStore from "../store/store";


const { height: screenHeight } = Dimensions.get("window"); // Get screen height


const MembersChatScreen = ({ navigation }) => {
  const route = useRoute();
  const { contacts } = route.params;
  const [input, setInput] = useState("");
  const [selectedPeople, setSelectedPeople] = useState([]); // Track selected contact IDs
  const [selectedUsers, setSelectedUsers] = useState([]); // Track selected full user objects
  const { user } = useStore();



  const handleCheckboxToggle = (person) => {
    // Toggle selection for this contact by ID and add/remove full user object
    setSelectedPeople((prevSelectedPeople) => {
      if (prevSelectedPeople.includes(person.id)) {
        return prevSelectedPeople.filter((id) => id !== person.id); // Remove ID from array
      } else {
        return [...prevSelectedPeople, person.id]; // Add ID to array
      }
    });

    setSelectedUsers((prevSelectedUsers) => {
      if (prevSelectedUsers.find((user) => user.id === person.id)) {
        return prevSelectedUsers.filter((user) => user.id !== person.id); // Remove user object from array
      } else {
        return [...prevSelectedUsers, person]; // Add user object to array
      }
    });
  };

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

  const renderContactItem = ({ item }) => (
    <View style={styles.contactItem}>
      {item.profiles.avatar_url ? (
        <Image
          alt="Avatar"
          resizeMode="cover"
          source={{ uri: item.profiles.avatar_url }}
          style={styles.profileImage}
        />
      ) : (
        <View style={[styles.cardImg]}>
          <Text style={styles.cardAvatarText}>
            {item.profiles.first_name[0].toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.wrapperCol}>
        <View style={styles.wrapperRow}>
          <Text style={styles.contactText}>{item.profiles.first_name}</Text>
          <Text style={styles.contactText}>{item.profiles.last_name}</Text>
        </View>
        <Text style={styles.contactUsername}>@{item.profiles.username}</Text>
      </View>
      {/* Checkbox */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => handleCheckboxToggle(item.profiles)} // Pass the contact's profile
      >
        <View
          style={[
            styles.checkboxWrapper,
            {
              backgroundColor: selectedPeople.includes(item.profiles.id)
                ? "#B0D8FF"
                : "#ccc",
            },
          ]}
        >
          {selectedPeople.includes(item.profiles.id) && (
            <View style={styles.checkmark} />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );


  // Filter contacts based on the search input
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        {/* Back Arrow Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Contact")}
        >
          <Image
            source={require("../../assets/icons/back_arrow.webp")}
            style={styles.backArrow}
          />
        </TouchableOpacity>
        {/* Header Title */}
        <Text style={styles.headerTitle}>Add Members</Text>

        {/* Right Arrow Button */}
        <TouchableOpacity
          style={styles.rightArrowButton}
          onPress={() =>
            navigation.navigate("GroupDetails", {
              contacts,
              selectedUsers,
              selectedPeople,
            })
          } // Pass selectedUsers to next screen
        >
          <Image
            source={require("../../assets/icons/back_arrow.webp")}
            style={[styles.backArrow, { transform: [{ rotate: "180deg" }] }]}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
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

      {/* List of Contact Cards */}
      <FlatList
        data={filteredContacts}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.profiles.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
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
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "#444444",
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
    marginHorizontal: 15,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    paddingHorizontal: 15,
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
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  cardAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cardImg: {
    width: 40,
    height: 40,
    marginRight: 10,
    backgroundColor: "#FFADAD",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
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
    top: -2,
  },
});

export default MembersChatScreen;
