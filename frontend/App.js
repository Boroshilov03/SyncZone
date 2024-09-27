import "react-native-url-polyfill/auto"; // Keep this at the top to ensure URL polyfill works
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { supabase } from "./src/lib/supabase"; // Import supabase client
import { AppNavigator } from "./src/navigation/AppNavigator"; // Your main app navigation
import SplashScreen from "./src/screens/SplashScreen"; // Adjust the import path as needed
import useStore from "./src/store/store"; // Import useStore
import SignInScreen from "./src/screens/SignInScreen";

export default function App() {
  const {
    setInitialized,
    setAuthenticated,
    setUser,
    setAccessToken,
    setRefreshToken,
  } = useStore();
  const [session, setSession] = useState(null); // Managing session state
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      handleSession(session);
      setLoading(false);
    };

    const handleSession = (session) => {
      setSession(session);
      if (session) {
        setAuthenticated(true);
        setUser(session.user);
        setAccessToken(session.access_token);
        setRefreshToken(session.refresh_token);
      } else {
        setAuthenticated(false);
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <SplashScreen />; // Show a loading screen while fetching the session
  }

  return (
    <NavigationContainer>
      <AppNavigator session={session} />
    </NavigationContainer>
  );
}
