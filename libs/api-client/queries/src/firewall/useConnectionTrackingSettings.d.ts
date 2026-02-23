/**
 * TanStack Query hook for fetching connection tracking settings
 * NAS-7.4: Connection Tracking - Settings Query Layer
 * Uses rosproxy backend for RouterOS API communication
 *
 * Endpoint: GET /rest/ip/firewall/connection/tracking
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { ConnectionTrackingSettings } from '@nasnet/core/types';
export interface UseConnectionTrackingSettingsOptions {
    /**
     * Target router IP address
     */
    routerIp: string;
    /**
     * Skip query execution if true
     */
    enabled?: boolean;
}
/**
 * React Query hook for connection tracking settings
 *
 * Fetches the global connection tracking configuration including:
 * - Whether tracking is enabled
 * - Maximum connection table size
 * - Timeout values for different protocols and states
 * - Loose tracking mode
 *
 * @param options - Hook configuration options
 * @returns Query result with connection tracking settings
 *
 * @example
 * ```tsx
 * function ConnectionTrackingSettings() {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { data: settings, isLoading } = useConnectionTrackingSettings({
 *     routerIp: routerIp || '',
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <Card>
 *       <CardHeader>Connection Tracking</CardHeader>
 *       <CardContent>
 *         <div>Status: {settings?.enabled ? 'Enabled' : 'Disabled'}</div>
 *         <div>Max Entries: {settings?.maxEntries.toLocaleString()}</div>
 *         <div>TCP Established Timeout: {settings?.tcpEstablishedTimeout}s</div>
 *         <div>UDP Timeout: {settings?.udpTimeout}s</div>
 *       </CardContent>
 *     </Card>
 *   );
 * }
 * ```
 */
export declare function useConnectionTrackingSettings({ routerIp, enabled, }: UseConnectionTrackingSettingsOptions): UseQueryResult<ConnectionTrackingSettings, Error>;
//# sourceMappingURL=useConnectionTrackingSettings.d.ts.map