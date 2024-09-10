import React, { useContext } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ChatsScreen from "../screens/ChatsScreen";
import ChatDetailScreen from "../screens/ChatDetailScreen";
import SplashScreen from "../screens/SplashScreen";
import SignInScreen from "../screens/SignInScreen";
import SignUpScreen from "../screens/SignUpScreen";
import GiftsScreen from "../screens/GiftsScreen";
import CallsScreen from "../screens/CallsScreen";
import CalendarScreen from "../screens/CalendarScreen"
import useStore from "../store/store";
import MainTabNavigator from "../components/MainTabNavigator";

const Stack = createStackNavigator();

export function AppNavigator() {
    const { initialized, authenticated } = useStore();

  return (
    <Stack.Navigator>
      {!initialized ? (
        <Stack.Screen name="Splash" component={SplashScreen} />
      ) : !authenticated ? (
        <>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component= {MainTabNavigator} />
          <Stack.Screen name="Chats" component={ChatsScreen} />
          <Stack.Screen name="Gifts" component={GiftsScreen} />
          <Stack.Screen name="Calls" component={CallsScreen} />
          <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
          <Stack.Screen name="Calendar" component={CalendarScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
