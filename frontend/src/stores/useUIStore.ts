import { create } from 'zustand';
import type { UIState } from '../types';

interface UIStore extends UIState {
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setCurrentPage: (page: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  sidebarOpen: true,
  mobileNavOpen: false,
  theme: 'light',
  currentPage: 'dashboard',
  loading: false,
  error: null,

  // Actions
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  setTheme: (theme) => set({ theme }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
