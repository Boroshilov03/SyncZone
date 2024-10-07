import { create } from "zustand";

const useStore = create((set) => ({
  user: null, // To store user details
  accessToken: null, // For access token
  refreshToken: null, // For refresh token
  session: null, // Manage session state

  setUser: (userData) => set({ user: userData, session: userData ? true : false }), // Set user details and update session state
  setAccessToken: (token) => set({ accessToken: token }), // Set access token
  setRefreshToken: (token) => set({ refreshToken: token }), // Set refresh token
  clearSession: () => set({ user: null, accessToken: null, refreshToken: null, session: null }), // Clear session
}));

export default useStore;
