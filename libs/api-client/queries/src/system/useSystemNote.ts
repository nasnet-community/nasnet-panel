/**
 * TanStack Query hook for fetching system note
 * Used to check if router has configuration (for configuration import wizard)
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import { systemKeys } from './queryKeys';

/**
 * System note data returned from RouterOS
 */
export interface SystemNote {
  /**
   * The note content (can be empty string)
   */
  note: string;

  /**
   * Whether to show note at CLI login
   */
  showAtCliLogin: boolean;

  /**
   * Whether to show note at web login
   */
  showAtLogin: boolean;
}

/**
 * RouterOS API response format for system note
 */
interface RouterOSNoteResponse {
  note?: string;
  'show-at-cli-login'?: string;
  'show-at-login'?: string;
}

/**
 * Fetches system note from RouterOS via rosproxy
 * Endpoint: GET /rest/system/note
 */
async function fetchSystemNote(routerIp: string): Promise<SystemNote> {
  const result = await makeRouterOSRequest<RouterOSNoteResponse>(routerIp, 'system/note');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch system note');
  }

  // Transform RouterOS response to our format
  const data = result.data;
  return {
    note: data.note || '',
    showAtCliLogin: data['show-at-cli-login'] === 'true',
    showAtLogin: data['show-at-login'] === 'true',
  };
}

/**
 * React Query hook for system note
 *
 * @param routerIp - Target router IP address
 * @returns Query result with system note data
 *
 * @example
 * ```tsx
 * function ConfigurationCheck() {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { data: noteData, isLoading } = useSystemNote(routerIp || '');
 *
 *   // Check if note is empty (router needs configuration)
 *   const needsConfiguration = noteData && !noteData.note.trim();
 *
 *   if (needsConfiguration) {
 *     return <ConfigurationWizard />;
 *   }
 * }
 * ```
 */
export function useSystemNote(routerIp: string): UseQueryResult<SystemNote, Error> {
  return useQuery({
    queryKey: systemKeys.note(routerIp),
    queryFn: () => fetchSystemNote(routerIp),
    staleTime: 60_000, // 1 minute - note doesn't change often
    retry: 2,
    enabled: !!routerIp,
  });
}
