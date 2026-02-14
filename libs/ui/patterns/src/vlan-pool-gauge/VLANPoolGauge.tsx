/**
 * VLANPoolGauge Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Displays VLAN pool utilization with color-coded visual feedback.
 *
 * @example
 * ```tsx
 * <VLANPoolGauge
 *   total={1000}
 *   allocated={750}
 *   shouldWarn={false}
 * />
 * ```
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { VLANPoolGaugeDesktop } from './VLANPoolGauge.Desktop';
import { VLANPoolGaugeMobile } from './VLANPoolGauge.Mobile';

export interface VLANPoolGaugeProps {
  /** Total number of VLANs in pool */
  total: number;
  /** Number of allocated VLANs */
  allocated: number;
  /** Whether to show warning indicator (>80% utilization) */
  shouldWarn: boolean;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * VLANPoolGauge - Circular progress indicator for VLAN pool utilization
 *
 * Color coding:
 * - Green: <70% utilization
 * - Amber: 70-90% utilization
 * - Red: >90% utilization
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Larger gauge with simplified layout
 * - Tablet/Desktop (>=640px): Compact gauge with detailed stats
 */
function VLANPoolGaugeComponent(props: VLANPoolGaugeProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <VLANPoolGaugeMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <VLANPoolGaugeDesktop {...props} />;
  }
}

// Wrap with memo for performance optimization
export const VLANPoolGauge = memo(VLANPoolGaugeComponent);

// Set display name for React DevTools
VLANPoolGauge.displayName = 'VLANPoolGauge';
