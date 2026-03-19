import { create } from 'zustand';

export const useChatStore = create((set) => ({
  messages: [
    { id: '1', role: 'assistant', content: '¡Hola! Soy el asistente IA nativo de KConecta. ¿En qué te ayudo?' }
  ],
  isLoading: false,

  addMessage: (message) => 
    set((state) => ({ messages: [...state.messages, message] })),

  setLoading: (status) => 
    set({ isLoading: status }),

  clearChat: () => 
    set({ messages: [] })
}));
