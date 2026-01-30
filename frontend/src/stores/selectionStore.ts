import { create } from 'zustand';

interface SelectionState {
  // Selected items by resource type
  selectedEstimates: Set<string>;
  selectedBlueprints: Set<string>;
  selectedLeads: Set<string>;

  // Actions for estimates
  toggleEstimate: (id: string) => void;
  selectAllEstimates: (ids: string[]) => void;
  clearEstimates: () => void;

  // Actions for blueprints
  toggleBlueprint: (id: string) => void;
  selectAllBlueprints: (ids: string[]) => void;
  clearBlueprints: () => void;

  // Actions for leads
  toggleLead: (id: string) => void;
  selectAllLeads: (ids: string[]) => void;
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
