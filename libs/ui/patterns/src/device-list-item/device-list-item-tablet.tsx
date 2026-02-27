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
        'border-border rounded-lg border',
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
          'focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset'
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
          <DeviceIcon className="text-muted-foreground h-6 w-6" />
        </div>

        {/* Device info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-base font-medium">{state.displayName}</span>
            {state.isNew && (
              <Badge
                variant="info"
                className={cn(
                  'px-1.5 py-0.5 text-xs',
                  '@media (prefers-reduced-motion: no-preference)',
                  'animate-pulse'
                )}
              >
                New
              </Badge>
            )}
            {state.isStatic && (
              <Badge
                variant="outline"
                className="text-xs"
              >
                Static
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-muted-foreground text-sm">{state.ipAddress}</span>
            <StatusBadge status={device.status} />
          </div>
          <div className="text-muted-foreground mt-0.5 text-xs">
            {state.deviceTypeLabel} · Connected {state.connectionDuration}
          </div>
        </div>

        {/* Expand indicator */}
        <ChevronDown
          className={cn(
            'text-muted-foreground h-5 w-5 flex-shrink-0',
            'transition-transform duration-200',
            state.isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Expanded details */}
      {state.isExpanded && (
        <div className="bg-muted/30 border-border border-t px-4 pb-4 pt-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <div className="text-muted-foreground mb-1 text-xs font-medium">MAC Address</div>
              <div className="font-mono text-sm">{state.macAddress}</div>
            </div>

            <div>
              <div className="text-muted-foreground mb-1 text-xs font-medium">
                Connection Duration
              </div>
              <div className="text-sm">{state.connectionDuration}</div>
            </div>

            {state.vendor && (
              <div>
                <div className="text-muted-foreground mb-1 text-xs font-medium">Vendor</div>
                <div className="text-sm">{state.vendor}</div>
              </div>
            )}

            <div>
              <div className="text-muted-foreground mb-1 text-xs font-medium">Device Type</div>
              <div className="text-sm">{state.deviceTypeLabel}</div>
            </div>

            <div>
              <div className="text-muted-foreground mb-1 text-xs font-medium">Lease Expires</div>
              <div className="text-sm">{state.expiration}</div>
            </div>

            <div>
              <div className="text-muted-foreground mb-1 text-xs font-medium">DHCP Server</div>
              <div className="text-sm">{state.server}</div>
            </div>

            <div>
              <div className="text-muted-foreground mb-1 text-xs font-medium">Status</div>
              <div className="text-sm">{state.statusLabel}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
