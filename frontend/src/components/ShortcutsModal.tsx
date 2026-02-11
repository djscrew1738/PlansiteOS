import Modal from './ui/Modal';
import { getShortcutDisplay } from '../hooks/useKeyboard';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcutsByCategory = {
  Navigation: [
    { key: 'mod+k', description: 'Open command palette' },
    { key: '/', description: 'Focus search' },
  ],
  Actions: [
    { key: 'mod+n', description: 'New estimate' },
    { key: 'mod+u', description: 'Upload blueprint' },
    { key: 'mod+l', description: 'Add new lead' },
    { key: 'mod+e', description: 'Send email (when selected)' },
    { key: 'mod+d', description: 'Delete selected' },
    { key: 'mod+c', description: 'Clone estimate' },
  ],
  Table: [
    { key: '↑ ↓', description: 'Navigate items' },
    { key: 'Enter', description: 'Open selected' },
    { key: 'Space', description: 'Select / deselect' },
  ],
  General: [
    { key: 'Escape', description: 'Close modal / cancel' },
    { key: '?', description: 'Show this help' },
  ],
};

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
          <div key={category}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
              {category}
            </h3>
            <div className="space-y-1.5">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/30 border border-slate-800/40"
                >
                  <span className="text-sm text-slate-300">{shortcut.description}</span>
                  <kbd className="inline-flex h-6 items-center rounded-md border border-slate-700 bg-slate-800 px-2 font-mono text-[10px] font-semibold text-slate-300">
                    {getShortcutDisplay(shortcut.key)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/60">
        <p className="text-xs text-slate-600 text-center">
          Most shortcuts work across all pages. Press{' '}
          <kbd className="mx-0.5 inline-flex h-5 items-center rounded border border-slate-700 bg-slate-800 px-1.5 font-mono text-[10px] font-semibold text-slate-400">
            {getShortcutDisplay('mod+k')}
          </kbd>{' '}
          to search anywhere.
        </p>
      </div>
    </Modal>
  );
}
