import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  TextInput,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons"; // Import MaterialIcons for different call type icons
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FeatherIcon from "react-native-vector-icons/Feather";
import { Dimensions } from "react-native";

const { height: screenHeight } = Dimensions.get("window"); // Get screen height



const RecentCalls = ({ navigation }) => {
  const router = useRouter();
  const [input, setInput] = useState(""); // for search bar filtering

  const recentCallsData = [
    {
      id: "1",
      name: "Lara Mueller",
      time: "5:33 AM",
      avatar: "https://via.placeholder.com/50",
      type: "missed",
    },
    {
      id: "2",
      name: "John Doe",
      time: "2:33 PM",
      avatar: "https://via.placeholder.com/50",
      type: "answered",
    },
    {
      id: "3",
      name: "Jane Smith",
      time: "9:33 AM",
      avatar: "https://via.placeholder.com/50",
      type: "outgoing",
    },
    {
      id: "4",
      name: "Lara Mueller",
      time: "3:33 AM",
      avatar: "https://via.placeholder.com/50",
      type: "missed",
    },
    {
      id: "5",
      name: "Alex Johnson",
      time: "7:00 PM",
      avatar: "https://via.placeholder.com/50",
      type: "answered",
    },
  ];

  const filteredCalls = recentCallsData.filter((call) =>
    call.name.toLowerCase().includes(input.toLowerCase())
  );

  const renderCallItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => console.log("Start Call with", item.name)}
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.cardImg} />
      ) : (
        <View style={[styles.cardImg, styles.cardAvatar]}>
          <Text style={styles.cardAvatarText}>{item.name[0]}</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardTimestamp}>{item.time}</Text>
        </View>
        <View style={styles.cardMessageContainer}>
          {item.type === "missed" && (
            <MaterialCommunityIcons name="phone-missed" size={15} color="red" />
          )}
          {item.type === "answered" && (
            <MaterialIcons name="call-received" size={15} color="green" />
          )}
          {item.type === "outgoing" && (
            <MaterialIcons name="call-made" size={15} color="blue" />
          )}
          <Text
            style={[
              styles.cardMessage,
              item.type === "missed" && styles.missedCall,
            ]}
          >
            {item.type === "missed"
              ? "Missed Call"
              : item.type === "answered"
              ? "Answered"
              : "Outgoing"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
<View style={{ flex: 1, position: "relative", zIndex: 1, backgroundColor: "#fff" }}>
      <Header event="call" navigation={navigation} title="Calls" />
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
            placeholder="Search.."
            placeholderTextColor="#848484"
            returnKeyType="done"
            style={styles.searchControl}
            value={input}
          />
        </View>
      </View>
      {filteredCalls.length ? (
        <FlatList
          data={filteredCalls}
          keyExtractor={(item) => item.id}
          renderItem={renderCallItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <Text style={styles.noDataText}>No recent calls</Text>
      )}
    </View>
  );
};

export default RecentCalls;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchWrapper: {
    paddingTop: 8,
    paddingBottom: 16,
    borderColor: "#efefef",
    width: "100%",
  },
  search: {
    position: "relative",
    backgroundColor: "rgb(240, 240, 240)",
    justifyContent: "center",
    marginHorizontal: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#d1d1d1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    height: screenHeight * 0.05, // Dynamically set height as 6% of screen height
  },
  searchIcon: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  searchControl: {
    paddingLeft: 34,
    width: "100%",
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  card: {
    flexDirection: "row",
    padding: 12,
    marginVertical: 4,
    backgroundColor: "#D1EBEF",
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    width: "95%",
    alignSelf: "center",
  },
  cardImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  cardAvatar: {
    backgroundColor: "#efefef",
    alignItems: "center",
    justifyContent: "center",
  },
  cardAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "semibold",
    flex: 1,
  },
  cardMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardMessage: {
    fontSize: 14,
    fontWeight: "300",
    marginLeft: 8,
  },
  cardTimestamp: {
    fontSize: 12,
    fontWeight: "300",
    marginLeft: 8,
  },
  missedCall: {
    color: "red",
  },
  noDataText: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 20,
  },
});
