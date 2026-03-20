import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Helper de almacenamiento multiplataforma
const storage = {
  getItem: async (key) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }
};

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  initialized: false,
  
  setToken: async (token) => {
    try {
      if (token) {
        await storage.setItem('auth_token', token);
      } else {
        await storage.deleteItem('auth_token');
      }
      set({ token });
    } catch (e) {
      console.error('Error in storage setToken', e);
    }
  },
  
  setUser: (user) => set({ user }),
  
  initAuth: async () => {
    if (get().initialized) return;
    try {
      const token = await storage.getItem('auth_token');
      set({ token, initialized: true });
    } catch (e) {
      console.error('Error reading auth token', e);
      set({ initialized: true });
    }
  },
  
  logout: async () => {
    try {
        await storage.deleteItem('auth_token');
    } catch (e) {}
    set({ token: null, user: null });
  }
}));

