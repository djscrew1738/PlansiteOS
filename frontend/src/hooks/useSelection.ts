import { useSelectionStore } from '../stores/selectionStore';

export type ResourceType = 'estimates' | 'blueprints' | 'leads';

/**
 * Hook for managing multi-select functionality
 */
export function useSelection(type: ResourceType) {
  const store = useSelectionStore();

  const getters = {
    estimates: {
      selected: store.selectedEstimates,
      toggle: store.toggleEstimate,
      selectAll: store.selectAllEstimates,
      clear: store.clearEstimates,
    },
    blueprints: {
      selected: store.selectedBlueprints,
      toggle: store.toggleBlueprint,
      selectAll: store.selectAllBlueprints,
      clear: store.clearBlueprints,
    },
    leads: {
      selected: store.selectedLeads,
      toggle: store.toggleLead,
      selectAll: store.selectAllLeads,
      clear: store.clearLeads,
    },
  };

  const current = getters[type];

  return {
    selected: current.selected,
    count: current.selected.size,
    isSelected: (id: number) => current.selected.has(id),
    toggle: current.toggle,
    selectAll: current.selectAll,
    clear: current.clear,
    clearAll: store.clearAll,
  };
}
