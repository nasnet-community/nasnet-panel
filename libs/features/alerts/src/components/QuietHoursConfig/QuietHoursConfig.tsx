/**
 * QuietHoursConfig Pattern Component
 *
 * @description
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Single column, 44px touch targets, simplified layout
 * - Tablet/Desktop (≥640px): 2-column grid, dense layout, hover states
 *
 * @example
 * ```tsx
 * <QuietHoursConfig
 *   value={{ startTime: '22:00', endTime: '08:00', timezone: 'America/New_York', bypassCritical: true, daysOfWeek: [1, 2, 3, 4, 5] }}
 *   onChange={(config) => console.log(config)}
 * />
 * ```
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';

import { QuietHoursConfigDesktop } from './QuietHoursConfig.Desktop';
import { QuietHoursConfigMobile } from './QuietHoursConfig.Mobile';
import type { QuietHoursConfigProps } from './types';
function QuietHoursConfigComponent(props: QuietHoursConfigProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <QuietHoursConfigMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <QuietHoursConfigDesktop {...props} />;
  }
}

// Wrap with memo for performance optimization
export const QuietHoursConfig = memo(QuietHoursConfigComponent);

// Set display name for React DevTools
QuietHoursConfig.displayName = 'QuietHoursConfig';
