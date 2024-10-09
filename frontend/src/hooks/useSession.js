// src/hooks/useSession.js
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // Adjust path if needed
import useStore from "../store/store"; // Zustand store for managing global state

const useSession = () => {
  const { setUser, setAccessToken, setRefreshToken } = useStore();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to update the session state
  const updateSession = (session) => {
    setSession(session);
    if (session) {
      setUser(session.user);
      setAccessToken(session.access_token); // Store access token if available
      setRefreshToken(session.refresh_token); // Store refresh token if available
    } else {
      setUser(null); // Clear user if session is null
    }
    console.log("Fetched session:", session); // Log the fetched session
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw new Error(error.message);
        updateSession(data.session);
      } catch (error) {
        console.error("Error fetching session", error);
        setSession(null); // Optionally set session to null on error
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        updateSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setUser, setAccessToken, setRefreshToken]); // Add all dependencies

  return { session, loading };
};

export default useSession;
