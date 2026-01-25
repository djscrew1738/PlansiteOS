import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CalculatorIcon,
  UserGroupIcon,
  PlusIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useBids, useBlueprints } from '../hooks/useApi';
import type { Blueprint, Bid } from '../types/api';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data: bidsData } = useBids(1, 100);
  const { data: blueprintsData } = useBlueprints(1, 100);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [open, onClose]);

  const handleSelect = (callback: () => void) => {
    callback();
    onClose();
    setSearch('');
  };

  if (!open) return null;

  const blueprints = blueprintsData?.blueprints || [];
  const bids = bidsData?.bids || [];

  // Filter results based on search
  const filteredBlueprints = search
    ? blueprints.filter(bp =>
        bp.project_name?.toLowerCase().includes(search.toLowerCase()) ||
        bp.file_name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : [];

  const filteredBids = search
    ? bids.filter(bid =>
        bid.project_name.toLowerCase().includes(search.toLowerCase()) ||
        bid.customer_name?.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-start justify-center pt-[20vh] px-4">
        <Command.Dialog
          open={open}
          onOpenChange={(open) => !open && onClose()}
          className="w-full max-w-2xl bg-slate-900 rounded-lg shadow-2xl border border-slate-800 overflow-hidden animate-slideIn"
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-slate-800 px-4">
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 mr-3" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search blueprints, estimates, or type a command..."
              className="w-full bg-transparent border-none outline-none py-4 text-slate-100 placeholder-slate-500"
            />
          </div>

          {/* Results */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-slate-400">
              No results found.
            </Command.Empty>

            {/* Quick Actions */}
            {!search && (
              <Command.Group heading="Quick Actions" className="text-xs text-slate-500 px-2 py-2 font-medium">
                <Command.Item
                  onSelect={() => handleSelect(() => navigate('/estimates'))}
                  className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-slate-800 text-slate-300"
                >
                  <div className="p-2 rounded bg-blue-500/10">
                    <PlusIcon className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New Estimate</p>
                    <p className="text-xs text-slate-500">Create a new project estimate</p>
                  </div>
                  <span className="text-xs text-slate-600">⌘N</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => handleSelect(() => navigate('/blueprints'))}
                  className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-slate-800 text-slate-300"
                >
                  <div className="p-2 rounded bg-green-500/10">
                    <CloudArrowUpIcon className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Upload Blueprint</p>
                    <p className="text-xs text-slate-500">Upload and analyze blueprints</p>
                  </div>
                  <span className="text-xs text-slate-600">⌘U</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => handleSelect(() => navigate('/leads'))}
                  className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-slate-800 text-slate-300"
                >
                  <div className="p-2 rounded bg-purple-500/10">
                    <UserGroupIcon className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Add Lead</p>
                    <p className="text-xs text-slate-500">Create a new lead</p>
                  </div>
                  <span className="text-xs text-slate-600">⌘L</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => handleSelect(() => navigate('/reports'))}
                  className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-slate-800 text-slate-300"
                >
                  <div className="p-2 rounded bg-yellow-500/10">
                    <ChartBarIcon className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">View Reports</p>
                    <p className="text-xs text-slate-500">Analytics and insights</p>
                  </div>
                </Command.Item>
              </Command.Group>
            )}

            {/* Blueprints Results */}
            {search && filteredBlueprints.length > 0 && (
              <Command.Group heading="Blueprints" className="text-xs text-slate-500 px-2 py-2 font-medium">
                {filteredBlueprints.map((blueprint) => (
                  <Command.Item
                    key={blueprint.id}
                    onSelect={() => handleSelect(() => navigate(`/blueprints/${blueprint.id}`))}
                    className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-slate-800 text-slate-300"
                  >
                    <DocumentTextIcon className="w-5 h-5 text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {blueprint.project_name || blueprint.file_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {blueprint.total_fixtures} fixtures • {blueprint.status}
                      </p>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Estimates Results */}
            {search && filteredBids.length > 0 && (
              <Command.Group heading="Estimates" className="text-xs text-slate-500 px-2 py-2 font-medium">
                {filteredBids.map((bid) => (
                  <Command.Item
                    key={bid.id}
                    onSelect={() => handleSelect(() => navigate(`/estimates`))}
                    className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-slate-800 text-slate-300"
                  >
                    <CalculatorIcon className="w-5 h-5 text-green-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{bid.project_name}</p>
                      <p className="text-xs text-slate-500">
                        ${bid.grand_total.toLocaleString()} • {bid.status}
                      </p>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div className="border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-300"
            >
              Press ? for shortcuts
            </button>
          </div>
        </Command.Dialog>
      </div>
    </>
  );
}
