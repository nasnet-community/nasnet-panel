/**
 * DNS Page Hook
 *
 * Combines DNS queries and provides parsed data for the DNS page.
 *
 * @description
 * Fetches and combines DNS settings and static entries from Apollo Client.
 * Parses raw RouterOS data into UI-friendly format for the DNS configuration page.
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { useMemo, useCallback } from 'react';
import { useDNSSettings, useDNSStaticEntries } from '@nasnet/api-client/queries';
import { parseDNSSettings } from '../utils';
import type { ParsedDNSSettings, DNSStaticEntry } from '@nasnet/core/types';

/**
 * DNS Page Hook Return Type
 */
export interface UseDnsPageReturn {
  /** Parsed DNS settings (null if not loaded yet) */
  settings: ParsedDNSSettings | null;
  /** Array of static DNS entries */
  entries: DNSStaticEntry[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Whether settings query is loading */
  isSettingsLoading: boolean;
  /** Whether entries query is loading */
  isEntriesLoading: boolean;
  /** Error from either query (if any) */
  error: Error | null;
  /** Refetch both queries */
  refetch: () => void;
}

/**
 * Hook for DNS page data management
 *
 * Fetches and combines DNS settings and static entries from Apollo Client.
 * Parses raw RouterOS data into UI-friendly format.
 *
 * @param deviceId - Target router device ID
 * @returns Combined DNS data and loading/error states
 *
 * @example
 * ```tsx
 * function DnsPage() {
 *   const { settings, entries, isLoading, error, refetch } = useDnsPage(routerId);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Error message={error.message} onRetry={refetch} />;
 *
 *   return (
 *     <div>
 *       <DnsServerList servers={settings.staticServers} ... />
 *       <DnsStaticEntriesList entries={entries} ... />
 *     </div>
 *   );
 * }
 * ```
 */
export function useDnsPage(deviceId: string): UseDnsPageReturn {
  // Fetch DNS settings
  const settingsQuery = useDNSSettings(deviceId);

  // Fetch DNS static entries
  const entriesQuery = useDNSStaticEntries(deviceId);

  // Parse settings if available
  const parsedSettings = useMemo(() => {
    if (!settingsQuery.data?.device?.dnsSettings) {
      return null;
    }

    return parseDNSSettings(settingsQuery.data.device.dnsSettings);
  }, [settingsQuery.data]);

  // Extract entries
  const entries = useMemo(() => {
    return entriesQuery.data?.device?.dnsStaticEntries || [];
  }, [entriesQuery.data]);

  // Combined loading state
  const isLoading = settingsQuery.loading || entriesQuery.loading;

  // Get first error (if any)
  const error = settingsQuery.error || entriesQuery.error || null;

  // Refetch both queries (stable reference with useCallback)
  const refetch = useCallback(() => {
    settingsQuery.refetch?.();
    entriesQuery.refetch?.();
  }, [settingsQuery, entriesQuery]);

  return {
    settings: parsedSettings,
    entries,
    isLoading,
    isSettingsLoading: settingsQuery.loading,
    isEntriesLoading: entriesQuery.loading,
    error,
    refetch,
  };
}
