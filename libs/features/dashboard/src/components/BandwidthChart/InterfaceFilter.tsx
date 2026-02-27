/**
 * InterfaceFilter - Dropdown selector for filtering bandwidth by interface
 * WCAG AAA compliant with proper ARIA support and keyboard navigation
 * @description
 * Provides a Select dropdown for choosing specific interface or all interfaces.
 * Fetches interface list via useInterfaces hook, displays type-specific icons,
 * and maintains 44px minimum touch targets. Supports keyboard navigation and
 * screen reader announcements.
 * @example
 * <InterfaceFilter routerId="router1" value="eth0" onChange={setInterface} />
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
 * @description
 * Returns appropriate Lucide icon based on interface type.
 * Icons are semantic: ethernet (cable), wireless (wifi), others (network).
 * @param type - Interface type string (ethernet, wireless, bridge, vlan)
 * @returns Icon component with 4px × 4px dimensions
 */
function getInterfaceIcon(type: string) {
  switch (type) {
    case 'ethernet':
      return <Cable className="h-4 w-4" aria-hidden="true" />;
    case 'wireless':
      return <Wifi className="h-4 w-4" aria-hidden="true" />;
    case 'bridge':
    case 'vlan':
    default:
      return <Network className="h-4 w-4" aria-hidden="true" />;
  }
}

/**
 * InterfaceFilter component - Select dropdown for interface filtering
 *
 * Provides dropdown for selecting specific interface or "All interfaces"
 * - Integrates with useInterfaces hook from Story 5.3
 * - WCAG AAA compliant: 7:1 contrast, 44px minimum touch targets
 * - Keyboard navigation via Select primitive (arrow keys, Enter, Escape)
 * - Shows interface type icons for visual identification
 * - Memoized getInterfaceLabel callback for performance
 * - Proper ARIA labeling and semantic structure
 *
 * @param props - Component props (routerId, value, onChange, className)
 * @returns Memoized Select component with interface options
 */
export const InterfaceFilter = memo<InterfaceFilterProps>(
  ({ routerId, value, onChange, className }) => {
    // Fetch interfaces using hook from Story 5.3
    const { interfaces, isLoading } = useInterfaces({ deviceId: routerId });

    /**
     * Format interface display name with optional type annotation
     * Memoized to avoid unnecessary recalculations on re-render
     */
    const getInterfaceLabel = useMemo(
      () => (interfaceId: string) => {
        const iface = interfaces?.find((i) => i.id === interfaceId);
        if (!iface) return interfaceId;
        return `${iface.name}${iface.type ? ` (${iface.type})` : ''}`;
      },
      [interfaces]
    );

    /**
     * Current selection label - defaults to "All interfaces" when null
     */
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
            <div className="flex items-center gap-component-sm">
              <Network className="h-4 w-4" aria-hidden="true" />
              <span>All interfaces</span>
            </div>
          </SelectItem>

          {/* Loading state */}
          {isLoading && (
            <SelectItem value="loading" disabled>
              <span className="text-muted-foreground">Loading interfaces...</span>
            </SelectItem>
          )}

          {/* Interface list */}
          {interfaces && interfaces.length > 0 ? (
            interfaces.map((iface) => (
              <SelectItem key={iface.id} value={iface.id}>
                <div className="flex items-center gap-component-sm">
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
            !isLoading && (
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
