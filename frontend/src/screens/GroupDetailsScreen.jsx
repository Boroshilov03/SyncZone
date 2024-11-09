import { StyleSheet, Text, View, SafeAreaView, Image, FlatList, TextInput, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import FeatherIcon from "react-native-vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";


const GroupDetailsScreen = ({ navigation }) => {
  const [input, setInput] = useState("");
  const [selectedIds, setSelectedIds] = useState([]); // Track selected contact IDs in an array
  
  const handleCheckboxToggle = (id) => {
    // Toggle selection for this contact by adding/removing from selectedIds array
    setSelectedIds(prevSelectedIds => {
      if (prevSelectedIds.includes(id)) {
        return prevSelectedIds.filter(selectedId => selectedId !== id); // Remove from array
      } else {
        return [...prevSelectedIds, id]; // Add to array
      }
    });
  };

  // Sample data for contacts
  const contacts = [
    { id: '1', name: 'Alice Johnson', username: '@alicej' },
    { id: '2', name: 'Bob Smith', username: '@bobsmith' },
    { id: '3', name: 'Carol White', username: '@carolwhite' },
  ];

  const renderContactItem = ({ item }) => (
    <View style={styles.contactItem}>
      <Image
        source={require("../../assets/icons/pfp2.jpg")}
        style={styles.profileImage}
      />
      <View style={styles.wrapperCol}>
        <Text style={styles.contactText}>{item.name}</Text>
        <Text style={styles.contactUsername}>{item.username}</Text>
      </View>
      {/* Checkbox */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => handleCheckboxToggle(item.id)}  // Pass the contact's id to toggle
      >
        <View
          style={[
            styles.checkboxWrapper,
            { backgroundColor: selectedIds.includes(item.id) ? "#B0D8FF" : "#ccc" },  // Check if this contact is selected
          ]}
        >
          {selectedIds.includes(item.id) && <View style={styles.checkmark} />}  
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
          onPress={() => navigation.navigate("MembersChat")}
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
              { tintColor: 'white' }, // Set the color to white
            ]}
          />
        </View> 
      </View>

      <View style={styles.groupchatContainer}>
        {/* Group Chat Picture */}
        <Image
          source={require("../../assets/icons/group_chat.png")}  // Replace with the actual image path
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
        <Text style={styles.membersTitle}>Members ({contacts.length + 1})</Text>
      </View>

    {/* List of Contact Cards */}
    <FlatList
      data={contacts}
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
      <TouchableOpacity onPress={() => console.log("Save button pressed")}>
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
