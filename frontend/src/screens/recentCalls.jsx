import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";

const RecentCalls = ({ navigation }) => {
  const router = useRouter();

  //   Mock data for sample call history
  const recentCallsData = [
    {
      id: "1",
      name: "Lara Mueller",
      time: "17:33",
      avatar: "https://via.placeholder.com/50",
    },
    {
      id: "2",
      name: "Lara Mueller",
      time: "14:33",
      avatar: "https://via.placeholder.com/50",
    },
    {
      id: "3",
      name: "Lara Mueller",
      time: "9:33",
      avatar: "https://via.placeholder.com/50",
    },
    {
      id: "4",
      name: "Lara Mueller",
      time: "8:33",
      avatar: "https://via.placeholder.com/50",
    },
    {
      id: "5",
      name: "Lara Mueller",
      time: "7:33",
      avatar: "https://via.placeholder.com/50",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <Header event="call" navigation={navigation} title="Calls" />

      {/* Recent Calls list */}
      <FlatList
        data={recentCallsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.callItem}
            onPress={() => console.log("Start Call with", item.name)}
          >
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={styles.callDetails}>
              <Text style={styles.callName}>{item.name}</Text>
              <Text style={styles.callTime}>{item.time}</Text>
            </View>
            <Ionicons name="call-outline" size={24} color="black" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default RecentCalls;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  callItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d6eef7",
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  callDetails: {
    flex: 1,
  },
  callName: {
    fontSize: 16,
    fontWeight: "500",
  },
  callTime: {
    fontSize: 14,
    color: "#666",
  },
});
