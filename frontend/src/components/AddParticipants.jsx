import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Feather as FeatherIcon } from "@expo/vector-icons"; 


const AddParticipants = ({ modalVisible, onClose }) => {
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
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },

  // Search Bar Styles
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
  },
  searchInput: {
    height: 42,
    flex: 1,
    borderRadius: 25,
    paddingHorizontal: 10,
    color: "#000",
  },
  searchIcon: {
    justifyContent: 'center', // Center vertically within the icon container
  },
});

export default AddParticipants;
