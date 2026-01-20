import { create } from 'zustand';
import type { VladConversation, VladMessage } from '../types';

interface VladStore {
  conversations: VladConversation[];
  currentConversation: VladConversation | null;
  loading: boolean;
  streaming: boolean;
  error: string | null;

  // Actions
  setConversations: (conversations: VladConversation[]) => void;
  createConversation: (title: string) => void;
  selectConversation: (id: string) => void;
  addMessage: (message: VladMessage) => void;
  updateLastMessage: (content: string) => void;
  deleteConversation: (id: string) => void;
  archiveConversation: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
}

export const useVladStore = create<VladStore>((set) => ({
  // Initial state
  conversations: [],
  currentConversation: null,
  loading: false,
  streaming: false,
  error: null,

  // Actions
  setConversations: (conversations) => set({ conversations }),
  createConversation: (title) => {
    const newConversation: VladConversation = {
      id: `conv_${Date.now()}`,
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false,
    };
    set((state) => ({
      conversations: [newConversation, ...state.conversations],
      currentConversation: newConversation,
    }));
  },
  selectConversation: (id) =>
    set((state) => ({
      currentConversation: state.conversations.find((c) => c.id === id) || null,
    })),
  addMessage: (message) =>
    set((state) => {
      if (!state.currentConversation) return state;

      const updatedConversation = {
        ...state.currentConversation,
        messages: [...state.currentConversation.messages, message],
        updatedAt: new Date().toISOString(),
      };

      return {
        currentConversation: updatedConversation,
        conversations: state.conversations.map((c) =>
          c.id === updatedConversation.id ? updatedConversation : c
        ),
      };
    }),
  updateLastMessage: (content) =>
    set((state) => {
      if (!state.currentConversation || state.currentConversation.messages.length === 0) {
        return state;
      }

      const messages = [...state.currentConversation.messages];
      const lastMessage = messages[messages.length - 1];
      messages[messages.length - 1] = { ...lastMessage, content };

      const updatedConversation = {
        ...state.currentConversation,
        messages,
        updatedAt: new Date().toISOString(),
      };

      return {
        currentConversation: updatedConversation,
        conversations: state.conversations.map((c) =>
          c.id === updatedConversation.id ? updatedConversation : c
        ),
      };
    }),
  deleteConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      currentConversation:
        state.currentConversation?.id === id ? null : state.currentConversation,
    })),
  archiveConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, archived: true } : c
      ),
    })),
  setLoading: (loading) => set({ loading }),
  setStreaming: (streaming) => set({ streaming }),
  setError: (error) => set({ error }),
}));
