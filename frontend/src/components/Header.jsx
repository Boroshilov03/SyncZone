import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Switch,
} from "react-native";
import React, { useState } from "react";
import useStore from "../store/store";
import { SafeAreaView } from "react-native-safe-area-context";

const profilePic = require("../../assets/icons/pfp_icon.png");
const calendarImage = require("../../assets/icons/add_calendar.png");
const messageImage = require("../../assets/icons/add_message.png");
const callImage = require("../../assets/icons/add_call.png");

const Header = ({ toggleAddEventModal, event, navigation, title, toggleSwitch, switchValue }) => {
  const { user } = useStore();
  const [form, setForm] = useState({ emailNotifications: false });

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
        <Image
          accessibilityLabel=""
          source={avatarUrl ? { uri: avatarUrl } : profilePic}
          style={styles.profilePic}
        />
      </TouchableOpacity>

      {/* Static Title */}
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
            style={{ transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }] }}
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
    padding: 5,
    marginTop: 20,
    position: 'relative', // Make sure the header has a relative position
  },
  titleContainer: {
    position: 'absolute', // Position the title absolutely
    left: 0,
    right: 0,
    alignItems: 'center',
    marginTop: 50,
    marginLeft: 10,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: 'center',
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
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchLabel: {
    marginRight: 8,
  },
});

export default Header;
