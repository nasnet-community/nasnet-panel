/**
 * InterfaceFilter - Dropdown selector for filtering bandwidth by interface
 * WCAG AAA compliant with proper ARIA support and keyboard navigation
 */

import { memo, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import { Cable, Wifi, Network } from 'lucide-react';
import type { InterfaceFilterProps } from './types';
import { useInterfaces } from '../InterfaceGrid/useInterfaces';

/**
 * Get icon for interface type
 */
function getInterfaceIcon(type: string) {
  switch (type) {
    case 'ethernet':
      return <Cable className="h-4 w-4" />;
    case 'wireless':
      return <Wifi className="h-4 w-4" />;
    case 'bridge':
    case 'vlan':
    default:
      return <Network className="h-4 w-4" />;
  }
}

/**
 * InterfaceFilter component
 *
 * Provides dropdown for selecting specific interface or "All interfaces"
 * - Integrates with useInterfaces hook from Story 5.3
 * - WCAG AAA compliant (7:1 contrast, 44px touch targets)
 * - Keyboard navigation via Select primitive
 * - Shows interface type icons for visual identification
 *
 * @param props - Component props
 */
export const InterfaceFilter = memo<InterfaceFilterProps>(
  ({ routerId, value, onChange, className }) => {
    // Fetch interfaces using hook from Story 5.3
    const { interfaces, loading } = useInterfaces({ deviceId: routerId });

    // Format interface display name
    const getInterfaceLabel = useMemo(
      () => (interfaceId: string) => {
        const iface = interfaces?.find((i) => i.id === interfaceId);
        if (!iface) return interfaceId;
        return `${iface.name}${iface.type ? ` (${iface.type})` : ''}`;
      },
      [interfaces]
    );

    // Current selection label
    const currentLabel = value ? getInterfaceLabel(value) : 'All interfaces';

    return (
      <Select
        value={value || 'all'}
        onValueChange={(v) => onChange(v === 'all' ? null : v)}
      >
        <SelectTrigger
          className={cn(
            'w-[180px] min-h-[44px]', // 44px minimum for touch targets (WCAG AAA)
            className
          )}
          aria-label="Filter bandwidth by interface"
        >
          <SelectValue placeholder={currentLabel}>{currentLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* All interfaces option */}
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              <span>All interfaces</span>
            </div>
          </SelectItem>

          {/* Loading state */}
          {loading && (
            <SelectItem value="loading" disabled>
              <span className="text-muted-foreground">Loading interfaces...</span>
            </SelectItem>
          )}

          {/* Interface list */}
          {interfaces && interfaces.length > 0 ? (
            interfaces.map((iface) => (
              <SelectItem key={iface.id} value={iface.id}>
                <div className="flex items-center gap-2">
                  {getInterfaceIcon(iface.type)}
                  <span>{iface.name}</span>
                  {iface.type && (
                    <span className="text-xs text-muted-foreground">
                      ({iface.type})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))
          ) : (
            !loading && (
              <SelectItem value="empty" disabled>
                <span className="text-muted-foreground">No interfaces found</span>
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    );
  }
);

InterfaceFilter.displayName = 'InterfaceFilter';
