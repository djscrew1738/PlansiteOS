import Modal from './ui/Modal';
import { getShortcutDisplay, shortcuts } from '../hooks/useKeyboard';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcutsByCategory = {
  navigation: [
    { key: 'mod+k', description: 'Open command palette' },
    { key: '/', description: 'Focus search' },
  ],
  actions: [
    { key: 'mod+n', description: 'New estimate' },
    { key: 'mod+u', description: 'Upload blueprint' },
    { key: 'mod+l', description: 'Add new lead' },
    { key: 'mod+e', description: 'Send email (when selected)' },
    { key: 'mod+d', description: 'Delete selected' },
    { key: 'mod+c', description: 'Clone estimate' },
  ],
  table: [
    { key: '↑ ↓', description: 'Navigate items' },
    { key: 'Enter', description: 'Open selected' },
    { key: 'Space', description: 'Select/deselect' },
  ],
  general: [
    { key: 'Escape', description: 'Close modal/cancel' },
    { key: '?', description: 'Show this help' },
  ],
};

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
              {category}
            </h3>
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 rounded bg-slate-800/50"
                >
                  <span className="text-sm text-slate-300">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-slate-200 bg-slate-700 border border-slate-600 rounded">
                    {getShortcutDisplay(shortcut.key)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">
          Tip: Most shortcuts work across all pages. Try pressing{' '}
          <kbd className="px-1 py-0.5 text-xs font-semibold bg-slate-700 border border-slate-600 rounded">
            {getShortcutDisplay('mod+k')}
          </kbd>{' '}
          to search anywhere!
        </p>
      </div>
    </Modal>
  );
}
