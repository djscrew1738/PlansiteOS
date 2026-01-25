import { useState, useEffect } from 'react';
import { BookmarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';
import type { FilterValues } from './AdvancedFilters';

interface FilterPreset {
  id: string;
  name: string;
  filters: FilterValues;
  createdAt: string;
}

interface FilterPresetsProps {
  currentFilters: FilterValues;
  onLoadPreset: (filters: FilterValues) => void;
}

const STORAGE_KEY = 'estimate-filter-presets';

export default function FilterPresets({ currentFilters, onLoadPreset }: FilterPresetsProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPresets(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load filter presets:', err);
    }
  }, []);

  // Save presets to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (err) {
      console.error('Failed to save filter presets:', err);
    }
  }, [presets]);

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    };

    setPresets([...presets, newPreset]);
    setPresetName('');
    setShowSaveModal(false);
  };

  const handleDeletePreset = (id: string) => {
    setPresets(presets.filter(p => p.id !== id));
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    onLoadPreset(preset.filters);
    setShowPresetsMenu(false);
  };

  const hasActiveFilters =
    currentFilters.dateRange ||
    currentFilters.amountRange ||
    (currentFilters.statuses && currentFilters.statuses.length > 0);

  return (
    <>
      <div className="relative">
        <div className="flex gap-2">
          {/* Presets Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPresetsMenu(!showPresetsMenu)}
            className="flex items-center gap-2"
          >
            <BookmarkIcon className="w-4 h-4" />
            Presets
            {presets.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-semibold bg-slate-700 rounded">
                {presets.length}
              </span>
            )}
          </Button>

          {/* Save Preset Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1"
            >
              <PlusIcon className="w-4 h-4" />
              Save
            </Button>
          )}
        </div>

        {/* Presets Dropdown Menu */}
        {showPresetsMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowPresetsMenu(false)}
            />
            <div className="absolute left-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
              {presets.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-400">
                  No saved presets yet
                </div>
              ) : (
                <div className="p-2">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between gap-2 p-2 rounded hover:bg-slate-700 group"
                    >
                      <button
                        onClick={() => handleLoadPreset(preset)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <BookmarkSolidIcon className="w-4 h-4 text-blue-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">
                              {preset.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(preset.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeletePreset(preset.id)}
                        className="p-1 rounded hover:bg-slate-600 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete preset"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Save Preset Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
          setPresetName('');
        }}
        title="Save Filter Preset"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Save your current filter settings as a preset for quick access later.
          </p>

          <Input
            label="Preset Name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="e.g., High Value Won Deals"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && presetName.trim()) {
                handleSavePreset();
              }
            }}
          />

          {/* Preview of current filters */}
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <p className="text-xs font-medium text-slate-400 mb-2">Current Filters:</p>
            <div className="space-y-1 text-xs text-slate-500">
              {currentFilters.dateRange && (
                <div>• Date Range: {currentFilters.dateRange.start} to {currentFilters.dateRange.end}</div>
              )}
              {currentFilters.amountRange && (
                <div>
                  • Amount: ${currentFilters.amountRange.min || 0} - $
                  {currentFilters.amountRange.max === Infinity ? '∞' : currentFilters.amountRange.max}
                </div>
              )}
              {currentFilters.statuses && currentFilters.statuses.length > 0 && (
                <div>• Status: {currentFilters.statuses.join(', ')}</div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={() => {
                setShowSaveModal(false);
                setPresetName('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
            >
              <BookmarkIcon className="w-4 h-4 mr-2" />
              Save Preset
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
