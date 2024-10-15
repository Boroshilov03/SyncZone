import { StyleSheet, Text, View, Image, SafeAreaView, TouchableOpacity } from 'react-native';
import React from 'react';

const ProfileScreen = ({ navigation, route }) => {
  // Destructure the parameters passed from navigation
  const {
    contactID,
    contactPFP,
    contactFirst,
    contactLast,
    contactUsername,
  } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("MainTabs")}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      
      <View style={styles.profileContainer}>
        {contactPFP ? (
          <Image source={{ uri: contactPFP }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderImage} />
        )}
        <Text style={styles.nameText}>
          {contactFirst} {contactLast}
        </Text>
        <Text style={styles.usernameText}>@{contactUsername}</Text>
        <Text style={styles.idText}>User ID: {contactID}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
    backgroundColor: '#007bff', // Blue color for the button
    borderRadius: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: 60, // Adjust margin to avoid overlap with the back button
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50, // Makes the image circular
    marginBottom: 10,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc', // Gray color for placeholder
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  usernameText: {
    fontSize: 18,
    color: '#555',
  },
  idText: {
    fontSize: 14,
    color: '#888',
  },
});

export default ProfileScreen;
