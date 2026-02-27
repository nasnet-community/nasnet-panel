/**
 * useCommandPalette Hook
 * Headless hook for command palette logic
 *
 * Features:
 * - Search with debouncing
 * - Keyboard navigation
 * - Command execution
 * - Usage tracking
 * - Offline status detection
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

import { useCommandRegistry, useUIStore, type Command } from '@nasnet/state/stores';

/**
 * Debounce delay for search input
 */
const SEARCH_DEBOUNCE_MS = 150;

/**
 * Maximum number of visible results
 */
const MAX_RESULTS = 15;

/**
 * Command palette hook return type
 */
export interface UseCommandPaletteReturn {
  /** Whether the palette is open */
  open: boolean;
  /** Set open state */
  setOpen: (open: boolean) => void;
  /** Toggle open state */
  toggle: () => void;
  /** Current search query */
  query: string;
  /** Set search query */
  setQuery: (query: string) => void;
  /** Filtered and ranked command results */
  results: Command[];
  /** Currently selected index */
  selectedIndex: number;
  /** Set selected index */
  setSelectedIndex: (index: number) => void;
  /** Whether there are results */
  hasResults: boolean;
  /** Whether showing recent items (empty query) */
  isShowingRecent: boolean;
  /** Whether the device is online */
  isOnline: boolean;
  /** Execute a command */
  execute: (command: Command) => void;
  /** Handle keyboard events */
  handleKeyDown: (event: React.KeyboardEvent) => void;
  /** Move selection up */
  moveUp: () => void;
  /** Move selection down */
  moveDown: () => void;
  /** Execute selected command */
  executeSelected: () => void;
  /** Close and reset the palette */
  close: () => void;
  /** Input ref for auto-focus */
  inputRef: React.RefObject<HTMLInputElement>;
}

/**
 * Headless hook for command palette logic
 *
 * @example
 * ```tsx
 * function CommandPaletteDesktop() {
 *   const {
 *     open, setOpen, query, setQuery,
 *     results, selectedIndex, handleKeyDown,
 *     execute, isShowingRecent
 *   } = useCommandPalette();
 *
 *   return (
 *     <Dialog open={open} onOpenChange={setOpen}>
 *       <Input
 *         value={query}
 *         onChange={(e) => setQuery(e.target.value)}
 *         onKeyDown={handleKeyDown}
 *       />
 *       {results.map((cmd, i) => (
 *         <CommandItem
 *           key={cmd.id}
 *           command={cmd}
 *           selected={i === selectedIndex}
 *           onSelect={() => execute(cmd)}
 *         />
 *       ))}
 *     </Dialog>
 *   );
 * }
 * ```
 */
export function useCommandPalette(): UseCommandPaletteReturn {
  // State from stores
  const { commandPaletteOpen, setCommandPaletteOpen, toggleCommandPalette } = useUIStore();
  const { search, trackUsage } = useCommandRegistry();

  // Local state
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  // Get search results
  const results = useMemo(() => {
    const searchResults = search(debouncedQuery);
    return searchResults.slice(0, MAX_RESULTS);
  }, [debouncedQuery, search]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Reset query when palette closes
  useEffect(() => {
    if (!commandPaletteOpen) {
      setQuery('');
      setDebouncedQuery('');
      setSelectedIndex(0);
    }
  }, [commandPaletteOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (!commandPaletteOpen || !inputRef.current) {
      return;
    }
    // Small delay to ensure dialog is rendered
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [commandPaletteOpen]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Execute a command
  const execute = useCallback(
    (command: Command) => {
      // Don't execute network-dependent commands when offline
      if (command.requiresNetwork && !isOnline) {
        return;
      }

      // Track usage for ranking
      trackUsage(command.id);

      // Execute the command
      command.onExecute();

      // Close the palette
      setCommandPaletteOpen(false);
    },
    [isOnline, trackUsage, setCommandPaletteOpen]
  );

  // Move selection up
  const moveUp = useCallback(() => {
    setSelectedIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Move selection down
  const moveDown = useCallback(() => {
    setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
  }, [results.length]);

  // Execute selected command
  const executeSelected = useCallback(() => {
    const command = results[selectedIndex];
    if (command) {
      execute(command);
    }
  }, [results, selectedIndex, execute]);

  // Close and reset
  const close = useCallback(() => {
    setCommandPaletteOpen(false);
  }, [setCommandPaletteOpen]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
          event.preventDefault();
          moveUp();
          break;
        case 'Enter':
          event.preventDefault();
          executeSelected();
          break;
        case 'Escape':
          event.preventDefault();
          close();
          break;
        case 'Tab':
          // Tab also moves through results
          event.preventDefault();
          if (event.shiftKey) {
            moveUp();
          } else {
            moveDown();
          }
          break;
      }
    },
    [moveDown, moveUp, executeSelected, close]
  );

  return {
    open: commandPaletteOpen,
    setOpen: setCommandPaletteOpen,
    toggle: toggleCommandPalette,
    query,
    setQuery,
    results,
    selectedIndex,
    setSelectedIndex,
    hasResults: results.length > 0,
    isShowingRecent: !query.trim(),
    isOnline,
    execute,
    handleKeyDown,
    moveUp,
    moveDown,
    executeSelected,
    close,
    inputRef,
  };
}
