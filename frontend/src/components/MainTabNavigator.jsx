import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import React, { useLayoutEffect } from "react";
import GiftsScreen from "../screens/GiftsScreen";
import CallsScreen from "../screens/CallsScreen";
import CalendarScreen from "../screens/CalendarScreen";
import ChatsScreen from "../screens/ChatsScreen";

const Tab = createBottomTabNavigator();

function MainTabNavigator({ navigation }) {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  return (
    <Tab.Navigator>
      <Tab.Screen name="Gifts" component={GiftsScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Calls" component={CallsScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
    </Tab.Navigator>
  );
}

export default MainTabNavigator;
