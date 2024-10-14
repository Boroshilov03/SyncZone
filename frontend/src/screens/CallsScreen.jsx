import { StyleSheet, Text, View, Button, SafeAreaView } from "react-native";
import React from "react";

const CallsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>CallsScreen</Text>
      <Button
        title="Add Contact"
        onPress={() => navigation.navigate("Contact")}
      />
      <Button
        title="go to profile"
        onPress={() => navigation.navigate("Profile")}
      />
    </SafeAreaView>
  );
};

export default CallsScreen;
