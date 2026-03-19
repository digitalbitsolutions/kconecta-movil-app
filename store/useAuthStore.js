import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  initialized: false,
  
  setToken: async (token) => {
    try {
      if (token) {
        await SecureStore.setItemAsync('auth_token', token);
      } else {
        await SecureStore.deleteItemAsync('auth_token');
      }
      set({ token });
    } catch (e) {
      console.error('Error in SecureStore setToken', e);
    }
  },
  
  setUser: (user) => set({ user }),
  
  initAuth: async () => {
    if (get().initialized) return;
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      set({ token, initialized: true });
    } catch (e) {
      console.error('Error reading generic auth token', e);
      set({ initialized: true });
    }
  },
  
  logout: async () => {
    try {
        await SecureStore.deleteItemAsync('auth_token');
    } catch (e) {}
    set({ token: null, user: null });
  }
}));
