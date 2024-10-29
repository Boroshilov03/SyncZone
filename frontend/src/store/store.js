import { create } from "zustand";

const useStore = create((set) => ({
  user: null, // To store user details
  accessToken: null, // For access token
  refreshToken: null, // For refresh token
  session: null, // Manage session state
  banners: [], // State for banners
  stickers: [], // State for stickers
  user_banners: [], // State for user's owned banners
  user_stickers: [], // State for user's owned stickers
  active_banner: null, // State for the user's active banner

  setUser: (userData) => set({ user: userData, session: userData ? true : false }), // Set user details and update session state
  setAccessToken: (token) => set({ accessToken: token }), // Set access token
  setRefreshToken: (token) => set({ refreshToken: token }), // Set refresh token
  clearSession: () => set({ user: null, accessToken: null, refreshToken: null, session: null }), // Clear session
  setBanners: (bannersData) => set({ banners: bannersData }), // Set banners data
  setStickers: (stickersData) => set({ stickers: stickersData }), // Set stickers data
  setUserBanners: (UseBannersData) => set({ user_banners: UseBannersData }), // Set user's owned banners
  setUserStickers: (UseStickersData) => set({ user_stickers: UseStickersData }), // Set user's owned stickers
  setActiveBanner: (bannerId) => set({ active_banner: bannerId }), // Set user's active banner
}));

export default useStore;
