import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ChatsScreen from "../screens/ChatsScreen";
import ChatDetailScreen from "../screens/ChatDetailScreen";
import SignInScreen from "../screens/SignInScreen";
import SignUpScreen from "../screens/SignUpScreen";
import GiftsScreen from "../screens/GiftsScreen";
import CallsScreen from "../screens/CallsScreen";
import CalendarScreen from "../screens/CalendarScreen";
import MainTabNavigator from "../components/MainTabNavigator";
import useStore from "../store/store";
import RecentCalls from "../screens/RecentCalls";
import SettingsScreen from "../screens/SettingsScreen";
import Header from "../components/Header";

import ContactScreen from "../screens/ContactScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createStackNavigator();

export function AppNavigator() {
  const { session } = useStore(); // Get session from store

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        // Authenticated user navigation
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="Chats" component={ChatsScreen} />
          <Stack.Screen name="Gifts" component={GiftsScreen} />
          <Stack.Screen name="Calls" component={CallsScreen} />
          <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
          <Stack.Screen name="Calendar" component={CalendarScreen} />
          <Stack.Screen name="RecentCall" component={RecentCalls} />
          <Stack.Screen name="Contact" component={ContactScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Header" component={Header} />
        </>
      ) : (
        // Non-authenticated user navigation
        <>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
