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
    return (
      iface.band === '2.4GHz' ? 'bg-info/10 text-info'
      : iface.band === '5GHz' ? 'bg-secondary/10 text-secondary'
      : iface.band === '6GHz' ? 'bg-primary/10 text-primary'
      : 'bg-muted text-muted-foreground'
    );
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
        'rounded-card-lg focus-visible:ring-ring cursor-pointer transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <CardHeader className="pb-component-sm">
        <div className="flex items-start justify-between">
          {/* Interface name and icon */}
          <div className="gap-component-sm flex items-center">
            <div className="p-component-sm bg-muted rounded-lg">
              <Icon
                icon={Wifi}
                className="text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div>
              <h3 className="font-display text-foreground text-lg font-semibold">{iface.name}</h3>
              <p className="text-muted-foreground font-mono text-sm">
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

      <CardContent className="space-y-component-md">
        {/* Frequency band and client count */}
        <div className="gap-component-md flex items-center">
          {/* Band badge */}
          <div className="gap-component-xs flex items-center">
            <Icon
              icon={Radio}
              size="sm"
              className="text-muted-foreground"
              aria-hidden="true"
            />
            <span
              className={cn(
                'px-component-sm py-component-xs rounded-md text-xs font-medium',
                bandColor
              )}
            >
              {iface.band}
            </span>
          </div>

          {/* Client count */}
          <div className="gap-component-xs flex items-center">
            <Icon
              icon={Signal}
              size="sm"
              className="text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-muted-foreground text-sm">
              {iface.connectedClients} {iface.connectedClients === 1 ? 'client' : 'clients'}
            </span>
          </div>
        </div>

        {/* Additional info (channel, mode) - optional, hidden on mobile */}
        <div className="gap-component-md text-muted-foreground hidden items-center font-mono text-xs md:flex">
          <span>Channel: {iface.channel || 'Auto'}</span>
          <span>•</span>
          <span>Mode: {iface.mode}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export const WirelessInterfaceCard = React.memo(React.forwardRef(WirelessInterfaceCardComponent));
WirelessInterfaceCard.displayName = 'WirelessInterfaceCard';
