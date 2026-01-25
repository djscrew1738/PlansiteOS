// Zustand store for app-wide state
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Current project context
  currentProjectId: string | null;
  setCurrentProject: (id: string | null) => void;

  // Upload tracking
  activeUploads: string[]; // uploadIds currently being processed
  addUpload: (uploadId: string) => void;
  removeUpload: (uploadId: string) => void;

  // UI preferences
  blueprintViewMode: 'grid' | 'list';
  setBlueprintViewMode: (mode: 'grid' | 'list') => void;

  // Toast notifications queue
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Project context
      currentProjectId: null,
      setCurrentProject: (id) => set({ currentProjectId: id }),

      // Upload tracking
      activeUploads: [],
      addUpload: (uploadId) =>
        set((state) => ({
          activeUploads: [...state.activeUploads, uploadId],
        })),
      removeUpload: (uploadId) =>
        set((state) => ({
          activeUploads: state.activeUploads.filter((id) => id !== uploadId),
        })),

      // UI preferences
      blueprintViewMode: 'grid',
      setBlueprintViewMode: (mode) => set({ blueprintViewMode: mode }),

      // Toasts
      toasts: [],
      addToast: (toast) =>
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
        })),
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'plansiteos-storage',
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
        blueprintViewMode: state.blueprintViewMode,
      }),
    }
  )
);

// Selector hooks for common patterns
export const useCurrentProject = () => useAppStore((s) => s.currentProjectId);
export const useActiveUploads = () => useAppStore((s) => s.activeUploads);
export const useToasts = () => useAppStore((s) => s.toasts);
