import { create } from "zustand";

const useStore = create((set) => ({
  initialized: true,
  authenticated: false,
  user: null, // To store user details
  accessToken: null, // For access token
  refreshToken: null, // For refresh token
  setInitialized: (value) => set({ initialized: value }),
  setAuthenticated: (value) => set({ authenticated: value }),
  setUser: (userData) => set({ user: userData }), // Set user details
  setAccessToken: (token) => set({ accessToken: token }), // Set access token
  setRefreshToken: (token) => set({ refreshToken: token }), // Set refresh token
}));

export default useStore;
