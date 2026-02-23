/**
 * TanStack Query hook for fetching IP services
 * Used to determine which protocols (API, SSH, Telnet) are enabled
 * Uses rosproxy backend for RouterOS API communication
 */
import { UseQueryResult } from '@tanstack/react-query';
/**
 * IP Service entry from RouterOS
 */
export interface IPService {
    /**
     * Unique identifier
     */
    id: string;
    /**
     * Service name (api, api-ssl, ssh, telnet, ftp, www, www-ssl, winbox)
     */
    name: string;
    /**
     * Port number the service runs on
     */
    port: number;
    /**
     * Whether the service is disabled
     */
    disabled: boolean;
    /**
     * Allowed addresses (can be empty for all)
     */
    address?: string;
    /**
     * Certificate name (for SSL services)
     */
    certificate?: string;
    /**
     * VRF name
     */
    vrf?: string;
}
/**
 * Supported protocols for batch job execution
 */
export type ExecutionProtocol = 'api' | 'ssh' | 'telnet';
/**
 * React Query hook for IP services
 *
 * @param routerIp - Target router IP address
 * @returns Query result with IP services list
 *
 * @example
 * ```tsx
 * function ProtocolSelector() {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { data: services, isLoading } = useIPServices(routerIp || '');
 *
 *   // Check which protocols are enabled
 *   const apiEnabled = services?.some(s => s.name === 'api' && !s.disabled);
 *   const sshEnabled = services?.some(s => s.name === 'ssh' && !s.disabled);
 *   const telnetEnabled = services?.some(s => s.name === 'telnet' && !s.disabled);
 * }
 * ```
 */
export declare function useIPServices(routerIp: string): UseQueryResult<IPService[], Error>;
/**
 * Helper hook to check if specific protocols are enabled
 *
 * @param routerIp - Target router IP address
 * @returns Object with enabled status for each protocol
 *
 * @example
 * ```tsx
 * const { api, ssh, telnet, isLoading } = useEnabledProtocols(routerIp);
 * ```
 */
export declare function useEnabledProtocols(routerIp: string): {
    api: boolean;
    ssh: boolean;
    telnet: boolean;
    isLoading: boolean;
    error: Error | null;
};
//# sourceMappingURL=useIPServices.d.ts.map