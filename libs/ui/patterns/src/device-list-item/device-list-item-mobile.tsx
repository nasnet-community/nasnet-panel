/**
 * DeviceListItem Mobile Presenter
 *
 * Mobile-specific rendering for DeviceListItem.
 * Optimized for touch interaction with 44px minimum touch targets.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/device-list-item
 * @see NAS-5.4: DHCP Leases and Active Connections Display
 */

import * as React from 'react';

import { ChevronDown } from 'lucide-react';

import { cn, Badge } from '@nasnet/ui/primitives';

import { StatusBadge } from '../status-badge';

import type { DeviceListItemPresenterProps } from './device-list-item.types';

/**
 * Mobile presenter for DeviceListItem
 *
 * Features:
 * - 44px minimum row height for touch targets
 * - Tap-to-expand for device details
 * - Vertical card stack layout
 * - Bottom sheet compatible
 *
 * @param props - Presenter props with computed state
 */
export function DeviceListItemMobile({
  state,
  device,
  onClick,
  className,
  id,
}: DeviceListItemPresenterProps) {
  const handleClick = React.useCallback(() => {
    state.toggleExpanded();
    onClick?.();
  }, [state, onClick]);

  const DeviceIcon = state.deviceIcon;

  return (
    <div
      id={id}
      className={cn(
        'border-b border-border last:border-b-0',
        'hover:bg-accent/50 active:bg-accent',
        'transition-colors',
        className
      )}
    >
      {/* Main row - tap to expand */}
      <button
        type="button"
        onClick={handleClick}
        aria-label={state.ariaLabel}
        aria-expanded={state.isExpanded}
        className={cn(
          'w-full px-4 py-3 text-left',
          'flex items-center gap-3',
          'min-h-[44px]', // WCAG touch target
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
        )}
      >
        {/* Device icon */}
        <div
          className={cn(
            'flex-shrink-0',
            'flex items-center justify-center',
            'h-10 w-10 rounded-full',
            'bg-muted'
          )}
        >
          <DeviceIcon className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Device info */}
        <div className="flex-1 min-w-0">
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
            <StatusBadge status={device.status} />
          </div>
        </div>

        {/* Expand indicator */}
        <ChevronDown
          className={cn(
            'h-5 w-5 text-muted-foreground flex-shrink-0',
            'transition-transform duration-200',
            state.isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Expanded details */}
      {state.isExpanded && (
        <div className="px-4 pb-3 pt-0 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <div className="text-xs text-muted-foreground">MAC Address</div>
              <div className="text-xs font-mono">{state.macAddress}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Connected</div>
              <div className="text-xs">{state.connectionDuration}</div>
            </div>

            {state.vendor && (
              <div>
                <div className="text-xs text-muted-foreground">Vendor</div>
                <div className="text-xs">{state.vendor}</div>
              </div>
            )}

            <div>
              <div className="text-xs text-muted-foreground">Type</div>
              <div className="text-xs">{state.deviceTypeLabel}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Expires</div>
              <div className="text-xs">{state.expiration}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Server</div>
              <div className="text-xs">{state.server}</div>
            </div>
          </div>

          {state.isStatic && (
            <Badge variant="outline" className="text-xs">
              Static Lease
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
