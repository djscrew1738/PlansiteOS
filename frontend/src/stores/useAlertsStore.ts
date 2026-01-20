import { create } from 'zustand';
import type { Alert } from '../types';

interface AlertsStore {
  alerts: Alert[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Actions
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteAlert: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAlertsStore = create<AlertsStore>((set) => ({
  // Initial state
  alerts: [],
  unreadCount: 0,
  loading: false,
  error: null,

  // Actions
  setAlerts: (alerts) =>
    set({
      alerts,
      unreadCount: alerts.filter((a) => !a.read).length,
    }),
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts],
      unreadCount: alert.read ? state.unreadCount : state.unreadCount + 1,
    })),
  markAsRead: (id) =>
    set((state) => {
      const alert = state.alerts.find((a) => a.id === id);
      if (!alert || alert.read) return state;

      return {
        alerts: state.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
        unreadCount: state.unreadCount - 1,
      };
    }),
  markAllAsRead: () =>
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    })),
  deleteAlert: (id) =>
    set((state) => {
      const alert = state.alerts.find((a) => a.id === id);
      return {
        alerts: state.alerts.filter((a) => a.id !== id),
        unreadCount: alert && !alert.read ? state.unreadCount - 1 : state.unreadCount,
      };
    }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
