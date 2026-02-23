/**
 * PortRegistryView Component
 *
 * Platform-agnostic port registry display with automatic presenter selection.
 * Implements the Headless + Platform Presenters pattern (ADR-018).
 *
 * @description Auto-detects platform via usePlatform() hook and renders appropriate presenter.
 * Memoized for performance. All business logic delegated to presenter components.
 * Supports optional className prop for custom styling.
 *
 * Platform Detection:
 * - Mobile (<640px): Card-based grouped view with 44px touch targets (PortRegistryViewMobile)
 * - Tablet (640-1024px): Dense DataTable with sorting (PortRegistryViewDesktop)
 * - Desktop (>1024px): Dense DataTable with advanced features (PortRegistryViewDesktop)
 *
 * @see NAS-8.16: Port Conflict Detection
 * @see ADR-018: Headless + Platform Presenters Pattern
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 *
 * @example
 * ```tsx
 * // Auto-detection (recommended)
 * <PortRegistryView routerId="router-123" />
 *
 * // Manual presenter override (rare)
 * <PortRegistryView routerId="router-123" presenter="desktop" />
 * ```
 */

import React, { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { PortRegistryViewDesktop } from './PortRegistryViewDesktop';
import { PortRegistryViewMobile } from './PortRegistryViewMobile';

/**
 * PortRegistryView props
 */
export interface PortRegistryViewProps {
  /** Router ID to display port allocations for (required) */
  routerId: string;

  /** Optional CSS className for custom styling (applied to root div) */
  className?: string;

  /** Optional manual presenter override (rarely needed; auto-detection is default) */
  presenter?: 'mobile' | 'tablet' | 'desktop';
}

/**
 * PortRegistryView component
 *
 * Automatically selects the appropriate presenter based on platform detection.
 * Memoized to prevent unnecessary re-renders.
 *
 * @param routerId Router ID to display allocations for
 * @param className Optional CSS className for custom styling
 * @param presenter Optional manual presenter override (defaults to auto-detection)
 */
function PortRegistryViewComponent({
  routerId,
  className,
  presenter,
}: PortRegistryViewProps) {
  const detectedPlatform = usePlatform();
  const platform = presenter || detectedPlatform;

  // Select presenter based on platform
  // Mobile uses card-based layout; tablet/desktop use DataTable
  switch (platform) {
    case 'mobile':
      return <PortRegistryViewMobile routerId={routerId} className={className} />;
    case 'tablet':
    case 'desktop':
    default:
      return <PortRegistryViewDesktop routerId={routerId} className={className} />;
  }
}

/**
 * Exported component with memo optimization and displayName for debugging
 */
export const PortRegistryView = memo(PortRegistryViewComponent);

// Set display name for React DevTools debugging
PortRegistryView.displayName = 'PortRegistryView';
