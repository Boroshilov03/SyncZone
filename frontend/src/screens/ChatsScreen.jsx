import { StyleSheet, Text, View, Button, Image } from "react-native";
import React from "react";
import { supabase } from "../lib/supabase"; // Ensure this path is correct
import useStore from "../store/store"; // Ensure this path is correct

const ChatsScreen = () => {
  const { setAuthenticated, setUser, setAccessToken, setRefreshToken, user } =
    useStore();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut(); // Sign out from Supabase
    if (!error) {
      setAuthenticated(false); // Update Zustand store
      setUser(null); // Clear user data
      setAccessToken(null); // Clear access token
      setRefreshToken(null); // Clear refresh token
      // Optionally navigate back to the SignIn screen
      // navigation.navigate('SignIn'); // Uncomment if using navigation prop
    } else {
      console.error("Error logging out:", error.message);
    }
  };

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Image
            source={{
              uri:
                user.user_metadata?.avatar_url ||
                "https://placehold.co/100x100",
            }}
            style={styles.profilePhoto}
          />
          <Text style={styles.userName}>
            {user.user_metadata?.first_name || ""}{" "}
            {user.user_metadata?.last_name || ""} (
            {user.user_metadata?.username || "Unknown User"})
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </>
      ) : (
        <Text>No user data available.</Text>
      )}
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

export default ChatsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 16,
    color: "gray",
    marginBottom: 20,
    textAlign: "center",
  },
});
