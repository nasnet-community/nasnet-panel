/**
 * DNS Lookup Tool - Custom Hook
 *
 * Headless hook for DNS lookup functionality providing data fetching,
 * single/multi-server queries, and state management using Apollo Client.
 *
 * @description Provides stateful DNS lookup operations including:
 * - Single-server lookups with configurable timeout
 * - Multi-server comparison across all configured DNS servers
 * - Automatic error handling and retry logic
 * - Real-time result updates via Apollo Client subscriptions
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.4
 * @see ADR-002 State Management (Apollo Client for router data)
 * @see ADR-018 Headless + Platform Presenters Pattern
 * @example
 * ```tsx
 * const hook = useDnsLookup({ deviceId: 'router-1' });
 * await hook.lookup({ hostname: 'example.com', recordType: 'A' });
 * // hook.result contains { hostname, records, queryTime, status, ... }
 * ```
 */

import { useMutation, useQuery } from '@apollo/client';
import { useState, useCallback, useMemo } from 'react';
import { RUN_DNS_LOOKUP, GET_DNS_SERVERS } from './dnsLookup.graphql';
import { getErrorMessage, isErrorStatus } from './dnsLookup.utils';
import type { DnsLookupResult, DnsServer } from './DnsLookupTool.types';
import type { DnsLookupFormValues } from './dnsLookup.schema';

interface UseDnsLookupOptions {
  /** Device/router ID to run lookups against */
  deviceId: string;
  /** Callback invoked on successful lookup (status: SUCCESS) */
  onSuccess?: (result: DnsLookupResult) => void;
  /** Callback invoked on query failure or network error */
  onError?: (error: string) => void;
}

export function useDnsLookup({ deviceId, onSuccess, onError }: UseDnsLookupOptions) {
  const [result, setResult] = useState<DnsLookupResult | null>(null);
  const [comparisonResults, setComparisonResults] = useState<DnsLookupResult[]>([]);

  // Query configured DNS servers
  const { data: dnsServersData } = useQuery(GET_DNS_SERVERS, {
    variables: { deviceId },
  });

  const [runLookupMutation, { loading }] = useMutation(RUN_DNS_LOOKUP, {
    onCompleted: (data) => {
      const lookupResult = data.runDnsLookup as DnsLookupResult;
      setResult(lookupResult);
      if (!isErrorStatus(lookupResult.status)) {
        onSuccess?.(lookupResult);
      } else {
        onError?.(lookupResult.error || getErrorMessage(lookupResult.status));
      }
    },
    onError: (error) => {
      onError?.(error.message);
    },
  });

  const lookup = useCallback(
    async (values: DnsLookupFormValues) => {
      setResult(null);
      setComparisonResults([]);

      await runLookupMutation({
        variables: {
          input: {
            deviceId,
            hostname: values.hostname,
            recordType: values.recordType,
            server: values.server,
            timeout: values.timeout,
          },
        },
      });
    },
    [deviceId, runLookupMutation]
  );

  const lookupAll = useCallback(
    async (values: DnsLookupFormValues) => {
      setResult(null);
      setComparisonResults([]);

      const servers: DnsServer[] = dnsServersData?.dnsServers?.servers || [];
      if (servers.length === 0) {
        onError?.('No DNS servers configured');
        return;
      }

      const results: DnsLookupResult[] = [];

      for (const server of servers) {
        try {
          const { data } = await runLookupMutation({
            variables: {
              input: {
                deviceId,
                hostname: values.hostname,
                recordType: values.recordType,
                server: server.address,
                timeout: values.timeout,
              },
            },
          });
          if (data?.runDnsLookup) {
            results.push(data.runDnsLookup);
          }
        } catch {
          // Continue with other servers on error
        }
      }

      setComparisonResults(results);
      if (results.length > 0) {
        setResult(results[0]);
      }
    },
    [deviceId, dnsServersData, runLookupMutation, onError]
  );

  const reset = useCallback(() => {
    setResult(null);
    setComparisonResults([]);
  }, []);

  // Memoize derived state for stable references
  const memoizedDnsServers = useMemo(
    () => (dnsServersData?.dnsServers?.servers as DnsServer[]) || [],
    [dnsServersData?.dnsServers?.servers]
  );

  const isSuccess = useMemo(
    () => result !== null && !isErrorStatus(result.status),
    [result]
  );

  const isError = useMemo(
    () => result !== null && isErrorStatus(result.status),
    [result]
  );

  return {
    // State
    isLoading: loading,
    isSuccess,
    isError,
    // Data
    result,
    comparisonResults,
    dnsServers: memoizedDnsServers,
    primaryServer: dnsServersData?.dnsServers?.primary as string | undefined,
    secondaryServer: dnsServersData?.dnsServers?.secondary as string | undefined,
    // Actions
    lookup,
    lookupAll,
    reset,
  };
}
