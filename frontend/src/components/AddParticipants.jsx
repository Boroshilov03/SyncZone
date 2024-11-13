import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { Feather as FeatherIcon } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import useStore from "../store/store";
import debounce from "lodash.debounce";

const AddParticipants = ({
  onClose,
  selectedContacts,
  setSelectedContacts,
}) => {
  const { user } = useStore();
  const [contacts, setContacts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    console.log(selectedContacts);
    onClose(selectedContacts); // Pass selectedContacts to the parent
  };
  // Fetch user's existing contacts
  useEffect(() => {
    const fetchContacts = async () => {
      if (user && user.id) {
        // Ensure user and user.id are available
        const { data, error } = await supabase
          .from("contacts")
          .select("contact_id")
          .eq("user_id", user.id);
        if (error) {
          console.error("Error fetching contacts:", error);
        } else {
          setContacts(data || []);
        }
      } else {
        console.log("User is not available");
      }
    };

    fetchContacts();
  }, [user]);

  // Function to fetch profiles based on the search query
  const searchProfiles = async (query) => {
    try {
      setLoading(true);
      setError(""); // Reset error on new search

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, first_name, last_name, avatar_url")
        .ilike("username", `%${query}%`)
        .neq("id", user.id); // Exclude the current user

      if (error) {
        console.error("Error searching profiles:", error);
        setError("Failed to fetch profiles. Please try again.");
      } else {
        // Filter out contacts already in user's contacts
        const filteredData = data.filter(
          (profile) =>
            !contacts.some((contact) => contact.contact_id === profile.id)
        );
        setProfiles(filteredData || []);
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

  // Toggle selection of contacts
  const toggleContactSelection = (contactID) => {
    setSelectedContacts((prevSelected = []) => {
      const newSelected = prevSelected.includes(contactID)
        ? prevSelected.filter((id) => id !== contactID)
        : [...prevSelected, contactID];

      // Ensure user.id is always included
      if (!newSelected.includes(user.id)) {
        newSelected.push(user.id);
      }

      return newSelected;
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Participants</Text>

      <View style={styles.searchContainer}>
        <View style={styles.searchIcon}>
          <FeatherIcon color="#848484" name="search" size={17} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name"
          placeholderTextColor="#A9A9A9"
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View style={styles.listContainer}>
          <FlatList
            data={profiles}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => toggleContactSelection(item.id)}
                style={styles.contactItem}
              >
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
                <View style={styles.contactText}>
                  <Text>
                    {item.first_name} {item.last_name}
                  </Text>
                  <Text>@{item.username}</Text>
                </View>
                {selectedContacts.includes(item.id) ? (
                  <FeatherIcon name="check-circle" size={20} color="green" />
                ) : (
                  <FeatherIcon name="circle" size={20} color="#ccc" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <Text style={styles.noResultsText}>
                {error || "No contacts found"}
              </Text>
            )}
          />
          <TouchableOpacity
            style={styles.closeButtonBottom}
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "5%",
    alignSelf: "center",
    width: "100%",
    maxWidth: 400,
    alignItems: "center", // Center-align content
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgb(240, 240, 240)",
    borderRadius: 25,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#d1d1d1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    width: "100%",
    alignSelf: "center",
    marginBottom: 10,
  },
  searchInput: {
    height: 42,
    flex: 1,
    borderRadius: 25,
    paddingHorizontal: 10,
    color: "#000",
  },
  searchIcon: {
    justifyContent: "center",
  },
  listContainer: {
    maxHeight: 360,
    marginBottom: 5,
    width: "100%",
    alignItems: "center", // Center-align list items
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    width: "100%", // Ensure item takes full width
  },
  contactText: {
    flex: 1,
  },
  cardAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cardImg: {
    width: 40,
    height: 40,
    marginRight: 8,
    backgroundColor: "#FFADAD",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  noResultsText: {
    textAlign: "center",
    marginTop: 20,
    color: "#999",
  },
  closeButtonBottom: {
    position: "absolute",
    backgroundColor: "#A9A9A9",
    padding: 10,
    borderRadius: 25,
    width: "30%",
    alignItems: "center",
    marginTop: "130%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddParticipants;
