import { supabase } from "../lib/supabase";
import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Animated,
} from "react-native";
import { debounce } from "lodash";
import useStore from "../store/store";
import { Feather as FeatherIcon } from "@expo/vector-icons";
import { Dimensions } from "react-native";

const { height: screenHeight } = Dimensions.get("window"); // Get screen height


const AddContact = ({ toggleModal }) => {
  const [searchQuery, setSearchQuery] = useState(""); // Store search query
  const [profiles, setProfiles] = useState([]); // Store search results
  const [contacts, setContacts] = useState([]); // Store user's contacts
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(""); // Error state
  const { user } = useStore();

  // Fetch contacts for the user when component mounts or user changes
  React.useEffect(() => {
    const fetchContacts = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("contacts")
          .select("contact_id")
          .eq("user_id", user.id);
        if (error) {
          console.error("Error fetching contacts:", error);
        } else {
          setContacts(data || []);
        }
      }
    };

    fetchContacts();
  }, [user]);

  // Function to fetch profiles based on the search query
  const searchProfiles = async (query) => {
    try {
      setLoading(true);
      setError(""); // Reset error on new search

      console.log("Searching profiles with query:", query); // Debugging

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, first_name, last_name, avatar_url")
        .ilike("username", `%${query}%`)
        .neq("id", user.id); // Ensure you exclude the current user

      if (error) {
        console.error("Error searching profiles:", error);
        setError("Failed to fetch profiles. Please try again.");
      } else {
        console.log("Fetched profiles:", data); // Debugging

        // Filter out contacts already in user's contacts
        const filteredData = data.filter(
          (profile) =>
            !contacts.some((contact) => contact.contact_id === profile.id) // Correct filtering
        );
        setProfiles(filteredData || []); // Update state with fetched profiles
      }
    } catch (err) {
      console.error("Unexpected error during search:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Debounce search function to reduce API calls
  const debouncedSearch = debounce((query) => {
    searchProfiles(query);
  }, 300); // Delay of 300ms

  // Handle text input changes
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    debouncedSearch(query); // Trigger search after debouncing
  };

  // Function to add a contact
  const handleAdd = async (contactID) => {
    if (!user) {
      console.error("User is not logged in.");
      return; // Exit if the user is not logged in
    }

    console.log("Adding user with ID:", contactID);
    console.log("My ID:", user.id);

    // Optimistically disable the button by marking the contact as added
    setProfiles((prevProfiles) =>
      prevProfiles.map((profile) =>
        profile.id === contactID ? { ...profile, added: true } : profile
      )
    );

    try {
      // Insert the first entry: user_id and contact_id
      const { data: firstEntryData, error: firstEntryError } = await supabase
        .from("contacts")
        .insert({ user_id: user.id, contact_id: contactID })
        .select();

      if (firstEntryError) {
        throw new Error(firstEntryError.message); // Throw error to handle below
      }

      // Insert the second entry: contact_id and user_id
      const { data: secondEntryData, error: secondEntryError } = await supabase
        .from("contacts")
        .insert({ user_id: contactID, contact_id: user.id })
        .select();

      if (secondEntryError) {
        // If the second add fails, revert the optimistic update and log error
        console.error(
          "Error adding contact (reverse):",
          secondEntryError.message
        );
        setError("Failed to add contact (reverse). Please try again.");

        // Revert the optimistic update
        setProfiles((prevProfiles) =>
          prevProfiles.map((profile) =>
            profile.id === contactID ? { ...profile, added: false } : profile
          )
        );
      } else {
        console.log(
          "Both contacts added successfully:",
          firstEntryData,
          secondEntryData
        );
        setContacts((prevContacts) => [
          ...prevContacts,
          { contact_id: contactID },
          { contact_id: user.id }, // Add the reverse entry if necessary
        ]); // Update contacts state
      }
    } catch (error) {
      console.error("Error adding contact:", error.message);
      setError("Failed to add contact. Please try again.");

      // If any add fails, revert the optimistic update
      setProfiles((prevProfiles) =>
        prevProfiles.map((profile) =>
          profile.id === contactID ? { ...profile, added: false } : profile
        )
      );
    }
  };

  // Render each profile in the FlatList
  const renderProfile = ({ item }) => (
    <View style={styles.profileCard}>
      {item.avatar_url ? (
        <Image
          alt="Avatar"
          resizeMode="cover"
          source={{ uri: item.avatar_url }}
          style={styles.profileImage}
        />
      ) : (
        <View style={[styles.cardImg]}>
          <Text style={styles.cardAvatarText}>
            {item.first_name[0].toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.profileDetails}>
        <Text style={styles.profileName}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={styles.profileUsername}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAdd(item.id)} // Pass only the contact ID
        activeOpacity={0.7} // Feedback on press
        disabled={item.added} // Disable the button if the contact is already added
      >
      <Image
        source={
          item.added
            ? require("../../assets/icons/check_green.png") // Path to check icon
            : require("../../assets/icons/plus_icon.png") // Path to plus icon
        }
        style={
          item.added
            ? { width: 18, height: 18, tintColor: "green" } // Size and color for check icon
            : { width: 18, height: 18, tintColor: "#A9A9A9" } // Size and light grey color for plus icon
        }
      />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Add Contact</Text>
      <View style={styles.searchContainer}>
        <View style={styles.searchIcon}>
          <FeatherIcon color="#848484" name="search" size={17} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username..."
          placeholderTextColor="#B0B0B0" // Set a lighter color for the placeholder
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
      </View>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#007BFF"
          style={styles.loading}
        />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : profiles.length > 0 ? (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProfile}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No profiles found</Text>
          }
        />
      ) : (
        <Text style={styles.emptyText}>No profiles found</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 23,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row", // Align items in a row
    alignItems: "center", // Center vertically
    backgroundColor: "rgb(240, 240, 240)", // Same background as search input
    borderRadius: 25,
    paddingHorizontal: 10, // Padding around the container
    borderWidth: 1,
    borderColor: "#d1d1d1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    width: "100%",
    alignSelf: "center",
    marginBottom: 5,
    height: screenHeight * 0.05, // Dynamically set height as 6% of screen height
  },
  searchInput: {
    height: 42,
    flexDirection: "row",
    borderRadius: 25,
    paddingHorizontal: 5,
    paddingVertical: 5,
    width: "100%",
  },
  searchIcon: {
    paddingRight: 2,
    justifyContent: "center", // Center vertically within the icon container
  },
  loading: {
    marginTop: 20,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 2,
    borderRadius: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    backgroundColor: "#D1EBEF",
  },
  profileDetails: {
    flex: 1,
    marginLeft: 7,
  },
  profileName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  profileUsername: {
    fontSize: 14,
    color: "#666",
  },
  addButton: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#aaa",
  },
  errorText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "red",
    fontWeight: "bold",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 3,
  },
  cardAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cardImg: {
    width: 40,
    height: 40,
    marginRight: 3,
    backgroundColor: "#FFADAD",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
});

export default AddContact;
