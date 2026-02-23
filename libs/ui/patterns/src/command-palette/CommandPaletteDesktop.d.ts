/**
 * CommandPaletteDesktop Component
 * Desktop presenter for the command palette (centered modal)
 *
 * Features:
 * - Centered dialog presentation
 * - Keyboard shortcut display
 * - Full keyboard navigation
 * - Framer Motion animations
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
/**
 * Props for CommandPaletteDesktop
 */
export interface CommandPaletteDesktopProps {
    /** Optional className for the dialog content */
    className?: string;
}
/**
 * Desktop command palette presenter
 * Renders as a centered modal with full keyboard support
 */
declare const CommandPaletteDesktop: React.NamedExoticComponent<CommandPaletteDesktopProps>;
export { CommandPaletteDesktop };
//# sourceMappingURL=CommandPaletteDesktop.d.ts.map