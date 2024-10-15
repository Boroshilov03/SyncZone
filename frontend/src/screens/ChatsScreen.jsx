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
import { useQuery, useQueryClient } from "@tanstack/react-query";

const ChatsScreen = ({ navigation }) => {
  const [input, setInput] = useState("");
  const { user } = useStore();
  const queryClient = useQueryClient(); // For refetching chats
  const { data: chats = [], error, isLoading } = useQuery({
    queryKey: ["recentChats", user.id],
    queryFn: fetchChats,
    enabled: !!user.id,
    refetchOnWindowFocus: true,
  });

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

  // Set up real-time subscription for chat updates
  useEffect(() => {
    if (!user.id) return;

    const channel = supabase
      .channel('chats-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        (payload) => {
          console.log("New change in chats table:", payload);
          queryClient.invalidateQueries(["recentChats", user.id]); // Refetch chats when changes occur
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_participants' },
        (payload) => {
          console.log("New change in chat_participants table:", payload);
          queryClient.invalidateQueries(["recentChats", user.id]); // Refetch chats when changes occur
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe(); // Clean up the subscription on component unmount
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
            participant.profiles.username.toLowerCase().includes(input.toLowerCase())
          );
        })
      );
    });
  }, [input, chats, user.id]);

  const renderChatItem = ({ item }) => {
    const participants = item.chat_participants;
    const otherParticipants = participants.filter(
      (participant) => participant.user_id !== user.id
    );

    if (otherParticipants.length > 0) {
      const participant = otherParticipants[0];
      const profile = participant.profiles;

      if (!profile) return null;

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
          <View style={styles.card}>
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
                  <Text style={styles.cardAvatarText}>{profile.username[0]}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{profile.username}</Text>
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
    return null;
  };

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

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
    paddingBottom: 50,
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
    color: "#fff",
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  cardTimestamp: {
    color: "#9ca3af",
    fontSize: 12,
  },
  cardAction: {
    paddingRight: 16,
  },
});
