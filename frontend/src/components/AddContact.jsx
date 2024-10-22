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
} from "react-native";
import { debounce } from "lodash";
import useStore from "../store/store";
import { Feather as FeatherIcon } from "@expo/vector-icons"; 

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
        .select("id, username, first_name, last_name")
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

    try {
      const { data, error } = await supabase
        .from("contacts")
        .insert({ user_id: user.id, contact_id: contactID })
        .select();

      if (error) {
        console.error("Error adding contact:", error.message);
        setError("Failed to add contact. Please try again.");
      } else {
        console.log("Contact added successfully:", data);
        setContacts([...contacts, { contact_id: contactID }]); // Update contacts state
      }
    } catch (err) {
      console.error("Unexpected error while adding contact:", err);
      setError("An error occurred. Please try again.");
    }
  };

  // Render each profile in the FlatList
  const renderProfile = ({ item }) => (
    <View style={styles.profileCard}>
      <View style={styles.profileDetails}>
        <Text style={styles.profileName}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={styles.profileUsername}>{item.username}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAdd(item.id)}
        activeOpacity={0.7} // Feedback on press
      >
        <Text style={styles.addButtonText}>Add</Text>
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
        <ActivityIndicator size="large" color="#007BFF" style={styles.loading} />
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
    padding: 20,
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
    width: "95%",
    alignSelf: "center",
    marginBottom: 5,
  },
  searchInput: {
    height: 42,
    flexDirection: "row",
    borderRadius: 25,
    paddingHorizontal: 5,
    paddingVertical: 5,
    width: '100%',
  },
  searchIcon: {
    paddingRight: 2,
    justifyContent: 'center', // Center vertically within the icon container
  },
  loading: {
    marginTop: 20,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    margin: 5,
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
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
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
});

export default AddContact;
