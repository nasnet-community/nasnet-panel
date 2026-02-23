/**
 * CommandPalette Component
 * Auto-switching wrapper that selects the appropriate presenter based on platform
 *
 * Features:
 * - Desktop: Centered modal with keyboard shortcuts
 * - Tablet: Bottom sheet with keyboard support and touch targets
 * - Mobile: Bottom sheet with touch-friendly targets (44x44px)
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
 * Wrapper component for platform-specific command palette presenters
 */
export interface CommandPaletteProps {
  /**
   * Optional className passed to the presenter
   * Used for custom layout/spacing adjustments
   */
  className?: string;

  /**
   * Manual presenter override
   * If specified, this presenter is used instead of auto-detection
   * Useful for forcing mobile on large screens or vice versa
   * @default undefined (auto-detect via usePlatform)
   */
  presenter?: 'mobile' | 'tablet' | 'desktop';
}

/**
 * CommandPalette component
 * Automatically switches between platform-specific presenters
 *
 * - Mobile (<640px): Bottom sheet, 44px touch targets, no shortcuts
 * - Tablet (640-1024px): Bottom sheet with keyboard support
 * - Desktop (>1024px): Centered modal with keyboard shortcuts visible
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
const CommandPalette = React.memo(function CommandPalette({
  className,
}: CommandPaletteProps) {
  const platform = usePlatform();

  // Mobile and Tablet use bottom sheet; Desktop uses centered modal
  if (platform === 'mobile' || platform === 'tablet') {
    return <CommandPaletteMobile className={className} />;
  }

  return <CommandPaletteDesktop className={className} />;
});

CommandPalette.displayName = 'CommandPalette';

export { CommandPalette };
