import { supabase } from "../lib/supabase"; // Ensure this path is correct
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
import { debounce } from "lodash"; // Install lodash if not already done
import useStore from "../store/store";

const AddContact = ({ toggleModal }) => {
  const [searchQuery, setSearchQuery] = useState(""); // Store search query
  const [profiles, setProfiles] = useState([]); // Store search results
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(""); // Error state
  const { user } = useStore();

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
        .neq("id", user.id);

      if (error) {
        console.error("Error searching profiles:", error);
        setError("Failed to fetch profiles. Please try again.");
      } else {
        console.log("Fetched profiles:", data); // Debugging
        setProfiles(data || []); // Update state with fetched profiles
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
      }
    } catch (err) {
      console.error("Unexpected error while adding contact:", err);
      setError("An error occurred. Please try again.");
    }
  };

  // Render each profile in the FlatList
  const renderProfile = ({ item }) => (
    <View style={styles.profileContainer}>
      <View style={styles.profileUsername}>
        <Text>
          {item.first_name} {item.last_name}
        </Text>
        <Text>{item.username}</Text>
      </View>
      <TouchableOpacity onPress={() => handleAdd(item.id)}>
        <Text style={styles.addButton}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by username..."
        value={searchQuery}
        onChangeText={handleSearchChange}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
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
    padding: 10,
    backgroundColor: "#fff",
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  profileUsername: {
    fontSize: 16,
    color: "#000",
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
  },
  addButton: {
    color: "#007BFF",
    fontWeight: "bold",
  },
});

export default AddContact;
