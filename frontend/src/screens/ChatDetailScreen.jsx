import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { useRoute, useNavigation } from "@react-navigation/native";

const ChatDetailScreen = ({ navigation }) => {
  const route = useRoute();
  const { chatId } = route.params; // Get the chatId from params
  console.log(chatId);

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate("MainTabs")}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Chat Detail Screen</Text>
      <View style={styles.chatIdContainer}>
        <Text style={styles.chatIdText}>Conversation ID:</Text>
        <Text style={styles.chatIdValue}>{chatId}</Text>
      </View>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9", // Light background color
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  chatIdContainer: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#fff", // White background for the ID container
    shadowColor: "#000", // Shadow effect
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3, // For Android shadow
  },
  chatIdText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555", // Grey color for the label
  },
  chatIdValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333", // Dark color for the chat ID
    marginTop: 5,
  },
  backButton: {
    marginBottom: 15, // Space below the back button
  },
  backButtonText: {
    fontSize: 16,
    color: "#007BFF", // Blue color for the back button
  },
});
