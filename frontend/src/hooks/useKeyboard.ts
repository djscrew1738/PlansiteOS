import { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

export type KeyboardShortcut = {
  key: string;
  description: string;
  action: () => void;
  category?: 'navigation' | 'actions' | 'general';
};

// Central registry of all keyboard shortcuts
export const shortcuts: Record<string, Omit<KeyboardShortcut, 'action'>> = {
  'mod+k': {
    key: 'mod+k',
    description: 'Open command palette',
    category: 'navigation',
  },
  'mod+n': {
    key: 'mod+n',
    description: 'New estimate',
    category: 'actions',
  },
  'mod+u': {
    key: 'mod+u',
    description: 'Upload blueprint',
    category: 'actions',
  },
  'mod+l': {
    key: 'mod+l',
    description: 'Add new lead',
    category: 'actions',
  },
  'mod+e': {
    key: 'mod+e',
    description: 'Send email (when selected)',
    category: 'actions',
  },
  'mod+d': {
    key: 'mod+d',
    description: 'Delete selected',
    category: 'actions',
  },
  '?': {
    key: '?',
    description: 'Show keyboard shortcuts',
    category: 'general',
  },
  escape: {
    key: 'escape',
    description: 'Close modal or cancel',
    category: 'general',
  },
};

/**
 * Hook for registering keyboard shortcuts
 * @param key - The key combination (e.g., 'mod+k', 'escape')
 * @param callback - Function to call when shortcut is pressed
 * @param deps - Dependencies array for the callback
 */
export function useKeyboard(
  key: string | string[],
  callback: (event: KeyboardEvent) => void,
  deps: any[] = []
) {
  useHotkeys(key, callback, deps);
}

/**
 * Hook for preventing default browser shortcuts
 */
export function usePreventDefaults() {
  useEffect(() => {
    const preventDefault = (e: KeyboardEvent) => {
      // Prevent default for our custom shortcuts
      if (
        (e.metaKey || e.ctrlKey) &&
        ['k', 'n', 'u', 'l', 'e', 'd'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', preventDefault);
    return () => window.removeEventListener('keydown', preventDefault);
  }, []);
}

/**
 * Get display name for keyboard shortcut
 * (converts 'mod' to '⌘' on Mac, 'Ctrl' on Windows/Linux)
 */
export function getShortcutDisplay(key: string): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  return key
    .replace(/mod/gi, modKey)
    .replace(/shift/gi, isMac ? '⇧' : 'Shift')
    .replace(/alt/gi, isMac ? '⌥' : 'Alt')
    .split('+')
    .map(k => k.charAt(0).toUpperCase() + k.slice(1))
    .join(isMac ? '' : '+');
}
