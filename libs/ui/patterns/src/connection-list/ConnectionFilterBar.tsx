/**
 * ConnectionFilterBar Component
 *
 * Filter controls for connection list with debounced input.
 * Provides IP (with wildcard), port, protocol, and state filters.
 */

import * as React from 'react';

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  cn,
} from '@nasnet/ui/primitives';

import { useDebouncedCallback } from '../hooks';

import type { ConnectionFilter, ConnectionState } from './types';

export interface ConnectionFilterBarProps {
  /** Current filter values */
  filter: ConnectionFilter;

  /** Callback when filter changes */
  onFilterChange: (filter: Partial<ConnectionFilter>) => void;

  /** Callback to clear all filters */
  onClearFilter: () => void;

  /** Whether any filter is active */
  hasActiveFilter: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Debounce delay in milliseconds */
  debounceMs?: number;
}

/**
 * Common protocol options
 */
const PROTOCOL_OPTIONS: Array<{ value: string | 'all'; label: string }> = [
  { value: 'all', label: 'All Protocols' },
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'icmp', label: 'ICMP' },
  { value: 'gre', label: 'GRE' },
];

/**
 * Connection state options (all 11 MikroTik states)
 */
const STATE_OPTIONS: Array<{ value: ConnectionState | 'all'; label: string }> = [
  { value: 'all', label: 'All States' },
  { value: 'established', label: 'Established' },
  { value: 'new', label: 'New' },
  { value: 'related', label: 'Related' },
  { value: 'invalid', label: 'Invalid' },
  { value: 'time-wait', label: 'Time-Wait' },
  { value: 'syn-sent', label: 'SYN-Sent' },
  { value: 'syn-received', label: 'SYN-Received' },
  { value: 'fin-wait', label: 'FIN-Wait' },
  { value: 'close-wait', label: 'Close-Wait' },
  { value: 'last-ack', label: 'Last-ACK' },
  { value: 'close', label: 'Close' },
];

/**
 * Filter bar for connection list
 *
 * Features:
 * - IP filter with wildcard support (192.168.1.*)
 * - Port filter (matches source or destination)
 * - Protocol filter dropdown
 * - State filter dropdown
 * - Debounced text inputs (300ms)
 * - Clear all button
 *
 * @example
 * ```tsx
 * <ConnectionFilterBar
 *   filter={filter}
 *   onFilterChange={setFilter}
 *   onClearFilter={clearFilter}
 *   hasActiveFilter={hasActiveFilter}
 * />
 * ```
 */
export function ConnectionFilterBar({
  filter,
  onFilterChange,
  onClearFilter,
  hasActiveFilter,
  className,
  debounceMs = 300,
}: ConnectionFilterBarProps) {
  // Local state for immediate UI updates
  const [localIp, setLocalIp] = React.useState(filter.ipAddress || '');
  const [localPort, setLocalPort] = React.useState(
    filter.port !== undefined ? String(filter.port) : ''
  );

  // Debounced callbacks
  const debouncedIpChange = useDebouncedCallback((value: string) => {
    onFilterChange({ ipAddress: value });
  }, debounceMs);

  const debouncedPortChange = useDebouncedCallback((value: string) => {
    const port = value.trim() === '' ? undefined : parseInt(value, 10);
    onFilterChange({ port: isNaN(port as number) ? undefined : port });
  }, debounceMs);

  // Handle IP input change
  const handleIpChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalIp(value);
      debouncedIpChange(value);
    },
    [debouncedIpChange]
  );

  // Handle port input change
  const handlePortChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Only allow numbers
      if (value === '' || /^\d+$/.test(value)) {
        setLocalPort(value);
        debouncedPortChange(value);
      }
    },
    [debouncedPortChange]
  );

  // Handle protocol change
  const handleProtocolChange = React.useCallback(
    (value: string) => {
      onFilterChange({ protocol: value });
    },
    [onFilterChange]
  );

  // Handle state change
  const handleStateChange = React.useCallback(
    (value: string) => {
      onFilterChange({ state: value as ConnectionState | 'all' });
    },
    [onFilterChange]
  );

  // Clear all filters
  const handleClearAll = React.useCallback(() => {
    setLocalIp('');
    setLocalPort('');
    onClearFilter();
  }, [onClearFilter]);

  return (
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-end md:gap-3', className)}>
      {/* IP Filter */}
      <div className="min-w-0 flex-1">
        <label
          htmlFor="filter-ip"
          className="text-foreground mb-2 block text-sm font-medium"
        >
          IP Address
        </label>
        <Input
          id="filter-ip"
          type="text"
          placeholder="192.168.1.* or exact IP"
          value={localIp}
          onChange={handleIpChange}
          className="w-full"
          aria-label="Filter by IP address (supports wildcards like 192.168.1.*)"
        />
      </div>

      {/* Port Filter */}
      <div className="w-full md:w-32">
        <label
          htmlFor="filter-port"
          className="text-foreground mb-2 block text-sm font-medium"
        >
          Port
        </label>
        <Input
          id="filter-port"
          type="text"
          inputMode="numeric"
          placeholder="Port"
          value={localPort}
          onChange={handlePortChange}
          className="w-full"
          aria-label="Filter by port number"
        />
      </div>

      {/* Protocol Filter */}
      <div className="w-full md:w-40">
        <label
          htmlFor="filter-protocol"
          className="text-foreground mb-2 block text-sm font-medium"
        >
          Protocol
        </label>
        <Select
          value={filter.protocol || 'all'}
          onValueChange={handleProtocolChange}
        >
          <SelectTrigger
            id="filter-protocol"
            className="w-full"
          >
            <SelectValue placeholder="Protocol" />
          </SelectTrigger>
          <SelectContent>
            {PROTOCOL_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* State Filter */}
      <div className="w-full md:w-40">
        <label
          htmlFor="filter-state"
          className="text-foreground mb-2 block text-sm font-medium"
        >
          State
        </label>
        <Select
          value={filter.state || 'all'}
          onValueChange={handleStateChange}
        >
          <SelectTrigger
            id="filter-state"
            className="w-full"
          >
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            {STATE_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Button */}
      {hasActiveFilter && (
        <Button
          variant="outline"
          onClick={handleClearAll}
          className="w-full md:w-auto"
          aria-label="Clear all filters"
        >
          Clear
        </Button>
      )}
    </div>
  );
}

ConnectionFilterBar.displayName = 'ConnectionFilterBar';
