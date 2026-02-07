/**
 * DNS Lookup Tool - Custom Hook
 *
 * Headless hook for DNS lookup functionality providing data fetching,
 * single/multi-server queries, and state management using Apollo Client.
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.4
 * @see ADR-002 State Management (Apollo Client for router data)
 * @see ADR-018 Headless + Platform Presenters Pattern
 */

import { useMutation, useQuery } from '@apollo/client';
import { useState, useCallback } from 'react';
import { RUN_DNS_LOOKUP, GET_DNS_SERVERS } from './dnsLookup.graphql';
import { getErrorMessage, isErrorStatus } from './dnsLookup.utils';
import type { DnsLookupResult, DnsServer } from './DnsLookupTool.types';
import type { DnsLookupFormValues } from './dnsLookup.schema';

interface UseDnsLookupOptions {
  deviceId: string;
  onSuccess?: (result: DnsLookupResult) => void;
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

  return {
    // State
    isLoading: loading,
    isSuccess: result !== null && !isErrorStatus(result.status),
    isError: result !== null && isErrorStatus(result.status),
    // Data
    result,
    comparisonResults,
    dnsServers: (dnsServersData?.dnsServers?.servers as DnsServer[]) || [],
    primaryServer: dnsServersData?.dnsServers?.primary as string | undefined,
    secondaryServer: dnsServersData?.dnsServers?.secondary as string | undefined,
    // Actions
    lookup,
    lookupAll,
    reset,
  };
}
