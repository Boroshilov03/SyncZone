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
    try {
      // First, get the chat IDs for the current user
      const { data: chatParticipants, error: chatError } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id);

      if (chatError) {
        console.error("Error fetching chat participants:", chatError);
        return; // Handle error appropriately (e.g., show a message to the user)
      }

      const chatIds = chatParticipants.map((chat) => chat.chat_id);

      // Now, query the chats based on the retrieved chat IDs
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
        .in("id", chatIds)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching chats:", error);
      } else {
        console.log("Fetched chats data:", data); // Log the fetched data for debugging
        setChats(data); // Update state with the fetched chats
      }
    } catch (err) {
      console.error("Unexpected error:", err); // Catch any unexpected errors
    }
  };

  useEffect(() => {
    getRecentChats(); // Fetch chats on component mount
  }, []);

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const participants = chat.chat_participants;

      // Ensure that there is at least one participant that isn't the current user
      return (
        participants.length > 1 && // More than one participant
        participants.some((participant) => {
          return (
            participant.profiles &&
            participant.profiles.username &&
            participant.user_id !== user.id && // Exclude your own user ID
            participant.profiles.username
              .toLowerCase()
              .includes(input.toLowerCase())
          );
        })
      );
    });
  }, [input, chats, user.id]); // Add user.id to dependencies

  const renderChatItem = ({ item }) => {
    const participants = item.chat_participants; // Access the array of participants
    if (participants && participants.length > 0) {
      // Filter out the current user from participants
      const otherParticipants = participants.filter(
        (participant) => participant.user_id !== user.id
      );

      // Ensure that there is at least one valid participant to display
      if (otherParticipants.length > 0) {
        const participant = otherParticipants[0]; // Access the first valid participant
        console.log("Participant Info:", participant);

        if (!participant.profiles) {
          return null; // Skip rendering if profiles is undefined
        }

        return (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ChatDetail", {
                chatId: item.id,
                username: participant.profiles.username,
                otherPFP: participant.profiles.avatar_url,
              })
            }
          >
            <View style={styles.card}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Profile", {
                    contactID: participant.profiles.id,
                    contactPFP: participant.profiles.avatar_url,
                    contactFirst: participant.profiles.first_name,
                    contactLast: participant.profiles.last_name,
                    contactUsername: participant.profiles.username,
                  })
                }
              >
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
              </TouchableOpacity>
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
    }
    return null; // Fallback if no valid participants are found
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
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
    </View>
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
