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
export declare function useGlobalShortcuts(): void;
//# sourceMappingURL=useGlobalShortcuts.d.ts.map