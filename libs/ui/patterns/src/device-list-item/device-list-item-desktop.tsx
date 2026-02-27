/**
 * DeviceListItem Desktop Presenter
 *
 * Desktop-specific rendering for DeviceListItem.
 * Optimized for dense information display with inline details.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/device-list-item
 * @see NAS-5.4: DHCP Leases and Active Connections Display
 */

import * as React from 'react';

import { cn, Badge } from '@nasnet/ui/primitives';

import { StatusBadge } from '../status-badge';

import type { DeviceListItemPresenterProps } from './device-list-item.types';

/**
 * Desktop presenter for DeviceListItem
 *
 * Features:
 * - Compact table row layout
 * - Inline details (no expansion needed)
 * - Hover row actions
 * - High information density
 *
 * @param props - Presenter props with computed state
 */
export function DeviceListItemDesktop({
  state,
  device,
  onClick,
  className,
  id,
}: DeviceListItemPresenterProps) {
  const handleClick = React.useCallback(() => {
    onClick?.();
  }, [onClick]);

  const DeviceIcon = state.deviceIcon;

  return (
    <div
      id={id}
      role="listitem"
      aria-label={state.ariaLabel}
      onClick={handleClick}
      className={cn(
        'grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4',
        'px-4 py-2.5',
        'border-border border-b last:border-b-0',
        onClick && 'hover:bg-accent/50 active:bg-accent cursor-pointer',
        'transition-colors',
        'focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset',
        className
      )}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Device icon */}
      <div
        className={cn(
          'flex-shrink-0',
          'flex items-center justify-center',
          'h-8 w-8 rounded-full',
          'bg-muted'
        )}
      >
        <DeviceIcon className="text-muted-foreground h-4 w-4" />
      </div>

      {/* Device name and info */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{state.displayName}</span>
          {state.isNew && (
            <Badge
              variant="info"
              className={cn(
                'px-1.5 py-0 text-xs',
                '@media (prefers-reduced-motion: no-preference)',
                'animate-pulse'
              )}
            >
              New
            </Badge>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-muted-foreground text-xs">{state.ipAddress}</span>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-muted-foreground font-mono text-xs">{state.macAddress}</span>
          {state.vendor && (
            <>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-muted-foreground text-xs">{state.vendor}</span>
            </>
          )}
        </div>
      </div>

      {/* Device type */}
      <div className="text-muted-foreground whitespace-nowrap text-xs">{state.deviceTypeLabel}</div>

      {/* Connection duration */}
      <div className="text-muted-foreground whitespace-nowrap text-xs">
        {state.connectionDuration}
      </div>

      {/* Status */}
      <StatusBadge status={device.status} />

      {/* Static lease indicator */}
      {state.isStatic && (
        <Badge
          variant="outline"
          className="whitespace-nowrap text-xs"
        >
          Static
        </Badge>
      )}
    </div>
  );
}
