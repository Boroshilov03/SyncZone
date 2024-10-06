import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useLayoutEffect } from "react";
import { Image, Text, StyleSheet, View } from "react-native";
import GiftsScreen from "../screens/GiftsScreen";
import CallsScreen from "../screens/CallsScreen";
import CalendarScreen from "../screens/CalendarScreen";
import ChatsScreen from "../screens/ChatsScreen";

const Tab = createBottomTabNavigator();

const iconMap = {
  Gifts: require("../../assets/icons/gift-icon.png"),
  Chats: require("../../assets/icons/chat-icon.png"),
  Calls: require("../../assets/icons/call-icon.png"),
  Calendar: require("../../assets/icons/calendar-icon.png"),
};

const backgroundColorMap = {
  Gifts: "#F6D6EE",
  Chats: "#C3D9F6",
  Calls: "#D1EBEF",
  Calendar: "#FBEFD3",
};

const colorMap = {
  Gifts: "#C9379D",
  Chats: "#093DAC",
  Calls: "#157483",
  Calendar: "#E6A919",
};

const labelMap = {
  Gifts: "Shop",
  Chats: "Chat",
  Calls: "Call",
  Calendar: "Calendar",
};

// Define icon sizes for different tabs
const iconSizeMap = {
  Gifts: { width: 30, height: 25 },
  Chats: { width: 25, height: 20 }, // Smaller size for Chats
  Calls: { width: 25, height: 20 }, // Smaller size for Calls
  Calendar: { width: 30, height: 25 },
};

function MainTabNavigator({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 60,
        },
        headerShown: false, // Add this line to ensure no headers are shown
        tabBarIcon: ({ focused }) => {
          const icon = iconMap[route.name];
          const backgroundColor = backgroundColorMap[route.name];
          const color = colorMap[route.name];
          const label = labelMap[route.name];
          const { width, height } = iconSizeMap[route.name];

          return (
            <View
              style={[
                styles.iconContainer,
                focused && {
                  ...styles.activeBubble,
                  backgroundColor,
                },
              ]}
            >
              <Image
                source={icon}
                style={[
                  styles.icon,
                  { width, height },
                  focused && { tintColor: color },
                ]}
              />
              {focused && (
                <Text style={[styles.label, { color }]}>{label}</Text>
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Gifts" component={GiftsScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Calls" component={CallsScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  icon: {
    // Default size will be overridden by iconSizeMap
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  label: {
    fontSize: 14,
    marginLeft: 5,
  },
  activeBubble: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
});

export default MainTabNavigator;
