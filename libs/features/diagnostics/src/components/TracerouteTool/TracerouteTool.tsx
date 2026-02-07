/**
 * TracerouteTool - Main Component with Platform Detection
 *
 * Auto-detecting wrapper that selects appropriate presenter based on platform.
 * Uses Headless + Platform Presenters pattern (ADR-018).
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { TracerouteToolDesktop } from './TracerouteToolDesktop';
import { TracerouteToolMobile } from './TracerouteToolMobile';
import type { TracerouteToolProps } from './TracerouteTool.types';

/**
 * TracerouteTool - Platform-adaptive traceroute diagnostic tool
 *
 * Automatically selects desktop or mobile presenter based on screen size.
 * - Mobile (<640px): Stacked layout with bottom sheet results
 * - Tablet/Desktop (>=640px): Side-by-side layout with real-time hop visualization
 *
 * Features:
 * - Real-time hop discovery via WebSocket subscription
 * - Progressive network path visualization
 * - Latency color-coding (green <50ms, yellow 50-150ms, red >150ms)
 * - Export results to JSON/text
 * - Keyboard shortcuts (Enter to run, Esc to cancel)
 * - WCAG AAA accessible
 *
 * @example
 * ```tsx
 * <TracerouteTool
 *   routerId="router-123"
 *   onComplete={(result) => console.log('Traceroute complete!', result)}
 *   onError={(err) => console.error('Error:', err)}
 *   onHopDiscovered={(hop) => console.log('Hop discovered:', hop)}
 * />
 * ```
 */
export const TracerouteTool = memo(function TracerouteTool(props: TracerouteToolProps) {
  const platform = usePlatform();

  // Mobile uses mobile presenter
  if (platform === 'mobile') {
    return <TracerouteToolMobile {...props} />;
  }

  // Tablet and desktop use desktop presenter
  return <TracerouteToolDesktop {...props} />;
});

TracerouteTool.displayName = 'TracerouteTool';
