/**
 * useConnectedDevices Hook
 * Wrapper hook that composes existing DHCP hooks to provide enriched connected device data
 *
 * Epic 5 - Story 5.4: DHCP Leases and Active Connections Display
 * @module @nasnet/features/dashboard/hooks/useConnectedDevices
 */

import { useMemo, useRef, useEffect } from 'react';
import { useDHCPLeases, useDHCPServers } from '@nasnet/api-client/queries';
import type {
  DHCPLease,
  DHCPServer,
  LeaseStatus,
  ConnectedDeviceEnriched,
} from '@nasnet/core/types';
import { detectDeviceType } from '@nasnet/core/utils';

/**
 * Options for useConnectedDevices hook
 */
export interface UseConnectedDevicesOptions {
  /** Polling interval in ms (default: 5000 when active, 30000 when background) */
  pollingInterval?: number;

  /** Sort order for devices */
  sortBy?: 'hostname' | 'ip' | 'duration' | 'recent';
}

/**
 * Return type for useConnectedDevices hook
 */
export interface UseConnectedDevicesReturn {
  /** Enriched device list */
  devices: ConnectedDeviceEnriched[];

  /** Total number of connected devices */
  totalCount: number;

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: Error | null;

  /** Whether DHCP server is enabled */
  isDhcpEnabled: boolean;

  /** Whether device list is empty (when not loading) */
  isEmpty: boolean;

  /** Last update timestamp */
  lastUpdated: Date | null;
}

/**
 * Hook to fetch and enrich connected device data
 *
 * Composes existing useDHCPLeases and useDHCPServers hooks without modifying them.
 * Transforms DHCP lease data into enriched device information with:
 * - Device type detection
 * - "New" device tracking
 * - Connection duration calculation
 * - Sorting capabilities
 *
 * @param routerIp - Target router IP address
 * @param options - Optional configuration
 * @returns Enriched device data and state
 *
 * @example
 * const { devices, totalCount, isLoading, isDhcpEnabled } = useConnectedDevices('192.168.88.1');
 */
export function useConnectedDevices(
  routerIp: string,
  options?: UseConnectedDevicesOptions
): UseConnectedDevicesReturn {
  // 1. Compose existing TanStack Query hooks (DO NOT MODIFY THEM)
  const { data: leases, isLoading, error } = useDHCPLeases(routerIp);

  const { data: servers } = useDHCPServers(routerIp);

  // 2. Track previous lease MACs for "isNew" detection
  // Using refs to avoid triggering re-renders
  const prevMacsRef = useRef<Set<string>>(new Set());
  const newMacsRef = useRef<Map<string, number>>(new Map()); // MAC -> timestamp

  // 3. Transform to enriched type
  const enrichedDevices = useMemo(() => {
    if (!leases) return [];
    return transformLeases(leases, prevMacsRef.current, newMacsRef.current, options?.sortBy);
  }, [leases, options?.sortBy]);

  // 4. Update tracking refs after transform
  useEffect(() => {
    if (leases) {
      prevMacsRef.current = new Set(leases.map((l) => l.macAddress));

      // Clean up old "new" markers after 30 seconds
      const now = Date.now();
      newMacsRef.current.forEach((timestamp, mac) => {
        if (now - timestamp > 30000) {
          newMacsRef.current.delete(mac);
        }
      });
    }
  }, [leases]);

  // 5. Derived state
  const isDhcpEnabled = servers?.some((s) => !s.disabled) ?? false;
  const isEmpty = !isLoading && enrichedDevices.length === 0;

  return {
    devices: enrichedDevices,
    totalCount: enrichedDevices.length,
    isLoading,
    error: error ?? null,
    isDhcpEnabled,
    isEmpty,
    lastUpdated: leases ? new Date() : null,
  };
}

/**
 * Transform DHCPLease[] to ConnectedDeviceEnriched[]
 *
 * Filters to only show bound leases and enriches with computed fields
 */
function transformLeases(
  leases: DHCPLease[],
  prevMacs: Set<string>,
  newMacs: Map<string, number>,
  sortBy?: string
): ConnectedDeviceEnriched[] {
  const now = Date.now();

  const enriched = leases
    .filter((lease) => lease.status === 'bound') // Only show active leases
    .map((lease) => {
      // Detect if this is a new device
      const isNew = !prevMacs.has(lease.macAddress);
      if (isNew && !newMacs.has(lease.macAddress)) {
        newMacs.set(lease.macAddress, now);
      }

      const newTimestamp = newMacs.get(lease.macAddress);
      const showAsNew = newTimestamp ? now - newTimestamp < 30000 : false;

      return {
        id: lease.id,
        ipAddress: lease.address,
        macAddress: lease.macAddress,
        hostname: lease.hostname || 'Unknown',
        status: lease.status,
        statusLabel: formatStatusLabel(lease.status),
        expiration: formatExpiration(lease.expiresAfter),
        isStatic: !lease.dynamic,
        vendor: null, // Populated by useVendorLookup (Task 6)
        deviceType: detectDeviceType(lease.hostname, null),
        isNew: showAsNew,
        connectionDuration: formatDuration(lease.lastSeen),
        firstSeen: lease.lastSeen ?? new Date(),
        _lease: lease,
      } as ConnectedDeviceEnriched;
    });

  // Sort based on option
  return sortDevices(enriched, sortBy);
}

/**
 * Format lease status into human-readable label
 */
function formatStatusLabel(status: LeaseStatus): string {
  const labels: Record<LeaseStatus, string> = {
    bound: 'Connected',
    waiting: 'Waiting',
    offered: 'Offered',
    busy: 'Conflict',
  };
  return labels[status] || status;
}

/**
 * Format expiration time from RouterOS duration format
 */
function formatExpiration(expiresAfter?: string): string {
  if (!expiresAfter) return 'Never';
  // RouterOS duration format: "23h15m30s"
  return `in ${expiresAfter}`;
}

/**
 * Format connection duration since lastSeen
 */
function formatDuration(lastSeen?: Date): string {
  if (!lastSeen) return 'Unknown';

  const now = new Date();
  const diff = now.getTime() - new Date(lastSeen).getTime();

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Sort devices by specified criteria
 */
function sortDevices(
  devices: ConnectedDeviceEnriched[],
  sortBy?: string
): ConnectedDeviceEnriched[] {
  switch (sortBy) {
    case 'hostname':
      return [...devices].sort((a, b) => a.hostname.localeCompare(b.hostname));

    case 'ip':
      return [...devices].sort((a, b) => {
        const aNum = a.ipAddress.split('.').map(Number);
        const bNum = b.ipAddress.split('.').map(Number);
        for (let i = 0; i < 4; i++) {
          if (aNum[i] !== bNum[i]) return aNum[i] - bNum[i];
        }
        return 0;
      });

    case 'recent':
      return [...devices].sort((a, b) => b.firstSeen.getTime() - a.firstSeen.getTime());

    case 'duration':
    default:
      return [...devices].sort((a, b) => a.firstSeen.getTime() - b.firstSeen.getTime());
  }
}
