/**
 * SearchFAB Component
 * Floating Action Button for mobile command palette access
 *
 * Features:
 * - Fixed position at bottom of screen
 * - 44x44px touch target (WCAG AAA)
 * - Opens command palette on tap
 * - Only visible on mobile platforms
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 */

import * as React from 'react';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

import { useUIStore } from '@nasnet/state/stores';
import { usePlatform } from '@nasnet/ui/layouts';
import { cn } from '@nasnet/ui/primitives';

/**
 * Props for SearchFAB
 */
export interface SearchFABProps {
  /** Position from bottom (default: 80px to avoid bottom nav) */
  bottom?: number;
  /** Position from right (default: 16px) */
  right?: number;
  /** Optional className */
  className?: string;
}

/**
 * Search Floating Action Button for mobile
 * Opens the command palette when tapped
 *
 * @example
 * ```tsx
 * // In your mobile layout
 * function MobileLayout({ children }) {
 *   return (
 *     <div>
 *       {children}
 *       <BottomNavigation />
 *       <SearchFAB />
 *       <CommandPalette />
 *     </div>
 *   );
 * }
 * ```
 */
export function SearchFAB({
  bottom = 80,
  right = 16,
  className,
}: SearchFABProps) {
  const platform = usePlatform();
  const { openCommandPalette } = useUIStore();

  // Only show on mobile
  if (platform !== 'mobile') {
    return null;
  }

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={openCommandPalette}
      style={{ bottom, right }}
      className={cn(
        'fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'active:bg-primary/90',
        className
      )}
      aria-label="Search commands"
    >
      <Search className="h-6 w-6" aria-hidden="true" />
    </motion.button>
  );
}
