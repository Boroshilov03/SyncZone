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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    padding: 10,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
  },
});

export default CallsScreen;
