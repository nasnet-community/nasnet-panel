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
import { type Command } from '@nasnet/state/stores';
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
export declare function useCommandPalette(): UseCommandPaletteReturn;
//# sourceMappingURL=useCommandPalette.d.ts.map