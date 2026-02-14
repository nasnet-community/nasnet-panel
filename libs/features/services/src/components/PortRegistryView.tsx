/**
 * PortRegistryView Component
 *
 * Platform-agnostic port registry display with automatic presenter selection.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * Auto-detects platform and renders appropriate presenter:
 * - Mobile (<640px): Card-based grouped view with 44px touch targets
 * - Tablet/Desktop (≥640px): DataTable with sortable columns and filters
 *
 * @see NAS-8.16: Port Conflict Detection
 * @see ADR-018: Headless + Platform Presenters Pattern
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 *
 * @example
 * ```tsx
 * <PortRegistryView routerId="router-123" />
 * ```
 */

import * as React from 'react';
import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { PortRegistryViewDesktop } from './PortRegistryViewDesktop';
import { PortRegistryViewMobile } from './PortRegistryViewMobile';

/**
 * PortRegistryView props
 */
export interface PortRegistryViewProps {
  /** Router ID to display port allocations for */
  routerId: string;

  /** Optional className for custom styling */
  className?: string;
}

/**
 * PortRegistryView component
 *
 * Automatically selects the appropriate presenter based on viewport:
 * - Mobile: Card-based layout with collapsible groups
 * - Desktop: Dense DataTable with sorting and filtering
 *
 * Uses platform detection from PlatformProvider context.
 */
function PortRegistryViewComponent({ routerId, className }: PortRegistryViewProps) {
  const platform = usePlatform();

  // Select presenter based on platform
  switch (platform) {
    case 'mobile':
      return <PortRegistryViewMobile routerId={routerId} className={className} />;
    case 'tablet':
    case 'desktop':
    default:
      return <PortRegistryViewDesktop routerId={routerId} className={className} />;
  }
}

// Wrap with memo for performance optimization
export const PortRegistryView = memo(PortRegistryViewComponent);

// Set display name for React DevTools
PortRegistryView.displayName = 'PortRegistryView';
