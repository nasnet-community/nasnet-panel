/**
 * Command Palette Components
 * Exports for the command palette pattern
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 */

// Main component (auto-switching)
export { CommandPalette } from './CommandPalette';
export type { CommandPaletteProps } from './CommandPalette';

// Platform-specific presenters
export { CommandPaletteDesktop } from './CommandPaletteDesktop';
export type { CommandPaletteDesktopProps } from './CommandPaletteDesktop';

export { CommandPaletteMobile } from './CommandPaletteMobile';
export type { CommandPaletteMobileProps } from './CommandPaletteMobile';

// Headless hook
export { useCommandPalette } from './useCommandPalette';
export type { UseCommandPaletteReturn } from './useCommandPalette';

// Sub-components
export { CommandItem } from './CommandItem';
export type { CommandItemProps } from './CommandItem';

// Mobile FAB for command palette access
export { SearchFAB } from './SearchFAB';
export type { SearchFABProps } from './SearchFAB';
