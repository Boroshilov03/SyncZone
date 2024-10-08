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
import recentCalls from "../screens/recentCalls";

const Stack = createStackNavigator();

export function AppNavigator() {
  const { session } = useStore(); // Get session from store

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // This will apply to all screens
      }}
    >
      {session ? (
        // Authenticated user navigation
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="Chats" component={ChatsScreen} />
          <Stack.Screen name="Gifts" component={GiftsScreen} />
          <Stack.Screen name="Calls" component={CallsScreen} />
          <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
          <Stack.Screen name="Calendar" component={CalendarScreen} />
          <Stack.Screen name="RecentCall" component={recentCalls} />
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
