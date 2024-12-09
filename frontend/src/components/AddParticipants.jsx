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
import { Dimensions } from "react-native";

const { height: screenHeight } = Dimensions.get("window"); // Get screen height

const AddParticipants = ({
  onClose,
  selectedContacts,
  setSelectedContacts,
}) => {
  const { user } = useStore();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    console.log(selectedContacts);
    onClose(selectedContacts); // Pass selectedContacts to the parent
  };

  // Fetch mutual contacts
  useEffect(() => {
    const fetchContacts = async () => {
      if (user && user.id) {
        try {
          setLoading(true);
          setError(""); // Reset error message

          const { data, error } = await supabase
            .from("contacts")
            .select(
              `profiles:contact_id (id, username, first_name, last_name, avatar_url)`
            )
            .or(`user_id.eq.${user.id},contact_id.eq.${user.id}`)
            .neq("contact_id", user.id); // Exclude the logged-in user's ID

          if (error) {
            console.error("Error fetching contacts:", error);
            setError("Failed to fetch contacts. Please try again.");
          } else {
            // Extract profiles from the contacts data
            const contactProfiles = data.map((contact) => contact.profiles);
            setContacts(contactProfiles || []);
            setFilteredContacts(contactProfiles || []); // Set initial filtered contacts
          }
        } catch (err) {
          console.error("Unexpected error during fetch:", err);
          setError("Something went wrong. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchContacts();
  }, [user]);

  // Function to filter contacts based on the search query
  const filterContacts = (query) => {
    const filtered = contacts.filter(
      (contact) =>
        contact.first_name.toLowerCase().includes(query.toLowerCase()) ||
        contact.last_name.toLowerCase().includes(query.toLowerCase()) ||
        contact.username.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredContacts(filtered);
  };

  // Debounce search function to reduce unnecessary filtering
  const debouncedSearch = debounce((query) => {
    filterContacts(query);
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
        <ActivityIndicator size="large" color="lightblue" />
      ) : (
        <View style={styles.listContainer}>
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => toggleContactSelection(item.id)} // Use your toggle logic
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
                  <Text style={styles.profileName}>
                    {item.first_name} {item.last_name}
                  </Text>
                  <Text style={styles.contactUsername}>@{item.username}</Text>
                </View>

                {/* Checkbox */}
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => toggleContactSelection(item.id)} // Handles the toggle logic
                >
                  <View
                    style={[
                      styles.checkboxWrapper,
                      {
                        backgroundColor: selectedContacts.includes(item.id)
                          ? "#B0D8FF"
                          : "#ccc", // Selected state styling
                      },
                    ]}
                  >
                    {selectedContacts.includes(item.id) && (
                      <View style={styles.checkmark} /> // Displays checkmark for selected state
                    )}
                  </View>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <Text style={styles.noResultsText}>
                {error || "No contacts found"}
              </Text>
            )}
          />
          <View style={styles.closeButtonWrapper}>
            <TouchableOpacity
              style={styles.closeButtonBottom}
              onPress={handleClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    width: "100%",
    maxWidth: 400,
    alignItems: "center", // Center-align content
    paddingTop: 10,
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
    height: screenHeight * 0.05, // Dynamically set height as 6% of screen height
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
    width: "100%", // Ensure item takes full width
  },
  profileName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
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
    marginRight: 8,
  },
  noResultsText: {
    textAlign: "center",
    marginTop: 20,
    color: "#999",
  },
  closeButtonWrapper:{
    display: 'flex',
    marginBottom: 30,
  },
  closeButtonBottom: {
    position: "relative",
    backgroundColor: "#FFADAD",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    width: "30%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  contactUsername: {
    fontSize: 14,
    color: "#666",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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
    top: -2,
    borderRightWidth: 0,
    transform: [{ rotate: "50deg" }, { scaleX: -1 }],
  },
});

export default AddParticipants;
