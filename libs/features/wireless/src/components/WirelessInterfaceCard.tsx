/**
 * WirelessInterfaceCard Component
 * Displays a single wireless interface with status, SSID, band, and client count
 * Follows card-based UI pattern from UX design specification
 */

import * as React from 'react';
import { Wifi, Radio, Signal } from 'lucide-react';
import { Card, CardContent, CardHeader, cn, Icon } from '@nasnet/ui/primitives';
import type { WirelessInterface } from '@nasnet/core/types';
import { InterfaceToggle } from './InterfaceToggle';

export interface WirelessInterfaceCardProps {
  /** Wireless interface data */
  interface: WirelessInterface;

  /** Optional click handler for card interaction */
  onClick?: () => void;

  /** Optional className for styling overrides */
  className?: string;
}

/**
 * Card component displaying wireless interface information
 * - Interface name and SSID
 * - Enabled/disabled status with color-coded indicator
 * - Frequency band badge (2.4GHz, 5GHz, 6GHz)
 * - Connected client count
 *
 * @description Responsive card displaying wireless interface status and key metrics
 *
 * @example
 * ```tsx
 * <WirelessInterfaceCard
 *   interface={wirelessInterface}
 *   onClick={() => navigate(`/wifi/${interface.id}`)}
 * />
 * ```
 */
function WirelessInterfaceCardComponent(
  { interface: iface, onClick, className }: WirelessInterfaceCardProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  // Determine band badge color using semantic tokens
  const bandColor = React.useMemo(() => {
    return iface.band === '2.4GHz'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
      : iface.band === '5GHz'
        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
        : iface.band === '6GHz'
          ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300'
          : 'bg-muted text-muted-foreground';
  }, [iface.band]);

  // Memoize click handler
  const handleClick = React.useCallback(() => {
    onClick?.();
  }, [onClick]);

  // Memoize keyboard handler
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    },
    [onClick]
  );

  // Memoize stop propagation handler
  const handleToggleClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Card
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={`Wireless interface ${iface.name}${iface.ssid ? `, SSID ${iface.ssid}` : ''}`}
      className={cn(
        'rounded-2xl md:rounded-3xl cursor-pointer hover:shadow-lg transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Interface name and icon */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-muted">
              <Icon icon={Wifi} className="text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {iface.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {iface.ssid || 'Not configured'}
              </p>
            </div>
          </div>

          {/* Interface Toggle */}
          <InterfaceToggle
            interface={iface}
            onClick={handleToggleClick}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Frequency band and client count */}
        <div className="flex items-center gap-4">
          {/* Band badge */}
          <div className="flex items-center gap-1.5">
            <Icon icon={Radio} size="sm" className="text-muted-foreground" aria-hidden="true" />
            <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium', bandColor)}>
              {iface.band}
            </span>
          </div>

          {/* Client count */}
          <div className="flex items-center gap-1.5">
            <Icon icon={Signal} size="sm" className="text-muted-foreground" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">
              {iface.connectedClients} {iface.connectedClients === 1 ? 'client' : 'clients'}
            </span>
          </div>
        </div>

        {/* Additional info (channel, mode) - optional, hidden on mobile */}
        <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
          <span>Channel: {iface.channel || 'Auto'}</span>
          <span>•</span>
          <span>Mode: {iface.mode}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export const WirelessInterfaceCard = React.memo(
  React.forwardRef(WirelessInterfaceCardComponent)
);
WirelessInterfaceCard.displayName = 'WirelessInterfaceCard';
