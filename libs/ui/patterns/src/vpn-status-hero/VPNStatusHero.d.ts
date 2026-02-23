/**
 * VPN Status Hero Component
 *
 * Large status card showing overall VPN health.
 * Based on UX Design - Direction 5: Status Hero.
 *
 * @example
 * ```tsx
 * <VPNStatusHero
 *   status="healthy"
 *   totalServers={3}
 *   totalClients={5}
 *   activeServerConnections={2}
 *   activeClientConnections={4}
 *   totalRx={1024000}
 *   totalTx={512000}
 * />
 * ```
 */
export type VPNHealthStatus = 'healthy' | 'warning' | 'critical' | 'loading';
export interface VPNStatusHeroProps {
    /** Overall VPN health status */
    status: VPNHealthStatus;
    /** Total server count */
    totalServers: number;
    /** Total client count */
    totalClients: number;
    /** Active server connections */
    activeServerConnections: number;
    /** Active client connections */
    activeClientConnections: number;
    /** Total bytes received */
    totalRx: number;
    /** Total bytes transmitted */
    totalTx: number;
    /** Number of warnings/issues */
    issueCount?: number;
    /** Custom className */
    className?: string;
}
export declare const VPNStatusHero: import("react").MemoExoticComponent<import("react").ForwardRefExoticComponent<VPNStatusHeroProps & import("react").RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=VPNStatusHero.d.ts.map