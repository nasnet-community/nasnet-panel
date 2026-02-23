/**
 * ShortcutsOverlay Component
 * Modal overlay displaying all available keyboard shortcuts
 *
 * Features:
 * - Grouped by category
 * - Platform-specific key formatting (⌘ vs Ctrl)
 * - Context-aware shortcuts highlighted
 * - Framer Motion animations
 * - Desktop only (no keyboard on mobile)
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 */
import * as React from 'react';
/**
 * Props for ShortcutsOverlay
 */
export interface ShortcutsOverlayProps {
    /** Optional className */
    className?: string;
}
/**
 * ShortcutsOverlay component
 * Shows all registered keyboard shortcuts in a modal
 *
 * @example
 * ```tsx
 * // In your app shell
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
declare const ShortcutsOverlay: React.NamedExoticComponent<ShortcutsOverlayProps>;
export { ShortcutsOverlay };
//# sourceMappingURL=ShortcutsOverlay.d.ts.map