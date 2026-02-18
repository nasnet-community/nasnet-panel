/**
 * InterfaceTypeFilter - Type filter dropdown component
 *
 * Allows filtering interfaces by type (Ethernet, Bridge, VLAN, etc.)
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */

import { memo } from 'react';

import { Filter } from 'lucide-react';

import {
  cn,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@nasnet/ui/primitives';

import { InterfaceTypeIcon, getInterfaceTypeLabel } from './interface-type-icon';

import type { InterfaceType, InterfaceTypeFilterProps } from './interface-selector.types';

/**
 * All available interface types.
 */
const ALL_INTERFACE_TYPES: InterfaceType[] = [
  'ethernet',
  'bridge',
  'vlan',
  'wireless',
  'vpn',
  'tunnel',
  'loopback',
];

/**
 * InterfaceTypeFilter component.
 *
 * Dropdown for filtering interfaces by type.
 *
 * @param props - InterfaceTypeFilterProps
 */
export const InterfaceTypeFilter = memo(function InterfaceTypeFilter({
  value,
  onChange,
  availableTypes = ALL_INTERFACE_TYPES,
  className,
}: InterfaceTypeFilterProps) {
  return (
    <Select value={value} onValueChange={onChange as (value: string) => void}>
      <SelectTrigger
        className={cn('w-[140px] h-9', className)}
        aria-label="Filter by interface type"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <SelectValue placeholder="All Types" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>All Types</span>
          </span>
        </SelectItem>
        {availableTypes.map((type) => (
          <SelectItem key={type} value={type}>
            <span className="flex items-center gap-2">
              <InterfaceTypeIcon type={type} size={4} />
              <span>{getInterfaceTypeLabel(type)}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

InterfaceTypeFilter.displayName = 'InterfaceTypeFilter';

export default InterfaceTypeFilter;
