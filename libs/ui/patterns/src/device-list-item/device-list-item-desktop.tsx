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
        'grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 items-center',
        'px-4 py-2.5',
        'border-b border-border last:border-b-0',
        onClick && 'cursor-pointer hover:bg-accent/50 active:bg-accent',
        'transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
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
        <DeviceIcon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Device name and info */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {state.displayName}
          </span>
          {state.isNew && (
            <Badge
              variant="info"
              className={cn(
                'text-xs px-1.5 py-0',
                '@media (prefers-reduced-motion: no-preference)',
                'animate-pulse'
              )}
            >
              New
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{state.ipAddress}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground font-mono">
            {state.macAddress}
          </span>
          {state.vendor && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{state.vendor}</span>
            </>
          )}
        </div>
      </div>

      {/* Device type */}
      <div className="text-xs text-muted-foreground whitespace-nowrap">
        {state.deviceTypeLabel}
      </div>

      {/* Connection duration */}
      <div className="text-xs text-muted-foreground whitespace-nowrap">
        {state.connectionDuration}
      </div>

      {/* Status */}
      <StatusBadge status={device.status} />

      {/* Static lease indicator */}
      {state.isStatic && (
        <Badge variant="outline" className="text-xs whitespace-nowrap">
          Static
        </Badge>
      )}
    </div>
  );
}
