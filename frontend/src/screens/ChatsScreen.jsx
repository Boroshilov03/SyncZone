import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
  ScrollView,
} from "react-native";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import useStore from "../store/store";
import FeatherIcon from "react-native-vector-icons/Feather";
import Header from "../components/Header";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const ChatsScreen = ({ navigation }) => {
  const [input, setInput] = useState("");
  const { user } = useStore();
  const queryClient = useQueryClient();

  const {
    data: chats = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["recentChats", user.id],
    queryFn: fetchChats,
    enabled: !!user.id,
    refetchOnWindowFocus: true,
  });
  const localAvatar = require("../../assets/icons/pfp2.jpg");

  const [favoriteUsers, setFavoriteUsers] = useState([
    { id: 1, username: "User1", avatar_url: localAvatar },
    { id: 2, username: "User2", avatar_url: localAvatar },
    { id: 3, username: "User3", avatar_url: localAvatar },
    { id: 4, username: "User1", avatar_url: localAvatar },
    { id: 5, username: "User2", avatar_url: localAvatar },
    { id: 6, username: "User3", avatar_url: localAvatar },
    { id: 7, username: "User1", avatar_url: localAvatar },
    { id: 8, username: "User2", avatar_url: localAvatar },
    { id: 9, username: "User3", avatar_url: localAvatar },
  ]);

  async function fetchChats() {
    const { data: chatParticipants, error: chatError } = await supabase
      .from("chat_participants")
      .select("chat_id")
      .eq("user_id", user.id);

    if (chatError) {
      throw new Error("Error fetching chat participants: " + chatError.message);
    }

    const chatIds = chatParticipants.map((chat) => chat.chat_id);
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
      .limit(20);

    if (error) {
      throw new Error("Error fetching chats: " + error.message);
    }

    return data;
  }

  useEffect(() => {
    if (!user.id) return;

    const channel = supabase
      .channel("chats-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        (payload) => {
          console.log("New change in chats table:", payload);
          queryClient.invalidateQueries(["recentChats", user.id]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_participants" },
        (payload) => {
          console.log("New change in chat_participants table:", payload);
          queryClient.invalidateQueries(["recentChats", user.id]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user.id, queryClient]);

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const participants = chat.chat_participants;
      return (
        participants.length > 1 &&
        participants.some((participant) => {
          return (
            participant.profiles &&
            participant.profiles.username &&
            participant.user_id !== user.id &&
            participant.profiles.username
              .toLowerCase()
              .includes(input.toLowerCase())
          );
        })
      );
    });
  }, [input, chats, user.id]);

  const renderChatItem = ({ item, index }) => {
    const participants = item.chat_participants;
    const otherParticipants = participants.filter(
      (participant) => participant.user_id !== user.id
    );

    if (otherParticipants.length > 0) {
      const participant = otherParticipants[0];
      const profile = participant.profiles;

      if (!profile) return null;

      // Determine if it's the last item by comparing index with chats.length - 1
      const isLastItem = index === filteredChats.length - 1;

      return (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("ChatDetail", {
              chatId: item.id,
              username: profile.username,
              otherPFP: profile.avatar_url,
            })
          }
        >
          <View
            style={[
              styles.card,
              isLastItem && { marginBottom: 70 }, // Add extra margin if it's the last item
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Profile", {
                  contactID: profile.id,
                  contactPFP: profile.avatar_url,
                  contactFirst: profile.first_name,
                  contactLast: profile.last_name,
                  contactUsername: profile.username,
                })
              }
            >
              {profile.avatar_url ? (
                <Image
                  alt="Avatar"
                  resizeMode="cover"
                  source={{ uri: profile.avatar_url }}
                  style={styles.cardImg}
                />
              ) : (
                <View style={[styles.cardImg, styles.cardAvatar]}>
                  <Text style={styles.cardAvatarText}>
                    {profile.username[0]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{profile.username}</Text>
                <Text style={styles.cardTimestamp}>
                  {new Date(item.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <Text style={styles.cardMessage}>lorem ipsum dolor</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    return null;
  };

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingHorizontal: 12 }}>
      <Header event="message" navigation={navigation} title="Chats" />
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
              placeholder="Search.."
              placeholderTextColor="#848484"
              returnKeyType="done"
              style={styles.searchControl}
              value={input}
            />
          </View>
        </View>

        <View style={styles.favoritesContainer}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "semibold",
              marginBottom: 10,
              fontWeight: "300",
            }}
          >
            Favorites
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity>
              <Image
                source={require("../../assets/icons/add_favorite.png")}
                style={styles.favoriteImg}
              />
            </TouchableOpacity>
            {favoriteUsers.map((user) => (
              <TouchableOpacity key={user.id}>
                {user.avatar_url ? (
                  <Image source={user.avatar_url} style={styles.favoriteImg} />
                ) : (
                  <View style={[styles.favoriteImg, styles.cardAvatar]}>
                    <Text style={styles.cardAvatarText}>
                      {user.username[0]}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {filteredChats.length ? (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id}
            renderItem={renderChatItem}
            contentContainerStyle={styles.searchContent}
          />
        ) : (
          <Text style={styles.searchEmpty}>No conversations</Text>
        )}
      </View>
    </View>
  );
};

export default ChatsScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  favoritesContainer: {
    width: "100%", // Make the container take full width
    marginBottom: 10, // Add some space between favorites and chats
  },
  search: {
    position: "relative",
    backgroundColor: "#efefef",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minHeight: "7%",
  },
  favorites: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center", // Added for better alignment
    marginVertical: 12, // Added margin for spacing
  },
  favoritesTitle: {
    fontWeight: "600",
    fontSize: 18,
    marginBottom: 8,
  },
  favoriteImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
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
    paddingLeft: 34, // Ensure space for the icon
    width: "100%",
    fontSize: 16, // Adjust this font size to make the text and placeholder visible
    fontWeight: "500",
    color: "#000", // Ensure text color is visible
  },

  favoritesContainer: {
    width: "100%", // Ensure this takes the full width
    marginBottom: 10,
  },
  // You can also adjust the searchWrapper style if needed
  searchWrapper: {
    paddingTop: 8,
    paddingBottom: 16,
    borderColor: "#efefef",
    width: "100%", // Make searchWrapper take full width
  },
  searchContent: {
    width: "100%", // Ensure it matches the other components
  },
  searchEmpty: {
    textAlign: "center",
    color: "#9ca3af",
  },

  card: {
    flexDirection: "row",
    padding: 12,
    marginVertical: 2,
    backgroundColor: "#D1EBEF",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    width: "100%", // Set width to 100% to match the container
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between", // Add space between the title and timestamp
    alignItems: "center", // Align items vertically
    marginBottom: 4, // Add some space between the title/timestamp and message
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "semibold",
    flex: 1, // Allow the title to take up remaining space
  },
  cardMessage: {
    fontSize: 14,
    fontWeight: "300", // Use '300' for light or '400' for regular
  },
  cardTimestamp: {
    fontSize: 12,
    fontWeight: "300",
    marginLeft: 8, // Add some spacing between title and timestamp
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
  image: {
    width: 24,
    height: 24,
  },
});
