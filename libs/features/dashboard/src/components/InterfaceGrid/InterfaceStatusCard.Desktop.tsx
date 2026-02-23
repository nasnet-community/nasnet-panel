/**
 * InterfaceStatusCard Desktop Presenter
 *
 * Desktop-optimized card showing interface status with full details.
 * Features:
 * - 4-column responsive grid layout
 * - Full traffic rate display with icons
 * - Link speed indicator
 * - Status pulse animation (respects reduced motion)
 */

import React, { useCallback } from 'react';
import { Card, CardContent, cn } from '@nasnet/ui/primitives';
import { InterfaceTypeIcon } from '@nasnet/ui/patterns/network-inputs/interface-selector';
import {
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useInterfaceStatusCard } from './useInterfaceStatusCard';
import { formatTrafficRate, formatLinkSpeed } from './utils';
import type { InterfaceStatusCardProps, InterfaceStatus } from './types';

// Status configuration - uses semantic status color tokens
const STATUS_CONFIG: Record<
  InterfaceStatus,
  {
    icon: LucideIcon;
    label: string;
    bgClass: string;
    iconClass: string;
  }
> = {
  up: {
    icon: CheckCircle2,
    label: 'Up',
    bgClass: 'bg-statusConnected/10',
    iconClass: 'text-statusConnected',
  },
  down: {
    icon: XCircle,
    label: 'Down',
    bgClass: 'bg-statusError/10',
    iconClass: 'text-statusError',
  },
  disabled: {
    icon: MinusCircle,
    label: 'Disabled',
    bgClass: 'bg-statusDisconnected/10',
    iconClass: 'text-statusDisconnected',
  },
};

/**
 * Desktop presenter for InterfaceStatusCard.
 * Optimized for larger screens with full information display.
 *
 * @description
 * Shows interface name, status icon, traffic rates (TX/RX), link speed, and IP address.
 * Includes hover states and focus indicators for keyboard navigation.
 */
const InterfaceStatusCardDesktopComponent = React.memo(function InterfaceStatusCardDesktop({
  interface: iface,
  onSelect,
  className,
}: InterfaceStatusCardProps) {
  const {
    handleClick,
    handleKeyDown,
    isStatusChanged,
    prefersReducedMotion,
    ariaLabel,
    detailsId,
  } = useInterfaceStatusCard({ interface: iface, onSelect });

  const status = STATUS_CONFIG[iface.status];
  const StatusIcon = status.icon;

  // Memoize click handler with correct dependencies
  const memoizedHandleClick = useCallback(() => {
    handleClick();
  }, [handleClick]);

  return (
    <Card
      role="article"
      aria-label={ariaLabel}
      aria-describedby={detailsId}
      tabIndex={0}
      onClick={memoizedHandleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'cursor-pointer transition-all min-w-[200px]',
        'hover:shadow-md hover:border-primary/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        status.bgClass,
        !prefersReducedMotion && isStatusChanged && 'animate-pulse',
        className
      )}
    >
      <CardContent className="p-4">
        {/* Header: Icon + Name + Status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <InterfaceTypeIcon type={iface.type} className="h-5 w-5" />
            <span className="font-medium truncate">{iface.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <StatusIcon
              className={cn('h-4 w-4', status.iconClass)}
              aria-hidden="true"
            />
            <span className={cn('text-xs', status.iconClass)}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Traffic rates */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <ArrowUp className="h-3 w-3" aria-hidden="true" />
            <span>{formatTrafficRate(iface.txRate)}</span>
          </span>
          <span className="flex items-center gap-1">
            <ArrowDown className="h-3 w-3" aria-hidden="true" />
            <span>{formatTrafficRate(iface.rxRate)}</span>
          </span>
        </div>

        {/* Footer: IP + Link Speed */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono truncate">{iface.ip || 'No IP'}</span>
          {iface.linkSpeed && (
            <span className="shrink-0">{formatLinkSpeed(iface.linkSpeed)}</span>
          )}
        </div>

        {/* Last seen for down interfaces */}
        {iface.status === 'down' && iface.lastSeen && (
          <div className="text-xs text-muted-foreground mt-1">
            Last seen: {new Date(iface.lastSeen).toLocaleString()}
          </div>
        )}

        {/* Screen reader details */}
        <span id={detailsId} className="sr-only">
          TX: {formatTrafficRate(iface.txRate)}, RX:{' '}
          {formatTrafficRate(iface.rxRate)}
          {iface.linkSpeed && `, Link speed: ${iface.linkSpeed}`}
        </span>
      </CardContent>
    </Card>
  );
});

InterfaceStatusCardDesktopComponent.displayName = 'InterfaceStatusCardDesktop';

export { InterfaceStatusCardDesktopComponent as InterfaceStatusCardDesktop };
