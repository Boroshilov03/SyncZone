import { StyleSheet, Text, View, SafeAreaView, Image, FlatList, TextInput, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import FeatherIcon from "react-native-vector-icons/Feather";

const MembersChatScreen = ({ navigation }) => {
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
          onPress={() => navigation.navigate("GroupDetails")} // Change this to your desired screen
        >
          <Image
            source={require("../../assets/icons/back_arrow.webp")} // Reuse the same image
            style={[styles.backArrow, { transform: [{ rotate: "180deg" }] }]} // Rotate 180 degrees to point right
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
            placeholder="Search by Name"
            placeholderTextColor="#848484"
            returnKeyType="done"
            style={styles.searchControl}
            value={input}
          />
        </View>
      </View>

      {/* List of Contact Cards */}
      <FlatList
        data={contacts}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id}
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
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
    flex: 1,
    textAlign: "center",
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
    width: "90%",
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
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
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
});

export default MembersChatScreen;
