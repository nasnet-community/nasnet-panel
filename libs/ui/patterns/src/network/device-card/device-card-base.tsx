/**
 * Device Card Base Component
 *
 * Shared visual component used by all platform presenters.
 * Handles the core rendering of device information with design tokens.
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */

import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { Card, cn } from '@nasnet/ui/primitives';

import { ConfidenceIndicator } from '../../confidence-indicator';

import type { DeviceCardBaseProps } from './device-card.types';

/**
 * Status dot variants using semantic design tokens
 */
const statusDotVariants = cva(
  'h-2.5 w-2.5 rounded-full shrink-0',
  {
    variants: {
      status: {
        success: 'bg-success',
        muted: 'bg-muted-foreground',
        warning: 'bg-warning',
      },
    },
    defaultVariants: {
      status: 'muted',
    },
  }
);

/**
 * Status badge variants using semantic design tokens
 */
const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
  {
    variants: {
      status: {
        success: 'bg-success/10 text-success ring-success/20',
        muted: 'bg-muted/50 text-muted-foreground ring-muted-foreground/20',
        warning: 'bg-warning/10 text-warning ring-warning/20',
      },
    },
    defaultVariants: {
      status: 'muted',
    },
  }
);

/**
 * Connection badge variants using network design tokens
 */
const connectionBadgeVariants = cva(
  'inline-flex items-center gap-1 text-xs',
  {
    variants: {
      type: {
        wired: 'text-primary',
        wireless: 'text-primary',
      },
    },
    defaultVariants: {
      type: 'wired',
    },
  }
);

/**
 * Card variant styles
 */
const cardVariants = cva(
  'group relative transition-all duration-200',
  {
    variants: {
      interactive: {
        true: 'cursor-pointer hover:shadow-md hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        false: '',
      },
      selected: {
        true: 'border-primary shadow-md ring-2 ring-primary/20',
        false: '',
      },
      compact: {
        true: 'p-2',
        false: 'p-4',
      },
    },
    defaultVariants: {
      interactive: false,
      selected: false,
      compact: false,
    },
  }
);

export interface DeviceCardBaseWithStatusProps extends DeviceCardBaseProps {
  /** Whether card is interactive (clickable) */
  interactive?: boolean;
  /** Whether card is selected */
  isSelected?: boolean;
}

/**
 * Device Card Base Component
 *
 * Renders the core device card UI with:
 * - Device icon and name
 * - IP address and vendor
 * - Online status indicator
 * - Connection type badge
 * - Confidence indicator (when applicable)
 *
 * @example
 * ```tsx
 * <DeviceCardBase
 *   icon={Monitor}
 *   name="Gaming PC"
 *   ip="192.168.1.100"
 *   vendor="Dell Inc."
 *   mac="AA:BB:CC:DD:EE:FF"
 *   isOnline={true}
 *   statusColor="success"
 *   connectionIcon={Cable}
 *   connectionText="Wired"
 *   ariaLabel="Device Gaming PC, online, wired"
 * />
 * ```
 */
export function DeviceCardBase({
  icon: Icon,
  name,
  ip,
  vendor,
  mac,
  isOnline,
  statusColor,
  connectionIcon: ConnectionIcon,
  connectionText,
  showConfidenceIndicator = false,
  confidence,
  compact = false,
  ariaLabel,
  className,
  onClick,
  children,
  interactive = false,
  isSelected = false,
}: DeviceCardBaseWithStatusProps) {
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  // Compact mode renders minimal information
  if (compact) {
    return (
      <Card
        className={cn(
          'group relative transition-all duration-200',
          'bg-card border border-border rounded-[var(--semantic-radius-card)]',
          !!onClick && 'cursor-pointer hover:bg-muted/50',
          isSelected && 'bg-primary/10 border-primary/30',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'p-component-sm',
          className
        )}
        role="article"
        aria-label={ariaLabel}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={onClick ? handleKeyDown : undefined}
      >
        <div className="flex items-center gap-2">
          {/* Device icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted border border-border">
            <Icon className="h-4 w-4 text-foreground" aria-hidden="true" />
          </div>

          {/* Name */}
          <span className="flex-1 truncate text-sm font-medium">{name}</span>

          {/* Status dot */}
          <div
            className={cn(statusDotVariants({ status: statusColor }))}
            aria-hidden="true"
          />
        </div>
      </Card>
    );
  }

  // Full mode renders all information
  return (
    <Card
      className={cn(
        'group relative transition-all duration-200',
        'bg-card border border-border rounded-[var(--semantic-radius-card)]',
        'shadow-[var(--semantic-shadow-card)]',
        !!onClick && 'cursor-pointer hover:shadow-lg transition-shadow duration-200',
        isSelected && 'border-primary ring-2 ring-primary/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'p-component-md',
        className
      )}
      role="article"
      aria-label={ariaLabel}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      <div className="flex items-start gap-4">
        {/* Device icon container */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted border border-border">
          <Icon className="h-5 w-5 text-foreground" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row: Name + Status */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {name}
            </h3>
            <span
              className={cn(statusBadgeVariants({ status: statusColor }))}
              role="status"
              aria-live="polite"
            >
              <span
                className={cn(statusDotVariants({ status: statusColor }))}
                aria-hidden="true"
              />
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Secondary info row: Vendor + IP */}
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {vendor && <span className="truncate">{vendor}</span>}
            {vendor && ip && <span aria-hidden="true">•</span>}
            {ip && <span className="font-mono">{ip}</span>}
          </div>

          {/* Tertiary row: MAC + Connection + Confidence */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* MAC address */}
            <span className="font-mono text-xs text-muted-foreground">
              {mac}
            </span>

            {/* Connection type */}
            <span
              className={cn(
                connectionBadgeVariants({
                  type: connectionText.toLowerCase() as 'wired' | 'wireless',
                })
              )}
            >
              <ConnectionIcon className="h-3 w-3" aria-hidden="true" />
              {connectionText}
            </span>

            {/* Confidence indicator */}
            {showConfidenceIndicator && confidence !== undefined && (
              <ConfidenceIndicator
                confidence={confidence}
                method="Auto-detected via MAC vendor lookup"
                size="sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* Additional content (actions, etc.) */}
      {children}
    </Card>
  );
}

/**
 * Export variants for use in tests
 */
export {
  statusDotVariants,
  statusBadgeVariants,
  connectionBadgeVariants,
  cardVariants,
};
