import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
} from "react-native";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import useStore from "../store/store";
import FeatherIcon from "react-native-vector-icons/Feather";
import Header from "../components/Header";

const ChatsScreen = ({ navigation }) => {
  const [input, setInput] = useState("");
  const [chats, setChats] = useState([]);
  const { user } = useStore();

  const getRecentChats = async () => {
    const { data, error } = await supabase
      .from("chats")
      .select(
        `id, created_at, chat_participants!inner (
          user_id,
          profiles (
            id,
            username,
            avatar_url
          )
        )`
      )
      .eq("chat_participants.user_id", user.id) // Correct filtering
      .order("created_at", { ascending: false })
      .limit(10);

    console.log(data); // Log the data to check its structure
    if (error) {
      console.error(error);
    } else {
      setChats(data);
    }
  };

  useEffect(() => {
    getRecentChats(); // Fetch chats on component mount
  }, []);

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      // Ensure we are checking the participants properly
      const participants = chat.chat_participants; // Correct access to participants
      return participants.some((participant) => {
        return (
          participant.profiles &&
          participant.profiles.username &&
          participant.profiles.username
            .toLowerCase()
            .includes(input.toLowerCase())
        );
      });
    });
  }, [input, chats]);

  const renderChatItem = ({ item }) => {
    const participants = item.chat_participants; // Access the array of participants
    if (participants && participants.length > 0) {
      // Iterate through participants to find a valid profile
      const participant = participants[0]; // Access the first participant
      console.log("Participant Info:", participant);
      if (!participant || !participant.profiles) {
        return null; // Skip rendering if participant or profiles is undefined
      }

      return (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("ChatDetail", { chatId: item.id })
          }
        >
          <View style={styles.card}>
            {participant.profiles.avatar_url ? (
              <Image
                alt="Avatar"
                resizeMode="cover"
                source={{ uri: participant.profiles.avatar_url }}
                style={styles.cardImg}
              />
            ) : (
              <View style={[styles.cardImg, styles.cardAvatar]}>
                <Text style={styles.cardAvatarText}>
                  {participant.profiles.username[0]}
                </Text>
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>
                {participant.profiles.username}
              </Text>
              <Text style={styles.cardTimestamp}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
            <View style={styles.cardAction}>
              <FeatherIcon color="#9ca3af" name="chevron-right" size={22} />
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    return null; // Fallback if participant is not found
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header event="message" navigation={navigation} title="Recent Chats" />
      <View style={styles.container}>
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
              placeholder="Start typing.."
              placeholderTextColor="#848484"
              returnKeyType="done"
              style={styles.searchControl}
              value={input}
            />
          </View>
        </View>
        {filteredChats.length ? (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id}
            renderItem={renderChatItem}
            contentContainerStyle={styles.searchContent}
          />
        ) : (
          <Text style={styles.searchEmpty}>No results</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ChatsScreen;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  search: {
    position: "relative",
    backgroundColor: "#efefef",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  searchWrapper: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#efefef",
  },
  searchIcon: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  searchControl: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    paddingLeft: 34,
    width: "100%",
    fontSize: 16,
    fontWeight: "500",
  },
  searchContent: {
    paddingLeft: 24,
  },
  searchEmpty: {
    textAlign: "center",
    paddingTop: 16,
    fontWeight: "500",
    fontSize: 15,
    color: "#9ca1ac",
  },
  /** Card */
  card: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  cardImg: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  cardAvatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9ca1ac",
  },
  cardAvatarText: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#fff",
  },
  cardBody: {
    marginRight: "auto",
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  cardTimestamp: {
    fontSize: 14,
    color: "#616d79",
    marginTop: 3,
  },
  cardAction: {
    paddingRight: 16,
  },
});
