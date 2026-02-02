/**
 * useInterfaceSelector - Headless Hook for Interface Selection
 *
 * Contains all logic for the interface selector component:
 * - GraphQL subscription for real-time interface data
 * - Type filtering logic
 * - Search/filter by name (debounced)
 * - Selection state management (single and multi-select)
 * - Usage detection from router data
 *
 * @example
 * ```tsx
 * const state = useInterfaceSelector({
 *   routerId: 'router-1',
 *   value: selectedInterface,
 *   onChange: setSelectedInterface,
 *   multiple: false,
 * });
 * ```
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */

import { useState, useMemo, useCallback } from 'react';

import type {
  InterfaceSelectorProps,
  UseInterfaceSelectorReturn,
  RouterInterface,
  InterfaceType,
} from './interface-selector.types';

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 150;

/**
 * Custom hook for debounced value.
 * Delays updating the value until after the specified delay.
 */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Mock interfaces for development/testing when subscription is not available.
 * These will be replaced by real GraphQL subscription data.
 */
const MOCK_INTERFACES: RouterInterface[] = [
  { id: 'eth1', name: 'ether1', type: 'ethernet', status: 'up', ip: '192.168.1.1', usedBy: [] },
  { id: 'eth2', name: 'ether2', type: 'ethernet', status: 'up', ip: '192.168.2.1', usedBy: [] },
  { id: 'eth3', name: 'ether3', type: 'ethernet', status: 'down', usedBy: [] },
  { id: 'eth4', name: 'ether4', type: 'ethernet', status: 'disabled', usedBy: [] },
  { id: 'eth5', name: 'ether5', type: 'ethernet', status: 'up', usedBy: ['bridge-lan'] },
  { id: 'br1', name: 'bridge-lan', type: 'bridge', status: 'up', ip: '10.0.0.1', usedBy: ['DHCP Server'] },
  { id: 'wlan1', name: 'wlan1', type: 'wireless', status: 'up', ip: '192.168.88.1', usedBy: [] },
  { id: 'wlan2', name: 'wlan2', type: 'wireless', status: 'down', usedBy: [] },
  { id: 'vlan10', name: 'vlan10', type: 'vlan', status: 'up', ip: '10.10.0.1', usedBy: [] },
  { id: 'vlan20', name: 'vlan20', type: 'vlan', status: 'up', ip: '10.20.0.1', usedBy: [] },
  { id: 'ovpn1', name: 'ovpn-out1', type: 'vpn', status: 'down', usedBy: [] },
  { id: 'wg0', name: 'wg0', type: 'vpn', status: 'up', ip: '10.100.0.1', usedBy: [] },
  { id: 'l2tp1', name: 'l2tp-out1', type: 'vpn', status: 'disabled', usedBy: [] },
  { id: 'gre1', name: 'gre-tunnel1', type: 'tunnel', status: 'up', usedBy: [] },
  { id: 'lo', name: 'lo', type: 'loopback', status: 'up', ip: '127.0.0.1', usedBy: [] },
];

/**
 * Headless hook for interface selector component.
 *
 * Implements the Headless + Platform Presenter pattern (ADR-018):
 * - Contains ALL logic (state, filtering, selection, data fetching)
 * - No rendering - returns state and handlers for presenters
 * - Platform-agnostic - same hook for mobile and desktop
 *
 * @param config - InterfaceSelectorProps configuration
 * @returns UseInterfaceSelectorReturn with all state and handlers
 */
export function useInterfaceSelector(
  config: InterfaceSelectorProps
): UseInterfaceSelectorReturn {
  const {
    routerId,
    value,
    onChange,
    multiple = false,
    types = [],
    excludeUsed = false,
  } = config;

  // TODO: Replace with real GraphQL subscription
  // const { data, loading, error, refetch } = useSubscription(INTERFACES_SUBSCRIPTION, {
  //   variables: { routerId },
  // });

  // For now, use mock data with simulated loading
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const [interfaces, setInterfaces] = useState<RouterInterface[]>(MOCK_INTERFACES);

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<InterfaceType | 'all'>('all');
  const [isOpen, setIsOpen] = useState(false);

  // Debounced search
  const debouncedSearch = useDebouncedValue(searchQuery, DEBOUNCE_DELAY);

  // Selected values (normalize to array)
  const selectedValues = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Filtered interfaces
  const filteredInterfaces = useMemo(() => {
    let result = interfaces;

    // Filter by type (if types prop provided, use that; otherwise use typeFilter state)
    const activeTypes = types.length > 0 ? types : (typeFilter !== 'all' ? [typeFilter] : []);
    if (activeTypes.length > 0) {
      result = result.filter(iface => activeTypes.includes(iface.type));
    }

    // Filter out used interfaces if requested
    if (excludeUsed) {
      result = result.filter(iface => !iface.usedBy || iface.usedBy.length === 0);
    }

    // Search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(iface =>
        iface.name.toLowerCase().includes(query) ||
        iface.ip?.toLowerCase().includes(query) ||
        iface.comment?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [interfaces, types, typeFilter, excludeUsed, debouncedSearch]);

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(id)
        ? selectedValues.filter(v => v !== id)
        : [...selectedValues, id];
      onChange?.(newValues);
    } else {
      onChange?.(id);
      setIsOpen(false);
    }
  }, [multiple, selectedValues, onChange]);

  const clearSelection = useCallback(() => {
    onChange?.(multiple ? [] : '');
  }, [multiple, onChange]);

  const getInterfaceById = useCallback((id: string) => {
    return interfaces.find(iface => iface.id === id);
  }, [interfaces]);

  // Get display value for current selection
  const getDisplayValue = useCallback(() => {
    if (selectedValues.length === 0) {
      return '';
    }

    if (selectedValues.length === 1) {
      const iface = getInterfaceById(selectedValues[0]);
      return iface?.name || '';
    }

    return `${selectedValues.length} interfaces selected`;
  }, [selectedValues, getInterfaceById]);

  // Retry function for error state
  const retry = useCallback(() => {
    setSubscriptionError(null);
    setIsLoading(true);
    // Simulate refetch - in real implementation this would call refetch()
    setTimeout(() => {
      setInterfaces(MOCK_INTERFACES);
      setIsLoading(false);
    }, 500);
  }, []);

  return {
    interfaces,
    filteredInterfaces,
    selectedValues,
    isLoading,
    error: subscriptionError,
    searchQuery,
    typeFilter,
    isOpen,
    setSearchQuery,
    setTypeFilter,
    setIsOpen,
    toggleSelection,
    clearSelection,
    getInterfaceById,
    getDisplayValue,
    retry,
  };
}

export default useInterfaceSelector;
