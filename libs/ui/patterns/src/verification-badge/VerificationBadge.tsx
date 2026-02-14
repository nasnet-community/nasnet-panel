/**
 * Verification Badge Component
 *
 * Main component that auto-detects platform and renders the appropriate presenter.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/verification-badge
 */

import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

import type { VerificationBadgeProps } from './verification-badge.types';
import { useVerificationBadge } from './use-verification-badge';
import { VerificationBadgeDesktop } from './VerificationBadge.Desktop';
import { VerificationBadgeMobile } from './VerificationBadge.Mobile';

/**
 * Verification Badge Component
 *
 * Displays binary verification status for service instances.
 * Auto-detects platform (mobile/desktop) and renders the appropriate presenter.
 *
 * Features:
 * - Four verification statuses: verified (green), failed (red), pending (amber), unknown (gray)
 * - Tooltip/sheet with hash, timestamp, and re-verification
 * - Re-verification action support
 * - Platform-responsive (mobile = sheet, desktop = tooltip)
 * - WCAG AAA accessible
 *
 * @example
 * ```tsx
 * // Basic usage
 * <VerificationBadge
 *   verification={instance.verification}
 *   instanceId={instance.id}
 * />
 *
 * // With callback
 * <VerificationBadge
 *   verification={instance.verification}
 *   instanceId={instance.id}
 *   onVerificationChange={(status) => console.log('New status:', status)}
 * />
 *
 * // Force mobile variant
 * <VerificationBadge
 *   verification={instance.verification}
 *   instanceId={instance.id}
 *   variant="mobile"
 * />
 * ```
 */
export function VerificationBadge({
  verification,
  instanceId,
  onVerificationChange,
  showTimestamp = true,
  showHash = false,
  size = 'md',
  variant = 'auto',
  showLabel = false,
  className,
  id,
}: VerificationBadgeProps) {
  // Compute state using the headless hook
  const state = useVerificationBadge({
    verification,
    instanceId,
    onVerificationChange,
    showTimestamp,
    showHash,
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
    return <VerificationBadgeMobile {...presenterProps} />;
  }

  if (variant === 'desktop') {
    return <VerificationBadgeDesktop {...presenterProps} />;
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
        <VerificationBadgeMobile {...presenterProps} className="" />
      </div>

      {/* Desktop: shown on larger screens (>=640px) */}
      <div className="hidden sm:block">
        <VerificationBadgeDesktop {...presenterProps} className="" />
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">{state.ariaLabel}</span>
    </div>
  );
}
