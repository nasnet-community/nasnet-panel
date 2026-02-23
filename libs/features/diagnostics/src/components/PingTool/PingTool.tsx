/**
 * PingTool - Main Component with Platform Detection
 *
 * Auto-detecting wrapper that selects appropriate presenter based on platform.
 * Uses Headless + Platform Presenters pattern (ADR-018).
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { PingToolDesktop } from './PingToolDesktop';
import { PingToolMobile } from './PingToolMobile';
import type { PingToolProps } from './PingTool.types';

/**
 * PingTool - Platform-adaptive ping diagnostic tool
 *
 * Automatically selects desktop or mobile presenter based on screen size.
 * Uses the usePing hook for all business logic (headless pattern).
 *
 * Platform behavior:
 * - Mobile (<640px): Stacked single-column layout with bottom sheet results (44px touch targets)
 * - Tablet/Desktop (>=640px): Side-by-side layout with dense data display
 *
 * Features:
 * - ICMP ping with configurable count, size, and timeout
 * - Real-time streaming results with virtualization (100+ results supported)
 * - Latency graph and statistics
 * - Color-coded results (green <100ms, amber <200ms, red >=200ms)
 * - Monospace font for IP addresses and latency values (WCAG AAA)
 * - Accessible error messages and ARIA live regions
 *
 * @param props - Component props
 * @returns Platform-appropriate presenter (Mobile or Desktop)
 *
 * @example
 * ```tsx
 * <PingTool
 *   routerId="router-123"
 *   onComplete={() => console.log('Ping complete!')}
 *   onError={(err) => console.error(err)}
 * />
 * ```
 *
 * @see usePing for business logic and state management
 * @see PingToolDesktop for desktop layout details
 * @see PingToolMobile for mobile layout details
 */
export const PingTool = memo(function PingTool(props: PingToolProps) {
  const platform = usePlatform();

  if (platform === 'mobile') {
    return <PingToolMobile {...props} />;
  }

  return <PingToolDesktop {...props} />;
});

PingTool.displayName = 'PingTool';
