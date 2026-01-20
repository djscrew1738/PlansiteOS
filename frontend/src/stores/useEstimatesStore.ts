import { create } from 'zustand';
import type { Estimate } from '../types';

interface EstimatesStore {
  estimates: Estimate[];
  selectedEstimate: Estimate | null;
  loading: boolean;
  error: string | null;

  // Actions
  setEstimates: (estimates: Estimate[]) => void;
  addEstimate: (estimate: Estimate) => void;
  updateEstimate: (id: string, updates: Partial<Estimate>) => void;
  deleteEstimate: (id: string) => void;
  selectEstimate: (estimate: Estimate | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEstimatesStore = create<EstimatesStore>((set) => ({
  // Initial state
  estimates: [],
  selectedEstimate: null,
  loading: false,
  error: null,

  // Actions
  setEstimates: (estimates) => set({ estimates }),
  addEstimate: (estimate) =>
    set((state) => ({ estimates: [estimate, ...state.estimates] })),
  updateEstimate: (id, updates) =>
    set((state) => ({
      estimates: state.estimates.map((est) =>
        est.id === id ? { ...est, ...updates } : est
      ),
      selectedEstimate:
        state.selectedEstimate?.id === id
          ? { ...state.selectedEstimate, ...updates }
          : state.selectedEstimate,
    })),
  deleteEstimate: (id) =>
    set((state) => ({
      estimates: state.estimates.filter((est) => est.id !== id),
      selectedEstimate: state.selectedEstimate?.id === id ? null : state.selectedEstimate,
    })),
  selectEstimate: (estimate) => set({ selectedEstimate: estimate }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
