/**
 * CounterCell Component
 * Main wrapper with headless logic and platform detection
 *
 * Follows Headless + Platform Presenters pattern (ADR-018)
 *
 * Auto-detects platform and renders appropriate presenter:
 * - Desktop: Horizontal layout with packets, bytes, rate, and progress bar
 * - Mobile: Vertical stacked layout with 44px touch targets (no rate)
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { CounterCellDesktop } from './CounterCellDesktop';
import { CounterCellMobile } from './CounterCellMobile';

/**
 * Props for CounterCell component
 */
export interface CounterCellProps {
  /** Number of packets processed by the rule */
  packets: number;
  /** Number of bytes processed by the rule */
  bytes: number;
  /** Maximum bytes value for relative bar (0-100) */
  percentOfMax: number;
  /** Whether this rule has zero traffic */
  isUnused: boolean;
  /** Whether to show rate calculation (requires polling enabled) */
  showRate?: boolean;
  /** Whether to show the relative progress bar */
  showBar?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * CounterCell Component
 *
 * Displays firewall rule counter statistics with platform-specific UI:
 * - Formatted packet count (e.g., "1,234,567")
 * - Formatted byte count (e.g., "1.2 MB")
 * - Optional rate display (packets/sec, bytes/sec)
 * - Optional relative progress bar
 * - Unused rule indicator
 *
 * @example
 * ```tsx
 * <CounterCell
 *   packets={1234567}
 *   bytes={9876543210}
 *   percentOfMax={85}
 *   isUnused={false}
 *   showRate={true}
 *   showBar={true}
 * />
 * ```
 */
export const CounterCell = memo(function CounterCell(props: CounterCellProps) {
  const platform = usePlatform();

  return platform === 'mobile' ?
      <CounterCellMobile {...props} />
    : <CounterCellDesktop {...props} />;
});

CounterCell.displayName = 'CounterCell';

// Re-export presenters for direct usage
export { CounterCellDesktop, CounterCellMobile };
