/**
 * InterfaceGrid Component
 *
 * Displays a responsive grid of interface status cards.
 * Uses Headless + Platform Presenters pattern (ADR-018).
 *
 * Features:
 * - Real-time interface status updates
 * - Responsive grid layout (4-col desktop, 3-col tablet, 2-col mobile)
 * - Show all / Show less toggle for >8 interfaces
 * - Loading, error, and empty states
 * - Interface detail sheet/dialog
 * - WCAG AAA accessible
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { InterfaceGridDesktop } from './InterfaceGrid.Desktop';
import { InterfaceGridTablet } from './InterfaceGrid.Tablet';
import { InterfaceGridMobile } from './InterfaceGrid.Mobile';
import type { InterfaceGridProps } from './types';

/**
 * Interface grid component with platform-specific layout.
 * Auto-detects platform and renders appropriate presenter.
 *
 * @example
 * <InterfaceGrid deviceId="router-123" />
 */
export const InterfaceGrid = memo(function InterfaceGrid(props: InterfaceGridProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <InterfaceGridMobile {...props} />;
    case 'tablet':
      return <InterfaceGridTablet {...props} />;
    default:
      return <InterfaceGridDesktop {...props} />;
  }
});

InterfaceGrid.displayName = 'InterfaceGrid';

export default InterfaceGrid;
