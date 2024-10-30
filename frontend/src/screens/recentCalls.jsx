import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
} from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";

const RecentCalls = ({ navigation }) => {
  const [input, setInput] = useState(""); // for search bar filtering
  const recentCallsData = []; // empty data array as a placeholder for now

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
        <Text style={styles.cardMessage}>Recent call placeholder</Text>
      </View>
      <Ionicons name="call-outline" size={24} color="black" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header event="call" navigation={navigation} title="Recent Calls" />

      {/* Search Bar */}
      <View style={{flexGrow: 1,  flexShrink:1, flexBasis:0}}>
        <View style={styles.searchWrapper}>
          <View style={styles.search}>

            <Ionicons name="search-outline" size={17} color="#848484" style={styles.searchIcon} />
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
      </View>

      {/* Recent Calls List */}
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
    backgroundColor: "#efefef",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minHeight: "7%",
    marginHorizontal: 12,
  },
  searchIcon: {
    position: "absolute",
    left: 10,
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
  cardMessage: {
    fontSize: 14,
    fontWeight: "300",
  },
  cardTimestamp: {
    fontSize: 12,
    fontWeight: "300",
    marginLeft: 8,
  },
  noDataText: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 20,
  },
});
