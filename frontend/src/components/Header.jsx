import { View, Image, StyleSheet, TouchableOpacity, Text } from "react-native";
import React from "react";

const profilePic = require("../../assets/icons/pfp_icon.png");
const calendarImage = require("../../assets/icons/add_calendar.png");
const messageImage = require("../../assets/icons/add_message.png");
const callImage = require("../../assets/icons/add_call.png");

const Header = ({ toggleAddEventModal, event, navigation, title }) => {
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

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
        <Image
          source={profilePic}
          style={styles.profilePic}
          onPress={() => navigation.navigate("Settings")}
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
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
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
