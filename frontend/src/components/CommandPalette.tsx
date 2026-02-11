import { useState, useEffect, useCallback } from 'react';
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

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data: bidsData } = useBids(1, 100);
  const { data: blueprintsData } = useBlueprints(1, 100);

  const handleSelect = useCallback(
    (callback: () => void) => {
      callback();
      onClose();
      setSearch('');
    },
    [onClose],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (open && (e.metaKey || e.ctrlKey)) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            handleSelect(() => navigate('/estimates'));
            break;
          case 'u':
            e.preventDefault();
            handleSelect(() => navigate('/blueprints'));
            break;
          case 'l':
            e.preventDefault();
            handleSelect(() => navigate('/leads'));
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, handleSelect, navigate]);

  if (!open) return null;

  const blueprints = blueprintsData?.blueprints || [];
  const bids = bidsData?.bids || [];

  const filteredBlueprints = search
    ? blueprints
        .filter(
          (bp) =>
            bp.project_name?.toLowerCase().includes(search.toLowerCase()) ||
            bp.file_name.toLowerCase().includes(search.toLowerCase()),
        )
        .slice(0, 5)
    : [];

  const filteredBids = search
    ? bids
        .filter(
          (bid) =>
            bid.project_name.toLowerCase().includes(search.toLowerCase()) ||
            bid.customer_name?.toLowerCase().includes(search.toLowerCase()),
        )
        .slice(0, 5)
    : [];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-start justify-center pt-[18vh] px-4">
        <Command.Dialog
          open={open}
          onOpenChange={(open) => !open && onClose()}
          className="w-full max-w-2xl rounded-2xl border border-slate-800/60 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden animate-scaleIn"
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-slate-800/60 px-5">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-500 mr-3" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search blueprints, estimates, or type a command..."
              className="w-full bg-transparent border-none outline-none py-4 text-sm text-slate-100 placeholder-slate-500"
            />
          </div>

          {/* Results */}
          <Command.List className="max-h-[360px] overflow-y-auto p-2">
            <Command.Empty className="py-10 text-center text-sm text-slate-500">
              No results found.
            </Command.Empty>

            {/* Quick Actions */}
            {!search && (
              <Command.Group
                heading="Quick Actions"
                className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 px-2 py-2"
              >
                {[
                  {
                    label: 'New Estimate',
                    desc: 'Create a new project estimate',
                    icon: PlusIcon,
                    color: 'bg-blue-500/10 text-blue-400',
                    shortcut: 'N',
                    path: '/estimates',
                  },
                  {
                    label: 'Upload Blueprint',
                    desc: 'Upload and analyze blueprints',
                    icon: CloudArrowUpIcon,
                    color: 'bg-emerald-500/10 text-emerald-400',
                    shortcut: 'U',
                    path: '/blueprints',
                  },
                  {
                    label: 'Add Lead',
                    desc: 'Create a new lead',
                    icon: UserGroupIcon,
                    color: 'bg-purple-500/10 text-purple-400',
                    shortcut: 'L',
                    path: '/leads',
                  },
                  {
                    label: 'View Reports',
                    desc: 'Analytics and insights',
                    icon: ChartBarIcon,
                    color: 'bg-amber-500/10 text-amber-400',
                    shortcut: '',
                    path: '/reports',
                  },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Command.Item
                      key={action.label}
                      onSelect={() => handleSelect(() => navigate(action.path))}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-colors hover:bg-slate-800/60 text-slate-300 data-[selected]:bg-slate-800/60"
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{action.label}</p>
                        <p className="text-[11px] text-slate-500">{action.desc}</p>
                      </div>
                      {action.shortcut && (
                        <kbd className="inline-flex h-5 items-center rounded border border-slate-700 bg-slate-800 px-1.5 font-mono text-[10px] text-slate-500">
                          {action.shortcut}
                        </kbd>
                      )}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            {/* Blueprint Results */}
            {search && filteredBlueprints.length > 0 && (
              <Command.Group
                heading="Blueprints"
                className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 px-2 py-2"
              >
                {filteredBlueprints.map((bp) => (
                  <Command.Item
                    key={bp.id}
                    onSelect={() => handleSelect(() => navigate(`/blueprints/${bp.id}`))}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-colors hover:bg-slate-800/60 text-slate-300 data-[selected]:bg-slate-800/60"
                  >
                    <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {bp.project_name || bp.file_name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {bp.total_fixtures} fixtures &middot; {bp.status}
                      </p>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Estimate Results */}
            {search && filteredBids.length > 0 && (
              <Command.Group
                heading="Estimates"
                className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 px-2 py-2"
              >
                {filteredBids.map((bid) => (
                  <Command.Item
                    key={bid.id}
                    onSelect={() => handleSelect(() => navigate('/estimates'))}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-colors hover:bg-slate-800/60 text-slate-300 data-[selected]:bg-slate-800/60"
                  >
                    <CalculatorIcon className="h-5 w-5 text-emerald-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{bid.project_name}</p>
                      <p className="text-[11px] text-slate-500">
                        ${bid.grand_total.toLocaleString()} &middot; {bid.status}
                      </p>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div className="border-t border-slate-800/60 px-5 py-2.5 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="font-mono">↑↓</kbd> Navigate
              </span>
              <span>
                <kbd className="font-mono">↵</kbd> Select
              </span>
              <span>
                <kbd className="font-mono">Esc</kbd> Close
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-400 transition-colors"
            >
              Press ? for shortcuts
            </button>
          </div>
        </Command.Dialog>
      </div>
    </>
  );
}
