import React, { useEffect, useState } from "react";
import AddContact from "../components/AddContact";
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  FlatList,
} from "react-native";
import useStore from "../store/store";
import { supabase } from "../lib/supabase";

const ContactScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [contacts, setContacts] = useState([]);
  const { user } = useStore();

  useEffect(() => {
    const fetchMutualContacts = async () => {
      try {
        const { data, error } = await supabase
          .from("contacts")
          .select(`profiles:contact_id (id, username, first_name, last_name)`)
          .or(`user_id.eq.${user.id},contact_id.eq.${user.id}`); // Fetch contacts where you're either the user or the contact

        if (error) {
          console.error("Error fetching contacts:", error.message);
        } else {
          setContacts(data);
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };

    fetchMutualContacts();
  }, []);

  const renderContact = ({ item }) => (
    <View style={styles.contactItem}>
      <Text style={styles.contactText}>
        {item.profiles.first_name} {item.profiles.last_name}
      </Text>
      <Text style={styles.contactUsername}>@{item.profiles.username}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate("MainTabs")}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Contacts</Text>

      {/* Contact List */}
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.profiles.id.toString()}
        style={styles.contactList}
        showsVerticalScrollIndicator={false}
      />

      {/* Custom Add Contact button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Add Contact</Text>
      </TouchableOpacity>

      {/* Modal for adding contacts */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Close modal when back button pressed
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Close button for modal */}
            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>

            {/* Render the AddContact component inside the modal */}
            <AddContact />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9", // Light background for cleaner look
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center", // Centered title
  },
  backButton: {
    padding: 10,
    marginBottom: 20,
    backgroundColor: "#007BAF",
    borderRadius: 5,
    width: 100,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  addButton: {
    padding: 15,
    backgroundColor: "#11b0A5", // Green button for "Add Contact"
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  contactList: {
    flex: 1,
    marginVertical: 10,
  },
  contactItem: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactText: {
    fontSize: 18,
    color: "#333",
  },
  contactUsername: {
    fontSize: 14,
    color: "#777",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Background color with transparency
  },
  modalContent: {
    flex: 1, // Allow content to take up the full available space inside the modal
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginVertical: 100,
    elevation: 5,
    justifyContent: "center", // Center content vertically
    alignItems: "center", // Center content horizontally
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#ff5e5e", // Red close button
    borderRadius: 20,
    padding: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
});

export default ContactScreen;
