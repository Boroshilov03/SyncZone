import React from 'react';
import { View, Text, TextInput, StyleSheet, Button } from 'react-native';

const AddParticipants = ({ modalVisible, onClose }) => {
    return (
      <View style={styles.modalContainer}>
        <Text style={styles.title}>Participants</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name"
            placeholderTextColor="#A9A9A9"  // Adjust placeholder color
          />
        </View>
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "5%",
    alignSelf: 'center',
    width: "80%",
    maxWidth: 400,
    backgroundColor: "red",
  },
  headerContainer: {
    width: "100%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 0,
    right: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    flex: 1,
  },

  // Search Bar Styles
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
});

export default AddParticipants;
