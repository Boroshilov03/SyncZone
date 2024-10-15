import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from "react-native";
import React from "react";
import useStore from "../store/store";
import { SafeAreaView } from "react-native-safe-area-context";

const profilePic = require("../../assets/icons/pfp_icon.png");
const calendarImage = require("../../assets/icons/add_calendar.png");
const messageImage = require("../../assets/icons/add_message.png");
const callImage = require("../../assets/icons/add_call.png");

const Header = ({ toggleAddEventModal, event, navigation, title }) => {
  const { user } = useStore();

  // Handle the action based on the event type
  const handleHeaderPress = () => {
    if (event === "message") {
      navigation.navigate("Contact");
    } else if (event === "calendar") {
      toggleAddEventModal();
    } else if (event === "call") {
      navigation.navigate("Contact");
    }
  };

  // Validate avatar_url
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  return (
    <SafeAreaView style={styles.headerContainer}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("Settings", { profilephoto: avatarUrl })
        }
      >
        <Image
          accessibilityLabel=""
          source={avatarUrl ? { uri: avatarUrl } : profilePic} // Use the profilePic if avatarUrl is not a valid string
          style={styles.profilePic}
        />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={handleHeaderPress}>
        {event === "calendar" ? (
          <Image source={calendarImage} style={styles.calendarIcon} />
        ) : event === "message" ? (
          <Image source={messageImage} style={styles.messageIcon} />
        ) : event === "call" ? (
          <Image source={callImage} style={styles.callIcon} />
        ) : null}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 5,
    marginLeft: 10,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  calendarIcon: {
    width: 35,
    height: 35,
  },
  messageIcon: {
    width: 30,
    height: 30,
  },
  callIcon: {
    width: 23,
    height: 23,
  },
});

export default Header;
