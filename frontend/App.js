import "react-native-url-polyfill/auto"; // Keep this at the top to ensure URL polyfill works
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { supabase } from "./src/lib/supabase"; // Import supabase client
import { AppNavigator } from "./src/navigation/AppNavigator"; // Your main app navigation
import SplashScreen from "./src/screens/SplashScreen"; // Adjust the import path as needed
import useSession from "./src/hooks/useSession"; // Import your custom hook
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // Import QueryClient and QueryClientProvider

// Create a new instance of QueryClient
const queryClient = new QueryClient();

export default function App() {
  const { loading } = useSession(); // Use the session hook

  if (loading) {
    return <SplashScreen />; // Show a loading screen while fetching the session
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
