/**
 * CommandPaletteMobile Component
 * Mobile and Tablet presenter for the command palette (bottom sheet)
 *
 * Features:
 * - Bottom sheet presentation (Mobile & Tablet)
 * - Keyboard navigation support (Tablet with keyboard)
 * - 44x44px touch targets (WCAG AAA Mobile)
 * - Swipe to dismiss support
 * - Framer Motion animations
 * - Touch-friendly interface scaling
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
/**
 * Props for CommandPaletteMobile
 */
export interface CommandPaletteMobileProps {
    /** Optional className */
    className?: string;
}
/**
 * Mobile and Tablet command palette presenter
 * Renders as a bottom sheet with touch-friendly targets and keyboard support
 *
 * @example
 * ```tsx
 * <CommandPaletteMobile />
 * ```
 */
declare const CommandPaletteMobile: React.NamedExoticComponent<CommandPaletteMobileProps>;
export { CommandPaletteMobile };
//# sourceMappingURL=CommandPaletteMobile.d.ts.map