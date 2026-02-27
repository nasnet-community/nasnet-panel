/**
 * useGlobalShortcuts Hook
 * Handles global keyboard shortcut detection and execution
 *
 * Features:
 * - Vim-style multi-key shortcuts (g h, g d, etc.)
 * - Modifier key combinations (Cmd+K, Ctrl+K)
 * - Auto-skip in editable elements
 * - Browser conflict prevention
 * - Disabled on mobile platforms
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 */

import { useEffect, useRef, useCallback } from 'react';

import { useShortcutRegistry, useUIStore } from '@nasnet/state/stores';
import { usePlatform } from '@nasnet/ui/layouts';

/**
 * Multi-key sequence timeout (vim-style shortcuts)
 */
const MULTI_KEY_TIMEOUT_MS = 500;

/**
 * Check if an element is editable (should skip shortcuts)
 */
function isEditableElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false;

  const tagName = element.tagName.toLowerCase();

  // Standard form elements
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  // Contenteditable elements
  if (element.isContentEditable) {
    return true;
  }

  // Check for contenteditable attribute
  if (element.getAttribute('contenteditable') === 'true') {
    return true;
  }

  return false;
}

/**
 * Detect if running on macOS
 */
function isMacOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

/**
 * Global shortcuts hook
 * Must be used at the app root level to catch all keyboard events
 *
 * @example
 * ```tsx
 * function App() {
 *   useGlobalShortcuts();
 *
 *   return (
 *     <>
 *       <RouterOutlet />
 *       <CommandPalette />
 *       <ShortcutsOverlay />
 *     </>
 *   );
 * }
 * ```
 */
export function useGlobalShortcuts() {
  const platform = usePlatform();
  const { toggleCommandPalette } = useUIStore();
  const { getByKeys, toggleOverlay, setPendingKey, shortcuts } = useShortcutRegistry();

  // Track pending key for multi-key sequences
  const pendingKeyRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip on mobile - no physical keyboard
      if (platform === 'mobile') return;

      // Skip in editable elements
      if (isEditableElement(event.target)) return;

      const key = event.key.toLowerCase();
      const isMac = isMacOS();
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      // --- Handle Cmd/Ctrl+K (open command palette) ---
      if (modKey && key === 'k') {
        event.preventDefault();
        toggleCommandPalette();
        // Clear any pending multi-key sequence
        pendingKeyRef.current = null;
        clearTimeout(timeoutRef.current);
        return;
      }

      // --- Handle ? (show shortcuts overlay) ---
      if (key === '?' || (event.shiftKey && key === '/')) {
        event.preventDefault();
        toggleOverlay();
        pendingKeyRef.current = null;
        clearTimeout(timeoutRef.current);
        return;
      }

      // --- Handle multi-key sequences (vim-style) ---
      if (pendingKeyRef.current) {
        // We have a pending key, try to match the combo
        const combo = `${pendingKeyRef.current} ${key}`;
        const shortcut = getByKeys(combo);

        // Clear pending state
        pendingKeyRef.current = null;
        clearTimeout(timeoutRef.current);

        if (shortcut) {
          event.preventDefault();
          shortcut.onExecute();
        }
        return;
      }

      // --- Start a multi-key sequence ---
      // Check if this key could be the start of a multi-key shortcut
      const potentialShortcuts = Array.from(shortcuts.values()).filter((s) =>
        s.keys.toLowerCase().startsWith(key + ' ')
      );

      if (potentialShortcuts.length > 0) {
        // This could be the start of a multi-key sequence
        pendingKeyRef.current = key;
        timeoutRef.current = setTimeout(() => {
          pendingKeyRef.current = null;
        }, MULTI_KEY_TIMEOUT_MS);
        return;
      }

      // --- Handle single-key shortcuts ---
      const shortcut = getByKeys(key);
      if (shortcut) {
        event.preventDefault();
        shortcut.onExecute();
      }
    },
    [platform, toggleCommandPalette, toggleOverlay, getByKeys, shortcuts]
  );

  // Set up event listener
  useEffect(() => {
    // Skip on mobile
    if (platform === 'mobile') return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutRef.current);
    };
  }, [platform, handleKeyDown]);

  // Sync pending key state with store (for visual feedback)
  useEffect(() => {
    if (pendingKeyRef.current) {
      setPendingKey(pendingKeyRef.current);
    }
  }, [setPendingKey]);
}
