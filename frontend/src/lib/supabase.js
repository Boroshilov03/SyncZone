import { AppState } from "react-native";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { REACT_APP_SUPABASE_URL, REACT_APP_ANON_KEY } from "@env";

const supabaseUrl = REACT_APP_SUPABASE_URL;
//"https://yjsyzptnadinqxzmkgdh.supabase.co"
const supabaseAnonKey = REACT_APP_ANON_KEY;//"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlqc3l6cHRuYWRpbnF4em1rZ2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcwNDAzMTEsImV4cCI6MjA0MjYxNjMxMX0.jfGIoX3U5Klw71J05I433wTZ02uJKIZlhbkmoyGZZh0"


console.log(supabaseUrl);
console.log(supabaseAnonKey);

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
