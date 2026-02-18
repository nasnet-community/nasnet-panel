/**
 * NotificationCenter Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <NotificationCenter
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { NotificationCenterDesktop } from './NotificationCenterDesktop';
import { NotificationCenterMobile } from './NotificationCenterMobile';

import type { NotificationCenterProps } from './types';

/**
 * NotificationCenter - Display and manage alert notifications
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Full-screen Sheet with 44px touch targets and bottom action bar
 * - Tablet/Desktop (>=640px): 400px side panel with scrollable list
 *
 * Features:
 * - Severity filtering (Critical, Warning, Info, All)
 * - Mark as read / Mark all read
 * - Clear all notifications
 * - Keyboard navigation (Desktop: Escape, Arrow keys, Enter)
 * - Click notification to navigate and mark as read
 * - Empty state when no notifications
 */
function NotificationCenterComponent(props: NotificationCenterProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <NotificationCenterMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <NotificationCenterDesktop {...props} />;
  }
}

// Wrap with memo for performance optimization
export const NotificationCenter = memo(NotificationCenterComponent);

// Set display name for React DevTools
NotificationCenter.displayName = 'NotificationCenter';
