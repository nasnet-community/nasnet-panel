/**
 * Device Card Compact Presenter
 *
 * Minimal variant for sidebar/widget usage.
 * Shows icon, name, and status dot only.
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */

import * as React from 'react';
import { useCallback } from 'react';

import { Card, cn } from '@nasnet/ui/primitives';

import { statusDotVariants } from './device-card-base';

import type { DeviceCardPresenterProps } from './device-card.types';

/**
 * Device Card Compact Presenter
 *
 * Compact-specific features:
 * - Single row: Icon + Name + Status dot
 * - No actions visible
 * - Click expands to full card or triggers onClick
 * - Suitable for sidebar and widget contexts
 *
 * @example
 * ```tsx
 * <DeviceCardCompact
 *   state={hookState}
 *   device={device}
 *   onClick={() => setSelectedDevice(device)}
 * />
 * ```
 */
export function DeviceCardCompact({
  state,
  device,
  className,
  id,
  isSelected = false,
  onClick,
}: DeviceCardPresenterProps) {
  const { displayName, deviceIcon: Icon, statusColor, ariaLabel } = state;

  // Handle click
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    },
    [onClick]
  );

  return (
    <Card
      id={id}
      className={cn(
        'p-component-sm group relative transition-all duration-200',
        'bg-card border-border rounded-[var(--semantic-radius-card)] border',
        onClick && 'hover:bg-muted/50 cursor-pointer',
        isSelected && 'bg-primary/10 border-primary/30',
        'focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className
      )}
      role="article"
      aria-label={ariaLabel}
      tabIndex={onClick ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      <div className="flex items-center gap-2">
        {/* Device icon */}
        <div className="bg-muted border-border flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
          <Icon
            className="text-foreground h-4 w-4"
            aria-hidden="true"
          />
        </div>

        {/* Name */}
        <span className="text-foreground flex-1 truncate text-sm font-medium">{displayName}</span>

        {/* Status dot */}
        <div
          className={cn(statusDotVariants({ status: statusColor }))}
          role="status"
          aria-label={state.isOnline ? 'Online' : 'Offline'}
        />
      </div>
    </Card>
  );
}
