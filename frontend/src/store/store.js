import {create} from "zustand";

const useStore = create((set) => ({
    initialized: true,
    authenticated: true,
    setInitialized: (value) => set({ initialized: value }),
    setAuthenticated: (value) => set({ authenticated: value }),
}));

export default useStore;
