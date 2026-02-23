/**
 * Confidence Indicator Component
 *
 * Main component that auto-detects platform and renders the appropriate presenter.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */

import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

import { ConfidenceIndicatorDesktop } from './confidence-indicator-desktop';
import { ConfidenceIndicatorMobile } from './confidence-indicator-mobile';
import { useConfidenceIndicator } from './use-confidence-indicator';

import type { ConfidenceIndicatorProps } from './confidence-indicator.types';

/**
 * Confidence Indicator Component
 *
 * Displays a visual indicator for auto-detected values with confidence scoring.
 * Auto-detects platform (mobile/desktop) and renders the appropriate presenter.
 *
 * Features:
 * - Three confidence levels: high (green), medium (amber), low (red)
 * - Tooltip/sheet with detection details
 * - Override action support
 * - Platform-responsive (mobile = sheet, desktop = tooltip)
 * - WCAG AAA accessible
 * - Reduced motion support
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ConfidenceIndicator confidence={95} />
 *
 * // With detection method and override
 * <ConfidenceIndicator
 *   confidence={87}
 *   method="Auto-detected via DHCP response"
 *   onOverride={() => setIsEditing(true)}
 * />
 *
 * // Force mobile variant
 * <ConfidenceIndicator
 *   confidence={45}
 *   variant="mobile"
 * />
 *
 * // Desktop with inline label
 * <ConfidenceIndicator
 *   confidence={92}
 *   variant="desktop"
 *   showLabel
 * />
 * ```
 *
 * @see ADR-018: Platform Presenter Pattern
 * @see DESIGN_TOKENS.md: Confidence indicator color tokens
 */
const ConfidenceIndicator = React.memo(function ConfidenceIndicator({
  confidence,
  method,
  onOverride,
  showPercentage = true,
  size = 'md',
  variant = 'auto',
  showLabel = false,
  className,
  id,
}: ConfidenceIndicatorProps) {
  // Compute state using the headless hook
  const state = useConfidenceIndicator({
    confidence,
    method,
    onOverride,
    showPercentage,
  });

  // Props for presenters
  const presenterProps = {
    state,
    size,
    showLabel,
    className,
    id,
  };

  // Forced variant rendering
  if (variant === 'mobile') {
    return <ConfidenceIndicatorMobile {...presenterProps} />;
  }

  if (variant === 'desktop') {
    return <ConfidenceIndicatorDesktop {...presenterProps} />;
  }

  // Auto-detect: Use CSS media queries for SSR compatibility
  // This avoids hydration mismatches and works on first render
  return (
    <div
      className={cn('contents', className)}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Mobile: shown on small screens (<640px) */}
      <div className="sm:hidden">
        <ConfidenceIndicatorMobile {...presenterProps} className="" />
      </div>

      {/* Desktop: shown on larger screens (>=640px) */}
      <div className="hidden sm:block">
        <ConfidenceIndicatorDesktop {...presenterProps} className="" />
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">{state.ariaLabel}</span>
    </div>
  );
});

ConfidenceIndicator.displayName = 'ConfidenceIndicator';

export { ConfidenceIndicator };
