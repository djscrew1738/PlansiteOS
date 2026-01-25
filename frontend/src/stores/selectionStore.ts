import { create } from 'zustand';

interface SelectionState {
  // Selected items by resource type
  selectedEstimates: Set<number>;
  selectedBlueprints: Set<number>;
  selectedLeads: Set<number>;

  // Actions for estimates
  toggleEstimate: (id: number) => void;
  selectAllEstimates: (ids: number[]) => void;
  clearEstimates: () => void;

  // Actions for blueprints
  toggleBlueprint: (id: number) => void;
  selectAllBlueprints: (ids: number[]) => void;
  clearBlueprints: () => void;

  // Actions for leads
  toggleLead: (id: number) => void;
  selectAllLeads: (ids: number[]) => void;
  clearLeads: () => void;

  // Clear all selections
  clearAll: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedEstimates: new Set(),
  selectedBlueprints: new Set(),
  selectedLeads: new Set(),

  // Estimate actions
  toggleEstimate: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedEstimates);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { selectedEstimates: newSet };
    }),

  selectAllEstimates: (ids) =>
    set({ selectedEstimates: new Set(ids) }),

  clearEstimates: () =>
    set({ selectedEstimates: new Set() }),

  // Blueprint actions
  toggleBlueprint: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedBlueprints);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { selectedBlueprints: newSet };
    }),

  selectAllBlueprints: (ids) =>
    set({ selectedBlueprints: new Set(ids) }),

  clearBlueprints: () =>
    set({ selectedBlueprints: new Set() }),

  // Lead actions
  toggleLead: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedLeads);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { selectedLeads: newSet };
    }),

  selectAllLeads: (ids) =>
    set({ selectedLeads: new Set(ids) }),

  clearLeads: () =>
    set({ selectedLeads: new Set() }),

  // Clear all
  clearAll: () =>
    set({
      selectedEstimates: new Set(),
      selectedBlueprints: new Set(),
      selectedLeads: new Set(),
    }),
}));
