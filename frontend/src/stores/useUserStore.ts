import { create } from 'zustand';
import type { User } from '../types';

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  // Actions
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // Mock login - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockUser: User = {
        id: 'user_1',
        email,
        name: 'John Smith',
        role: 'admin',
        avatar: undefined,
        phone: '(214) 555-0123',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      set({ user: mockUser, isAuthenticated: true, loading: false });
    } catch (error) {
      set({ error: 'Login failed', loading: false });
    }
  },
  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
    });
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
