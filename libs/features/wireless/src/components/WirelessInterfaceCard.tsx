/**
 * WirelessInterfaceCard Component
 * Displays a single wireless interface with status, SSID, band, and client count
 * Follows card-based UI pattern from UX design specification
 */

import { forwardRef } from 'react';
import { Card, CardContent, CardHeader, cn } from '@nasnet/ui/primitives';
import { Wifi, Radio, Signal } from 'lucide-react';
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
 * @example
 * ```tsx
 * <WirelessInterfaceCard
 *   interface={wirelessInterface}
 *   onClick={() => navigate(`/wifi/${interface.id}`)}
 * />
 * ```
 */
export const WirelessInterfaceCard = forwardRef<
  HTMLDivElement,
  WirelessInterfaceCardProps
>(({ interface: iface, onClick, className }, ref) => {
  // Determine band badge color
  const bandColor =
    iface.band === '2.4GHz'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      : iface.band === '5GHz'
        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
        : iface.band === '6GHz'
          ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';

  return (
    <Card
      ref={ref}
      className={cn(
        'rounded-2xl md:rounded-3xl cursor-pointer hover:shadow-lg transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Interface name and icon */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              <Wifi className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {iface.name}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {iface.ssid || 'Not configured'}
              </p>
            </div>
          </div>

          {/* Interface Toggle */}
          <InterfaceToggle
            interface={iface}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Frequency band and client count */}
        <div className="flex items-center gap-4">
          {/* Band badge */}
          <div className="flex items-center gap-1.5">
            <Radio className="h-4 w-4 text-slate-500" />
            <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium', bandColor)}>
              {iface.band}
            </span>
          </div>

          {/* Client count */}
          <div className="flex items-center gap-1.5">
            <Signal className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {iface.connectedClients} {iface.connectedClients === 1 ? 'client' : 'clients'}
            </span>
          </div>
        </div>

        {/* Additional info (channel, mode) - optional, hidden on mobile */}
        <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
          <span>Channel: {iface.channel || 'Auto'}</span>
          <span>•</span>
          <span>Mode: {iface.mode}</span>
        </div>
      </CardContent>
    </Card>
  );
});

WirelessInterfaceCard.displayName = 'WirelessInterfaceCard';
