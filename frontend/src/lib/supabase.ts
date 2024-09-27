import { AppState } from "react-native";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yjsyzptnadinqxzmkgdh.supabase.co"; // Replace with your Supabase URL
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlqc3l6cHRuYWRpbnF4em1rZ2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcwNDAzMTEsImV4cCI6MjA0MjYxNjMxMX0.jfGIoX3U5Klw71J05I433wTZ02uJKIZlhbkmoyGZZh0"; // Replace with your Supabase Anon Key

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
