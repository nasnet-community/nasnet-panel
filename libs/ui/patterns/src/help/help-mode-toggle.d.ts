/**
 * HelpModeToggle Component
 * Toggle switch for Simple/Technical help mode
 *
 * Features:
 * - Persists preference to localStorage via Zustand store
 * - Clear labeling for both modes
 * - Accessible keyboard navigation
 * - Compact design for settings UI
 *
 * @see NAS-4A.12: Build Help System Components
 */
import * as React from 'react';
/**
 * Props for HelpModeToggle
 */
export interface HelpModeToggleProps {
    /** Additional CSS classes */
    className?: string;
    /** Compact mode - hide labels, show only toggle */
    compact?: boolean;
    /** Custom label for simple mode */
    simpleLabel?: string;
    /** Custom label for technical mode */
    technicalLabel?: string;
}
/**
 * HelpModeToggle - Toggle between Simple and Technical help modes
 *
 * When toggled, changes the terminology used in all help content throughout
 * the application. The preference is automatically persisted to localStorage.
 *
 * @example
 * ```tsx
 * // Basic usage in settings
 * <HelpModeToggle />
 *
 * // Compact mode for inline use
 * <HelpModeToggle compact />
 *
 * // Custom labels
 * <HelpModeToggle
 *   simpleLabel="Beginner"
 *   technicalLabel="Expert"
 * />
 * ```
 */
export declare const HelpModeToggle: React.NamedExoticComponent<HelpModeToggleProps>;
//# sourceMappingURL=help-mode-toggle.d.ts.map