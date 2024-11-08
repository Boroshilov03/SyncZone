import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import useStore from "../store/store";

const FavoriteUsers = () => {
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

  return (
    <View style={styles.container}>
      {favoriteProfiles.map((user) => (
        <TouchableOpacity key={user.id}>
          {user.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.favoriteImg}
            />
          ) : (
            <View style={[styles.favoriteImg, styles.cardAvatar]}>
              <Text style={styles.cardAvatarText}>{user.username[0]}</Text>
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
    backgroundColor: "#efefef",
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
