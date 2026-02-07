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
 * - Mobile (<640px): Stacked layout with bottom sheet results
 * - Tablet/Desktop (>=640px): Side-by-side layout
 *
 * @example
 * ```tsx
 * <PingTool
 *   routerId="router-123"
 *   onComplete={() => console.log('Ping complete!')}
 *   onError={(err) => console.error(err)}
 * />
 * ```
 */
export const PingTool = memo(function PingTool(props: PingToolProps) {
  const platform = usePlatform();

  // Mobile uses mobile presenter
  if (platform === 'mobile') {
    return <PingToolMobile {...props} />;
  }

  // Tablet and desktop use desktop presenter
  return <PingToolDesktop {...props} />;
});

PingTool.displayName = 'PingTool';
