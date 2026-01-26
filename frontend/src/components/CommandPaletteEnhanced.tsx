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
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useBids, useBlueprints } from '../hooks/useApi';
import type { Blueprint, Bid } from '../types/api';

interface CommandPaletteEnhancedProps {
  open: boolean;
  onClose: () => void;
}

interface AICommand {
  id: string;
  trigger: string;
  description: string;
  action: (navigate: any, data?: any) => void | Promise<void>;
  icon: any;
  category: 'ai' | 'quick' | 'search';
}

export default function CommandPaletteEnhanced({ open, onClose }: CommandPaletteEnhancedProps) {
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const { data: bidsData } = useBids(1, 100);
  const { data: blueprintsData } = useBlueprints(1, 100);

  const handleSelect = useCallback((callback: () => void | Promise<void>) => {
    const result = callback();
    if (result instanceof Promise) {
      setIsProcessing(true);
      result.finally(() => {
        setIsProcessing(false);
        onClose();
        setSearch('');
      });
    } else {
      onClose();
      setSearch('');
    }
  }, [onClose]);

  // AI-powered natural language commands
  const aiCommands: AICommand[] = [
    {
      id: 'create-estimate-from-last',
      trigger: 'create estimate from last blueprint',
      description: 'Generate estimate from most recent blueprint',
      icon: SparklesIcon,
      category: 'ai',
      action: async (navigate) => {
        const blueprints = blueprintsData?.blueprints || [];
        if (blueprints.length === 0) return;

        const latest = blueprints[0];
        // TODO: Call API to generate bid from blueprint
        navigate(`/blueprints/${latest.id}`);
      },
    },
    {
      id: 'show-unfinished',
      trigger: 'show unfinished top-outs',
      description: 'Display incomplete plumbing top-outs',
      icon: ClockIcon,
      category: 'ai',
      action: (navigate) => {
        // TODO: Navigate to filtered view
        navigate('/blueprints?status=processing');
      },
    },
    {
      id: 'find-inspections',
      trigger: 'find inspections this week',
      description: 'Show upcoming inspections',
      icon: CheckCircleIcon,
      category: 'ai',
      action: (navigate) => {
        // TODO: Navigate to inspections view
        navigate('/dashboard?view=inspections');
      },
    },
    {
      id: 'explain-blueprint',
      trigger: 'explain this blueprint',
      description: 'AI analysis of current blueprint',
      icon: SparklesIcon,
      category: 'ai',
      action: () => {
        // TODO: Open AI analysis modal
        alert('AI Blueprint Analysis coming soon!');
      },
    },
    {
      id: 'estimate-analysis',
      trigger: 'why is this estimate higher',
      description: 'AI cost analysis and comparison',
      icon: SparklesIcon,
      category: 'ai',
      action: () => {
        // TODO: Open cost analysis
        alert('AI Cost Analysis coming soon!');
      },
    },
    {
      id: 'pending-estimates',
      trigger: 'show pending estimates',
      description: 'Display estimates awaiting approval',
      icon: ExclamationTriangleIcon,
      category: 'ai',
      action: (navigate) => {
        navigate('/estimates?status=pending');
      },
    },
  ];

  // Match natural language input to AI commands
  const matchedAICommands = search.toLowerCase().trim().length > 3
    ? aiCommands.filter(cmd =>
        cmd.trigger.includes(search.toLowerCase()) ||
        cmd.description.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Handle keyboard shortcuts
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

  // Filter results based on search
  const filteredBlueprints = search && !matchedAICommands.length
    ? blueprints.filter(bp =>
        bp.project_name?.toLowerCase().includes(search.toLowerCase()) ||
        bp.file_name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : [];

  const filteredBids = search && !matchedAICommands.length
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
            {isProcessing ? (
              <div className="w-5 h-5 mr-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 mr-3" />
            )}
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search or type a command like 'create estimate from last blueprint'..."
              className="w-full bg-transparent border-none outline-none py-4 text-slate-100 placeholder-slate-500"
            />
            {search && (
              <SparklesIcon className="w-5 h-5 text-purple-400 animate-pulse" />
            )}
          </div>

          {/* Results */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-slate-400">
              {search ? (
                <div className="space-y-2">
                  <p>No exact matches found.</p>
                  <p className="text-xs text-slate-500">
                    Try: "create estimate", "show unfinished", "find inspections"
                  </p>
                </div>
              ) : (
                'Start typing to search...'
              )}
            </Command.Empty>

            {/* AI Commands */}
            {matchedAICommands.length > 0 && (
              <Command.Group heading="AI Commands" className="text-xs text-purple-400 px-2 py-2 font-medium">
                {matchedAICommands.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <Command.Item
                      key={cmd.id}
                      onSelect={() => handleSelect(() => cmd.action(navigate))}
                      className="flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer hover:bg-slate-800 text-slate-300 border border-purple-500/20 mb-2"
                    >
                      <div className="p-2 rounded bg-purple-500/10">
                        <Icon className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium flex items-center gap-2">
                          {cmd.description}
                          <SparklesIcon className="w-3 h-3 text-purple-400" />
                        </p>
                        <p className="text-xs text-slate-500 italic">"{cmd.trigger}"</p>
                      </div>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            {/* Quick Actions */}
            {!search && (
              <>
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

                {/* AI Suggestions */}
                <Command.Group heading="Try AI Commands" className="text-xs text-purple-400 px-2 py-2 font-medium mt-2">
                  <div className="text-xs text-slate-400 px-3 py-2 space-y-1">
                    <p className="flex items-center gap-2">
                      <SparklesIcon className="w-3 h-3" />
                      "create estimate from last blueprint"
                    </p>
                    <p className="flex items-center gap-2">
                      <SparklesIcon className="w-3 h-3" />
                      "show unfinished top-outs"
                    </p>
                    <p className="flex items-center gap-2">
                      <SparklesIcon className="w-3 h-3" />
                      "find inspections this week"
                    </p>
                  </div>
                </Command.Group>
              </>
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
            <div className="flex items-center gap-2 text-purple-400">
              <SparklesIcon className="w-3 h-3" />
              <span>AI-powered</span>
            </div>
          </div>
        </Command.Dialog>
      </div>
    </>
  );
}
