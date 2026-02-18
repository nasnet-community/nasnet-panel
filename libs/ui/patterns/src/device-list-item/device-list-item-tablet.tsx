/**
 * DeviceListItem Tablet Presenter
 *
 * Tablet-specific rendering for DeviceListItem.
 * Hybrid approach between mobile and desktop.
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
 * Tablet presenter for DeviceListItem
 *
 * Features:
 * - Card layout with expandable section
 * - 2-column grid for details
 * - Balanced information density
 * - Touch-friendly but more compact than mobile
 *
 * @param props - Presenter props with computed state
 */
export function DeviceListItemTablet({
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
        'border border-border rounded-lg',
        'overflow-hidden',
        'transition-shadow hover:shadow-md',
        className
      )}
    >
      {/* Main card - tap to expand */}
      <button
        type="button"
        onClick={handleClick}
        aria-label={state.ariaLabel}
        aria-expanded={state.isExpanded}
        className={cn(
          'w-full px-4 py-3 text-left',
          'flex items-center gap-3',
          'hover:bg-accent/30',
          'transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset'
        )}
      >
        {/* Device icon */}
        <div
          className={cn(
            'flex-shrink-0',
            'flex items-center justify-center',
            'h-12 w-12 rounded-full',
            'bg-muted'
          )}
        >
          <DeviceIcon className="h-6 w-6 text-muted-foreground" />
        </div>

        {/* Device info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-base truncate">
              {state.displayName}
            </span>
            {state.isNew && (
              <Badge
                variant="info"
                className={cn(
                  'text-xs px-1.5 py-0.5',
                  '@media (prefers-reduced-motion: no-preference)',
                  'animate-pulse'
                )}
              >
                New
              </Badge>
            )}
            {state.isStatic && (
              <Badge variant="outline" className="text-xs">
                Static
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{state.ipAddress}</span>
            <StatusBadge status={device.status} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {state.deviceTypeLabel} · Connected {state.connectionDuration}
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
        <div className="px-4 pb-4 pt-2 bg-muted/30 border-t border-border">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                MAC Address
              </div>
              <div className="text-sm font-mono">{state.macAddress}</div>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Connection Duration
              </div>
              <div className="text-sm">{state.connectionDuration}</div>
            </div>

            {state.vendor && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Vendor
                </div>
                <div className="text-sm">{state.vendor}</div>
              </div>
            )}

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Device Type
              </div>
              <div className="text-sm">{state.deviceTypeLabel}</div>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Lease Expires
              </div>
              <div className="text-sm">{state.expiration}</div>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                DHCP Server
              </div>
              <div className="text-sm">{state.server}</div>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Status
              </div>
              <div className="text-sm">{state.statusLabel}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
