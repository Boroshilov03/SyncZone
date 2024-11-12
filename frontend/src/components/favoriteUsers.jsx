import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import useStore from "../store/store";

const FavoriteUsers = ({ navigation }) => {
  const { user } = useStore();
  const [favoriteProfiles, setFavoriteProfiles] = useState([]);

  const fetchFavoriteProfiles = async () => {
    try {
      // Step 1: Fetch all contact IDs
      const { data: allContactsID, error: errorFetchingAll } = await supabase
        .from("favorites")
        .select("contact_id")
        .eq("user_id", user.id);

      if (errorFetchingAll) throw errorFetchingAll;

      // Extract contact IDs
      const contactIDs = allContactsID.map((item) => item.contact_id);

      // Step 2: Fetch profiles for each contact ID using Promise.all
      const profileFetches = contactIDs.map(async (contactID) => {
        const { data: profileData, error: errorFetchProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", contactID)
          .single();

        if (errorFetchProfile) {
          console.error("Error fetching profile data:", errorFetchProfile);
          return null;
        }

        return profileData;
      });

      // Wait for all fetches to complete and filter out any null results
      const profiles = (await Promise.all(profileFetches)).filter(Boolean);
      setFavoriteProfiles(profiles);
    } catch (error) {
      console.error("Error fetching favorite profiles:", error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchFavoriteProfiles();

    // Subscribe to 'favorites' table changes for both INSERT and DELETE events
    const channel = supabase
      .channel("favorites-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "favorites" },
        (payload) => {
          console.log("Change detected in favorites table:", payload);
          fetchFavoriteProfiles(); // Refetch on any change in favorites
        }
      )
      .subscribe();

    // Clean up subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createChat = async (contactID) => {
    const { data: existingChats, error: chatError } = await supabase
      .from("chats")
      .select("id")
      .eq("is_group", false)
      .in(
        "id",
        (
          await supabase
            .from("chat_participants")
            .select("chat_id")
            .eq("user_id", user.id)
        ).data.map((chat) => chat.chat_id)
      )
      .in(
        "id",
        (
          await supabase
            .from("chat_participants")
            .select("chat_id")
            .eq("user_id", contactID)
        ).data.map((chat) => chat.chat_id)
      );

    if (chatError) {
      console.error("Error checking existing chats:", chatError);
      return;
    }

    if (existingChats && existingChats.length > 0) {
      const chatId = existingChats[0].id;
      const { data: contactData, error: contactError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", contactID)
        .single();

      if (contactError) {
        console.error("Error fetching contact data:", contactError);
        return;
      }

      navigation.navigate("ChatDetail", {
        chatId,
        username: contactData.username,
        otherPFP: contactData.avatar_url,
      });
      return;
    }

    const { data: newChat, error: newChatError } = await supabase
      .from("chats")
      .insert([{ is_group: false }])
      .select();

    if (newChatError) {
      console.error("Error creating new chat:", newChatError);
      return;
    }

    const { error: participantsError } = await supabase
      .from("chat_participants")
      .insert([
        { chat_id: newChat[0].id, user_id: user.id },
        { chat_id: newChat[0].id, user_id: contactID },
      ]);

    if (participantsError) {
      console.error("Error adding participants:", participantsError);
      return;
    }

    const { data: contactData, error: contactError } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", contactID)
      .single();

    if (contactError) {
      console.error("Error fetching contact data:", contactError);
      return;
    }

    navigation.navigate("ChatDetail", {
      chatId: newChat[0].id,
      username: contactData.username,
      otherPFP: contactData.avatar_url,
    });
  };

  return (
    <View style={styles.container}>
      {favoriteProfiles.map((user) => (
        <TouchableOpacity key={user.id} onPress={() => createChat(user.id)}>
          {user.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.favoriteImg}
            />
          ) : (
            <View style={[styles.favoriteImg, styles.cardAvatar]}>
              <Text style={styles.cardAvatarText}>{user.first_name[0]}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  favoriteImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 5,
  },
  cardAvatar: {
    backgroundColor: "#FFADAD", // soft coral to complement pastel blue
    alignItems: "center",
    justifyContent: "center",
  },
  cardAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default FavoriteUsers;
