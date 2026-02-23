/**
 * Connection Tracking Settings Types
 *
 * Import official types from @nasnet/core/types and add form-specific types.
 */
/**
 * Connection tracking settings (matches MikroTik's /ip/firewall/connection/tracking)
 */
export interface ConnectionTrackingSettings {
    enabled: boolean;
    maxEntries: number;
    genericTimeout: number;
    tcpEstablishedTimeout: number;
    tcpTimeWaitTimeout: number;
    tcpCloseTimeout: number;
    tcpSynSentTimeout: number;
    tcpSynReceivedTimeout: number;
    tcpFinWaitTimeout: number;
    tcpCloseWaitTimeout: number;
    tcpLastAckTimeout: number;
    udpTimeout: number;
    udpStreamTimeout: number;
    icmpTimeout: number;
    looseTracking: boolean;
}
/**
 * Form values for connection tracking settings
 * Uses string format for duration inputs
 */
export interface ConnectionTrackingFormValues {
    enabled: boolean;
    maxEntries: string;
    genericTimeout: string;
    tcpEstablishedTimeout: string;
    tcpTimeWaitTimeout: string;
    tcpCloseTimeout: string;
    tcpSynSentTimeout: string;
    tcpSynReceivedTimeout: string;
    tcpFinWaitTimeout: string;
    tcpCloseWaitTimeout: string;
    tcpLastAckTimeout: string;
    udpTimeout: string;
    udpStreamTimeout: string;
    icmpTimeout: string;
    looseTracking: boolean;
}
/**
 * Default connection tracking settings
 */
export declare const DEFAULT_SETTINGS: ConnectionTrackingSettings;
//# sourceMappingURL=types.d.ts.map