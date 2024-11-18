import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Switch,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect
import useStore from "../store/store";
import { supabase } from "../lib/supabase";

const profilePic = require("../../assets/icons/pfp_icon.png");
const calendarImage = require("../../assets/icons/add_calendar.png");
const messageImage = require("../../assets/icons/plus.png");
const callImage = require("../../assets/icons/plus.png");

const Header = ({
  toggleAddEventModal,
  event,
  navigation,
  title,
  toggleSwitch,
  switchValue,
}) => {
  const { user } = useStore();
  const [activeBannerData, setActiveBannerData] = useState(null);

  // Function to fetch the active banner
  const fetchActiveBanner = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("active_banner")
      .select("banner_id")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned for single query
        setActiveBannerData(null); // Set active banner data to null if no active banner
      } else {
        console.error("Error fetching active banner:", error.message);
      }
      return;
    }

    if (data) {
      const { data: bannerData, error: bannerError } = await supabase
        .from("banners")
        .select("image_url")
        .eq("id", data.banner_id)
        .single();

      if (bannerError) {
        console.error("Error fetching banner details:", bannerError.message);
        setActiveBannerData(null); // Fallback to null if there's an error with banner details
      } else {
        setActiveBannerData(bannerData);
      }
    } else {
      setActiveBannerData(null); // Explicitly set to null if no data returned
    }
  };

  // Use useFocusEffect to refetch active banner on screen focus
  useFocusEffect(
    React.useCallback(() => {
      fetchActiveBanner();
    }, [user, fetchActiveBanner]) // Re-run when user changes
  );

  const handleHeaderPress = () => {
    if (event === "message") {
      navigation.navigate("Contact");
    } else if (event === "calendar") {
      toggleAddEventModal();
    } else if (event === "call") {
      navigation.navigate("Contact");
    }
  };

  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("Settings", { profilephoto: avatarUrl })
        }
      >
        {activeBannerData && (
          <Image
            source={{ uri: activeBannerData.image_url }}
            style={styles.bannerImage}
          />
        )}
        {avatarUrl ? (
          <Image
            accessibilityLabel=""
            alt="Avatar"
            resizeMode="cover"
            source={{ uri: avatarUrl }}
            style={styles.cardImg}
          />
        ) : (
          <View style={[styles.cardImg]}>
            <Text style={styles.cardAvatarText}>
              {user.user_metadata.username[0].toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <TouchableOpacity onPress={handleHeaderPress}>
        {event === "calendar" ? (
          <Image source={calendarImage} style={styles.calendarIcon} />
        ) : event === "message" ? (
          <Image source={messageImage} style={styles.messageIcon} />
        ) : event === "call" ? (
          <Image source={callImage} style={styles.callIcon} />
        ) : null}
      </TouchableOpacity>

      {event === "shop" && (
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>
            {switchValue ? "Show Owned" : "Show All"}
          </Text>
          <Switch
            onValueChange={toggleSwitch}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            value={switchValue}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    marginTop: 30,
    position: "relative",
  },
  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: "relative",
    zIndex: 0,
  },
  cardImg: {
    width: 40,
    height: 40,
    marginRight: 8,
    backgroundColor: "#FFADAD", // soft coral to complement pastel blue
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  cardAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF", // keeping the text white for readability
  },
  bannerImage: {
    position: "absolute",
    width: 55, // Adjusted size for banner image
    height: 55, // Adjusted size for banner image
    borderRadius: 0, // Keep it circular
    zIndex: 1,
    top: -5.5, // Adjust position as needed
    left: -7.5, // Adjust position as needed
  },
  calendarIcon: {
    width: 35,
    height: 35,
  },
  messageIcon: {
    width: 23,
    height: 23,
  },
  callIcon: {
    width: 23,
    height: 23,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    bottom: 0,
  },
  switchLabel: {
    marginRight: -4,
  },
});

export default Header;
