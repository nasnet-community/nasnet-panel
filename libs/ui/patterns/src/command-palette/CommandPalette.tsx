/**
 * CommandPalette Component
 * Auto-switching wrapper that selects the appropriate presenter based on platform
 *
 * Features:
 * - Desktop: Centered modal with keyboard shortcuts
 * - Mobile: Bottom sheet with touch-friendly targets
 * - Platform detection via usePlatform() hook
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { CommandPaletteDesktop } from './CommandPaletteDesktop';
import { CommandPaletteMobile } from './CommandPaletteMobile';

/**
 * Props for CommandPalette
 */
export interface CommandPaletteProps {
  /** Optional className passed to the presenter */
  className?: string;
}

/**
 * CommandPalette component
 * Automatically switches between desktop and mobile presenters
 *
 * @example
 * ```tsx
 * // In your app shell or root layout
 * function App() {
 *   return (
 *     <>
 *       <RouterOutlet />
 *       <CommandPalette />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Triggering the command palette
 * import { useUIStore } from '@nasnet/state/stores';
 *
 * function SearchButton() {
 *   const { openCommandPalette } = useUIStore();
 *   return <Button onClick={openCommandPalette}>Search</Button>;
 * }
 * ```
 */
export function CommandPalette({ className }: CommandPaletteProps) {
  const platform = usePlatform();

  if (platform === 'mobile') {
    return <CommandPaletteMobile className={className} />;
  }

  return <CommandPaletteDesktop className={className} />;
}
