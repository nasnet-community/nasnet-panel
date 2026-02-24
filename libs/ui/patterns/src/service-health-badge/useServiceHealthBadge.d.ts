import type { ServiceInstanceHealth, InstanceHealthState, HealthConnectionState } from '@nasnet/api-client/generated/types';
import type { RuntimeState } from '@nasnet/core/types';
/**
 * Maps GraphQL InstanceHealthState to UI RuntimeState
 */
export declare function mapHealthStateToRuntimeState(state: InstanceHealthState): RuntimeState['health'];
/**
 * Gets latency color based on value
 */
export declare function getLatencyColor(latencyMs?: number | null): 'success' | 'warning' | 'error';
/**
 * Formats uptime duration for display
 */
export declare function formatUptime(uptimeSeconds?: number | null): string;
/**
 * Formats last healthy timestamp for display
 */
export declare function formatLastHealthy(lastHealthy?: Date | string | null): string;
/**
 * Headless hook for service health badge logic
 *
 * Maps GraphQL health data to UI-friendly format and provides
 * computed values for display.
 *
 * @param health - Health status from GraphQL
 * @returns Computed UI state
 */
export declare function useServiceHealthBadge(health?: ServiceInstanceHealth | null): {
    healthState: RuntimeState["health"];
    showWarning: boolean;
    latencyColor: "success";
    formattedUptime: string;
    formattedLastHealthy: string;
    hasFailures: boolean;
    isProcessAlive: boolean;
    isConnected: boolean;
    raw?: undefined;
} | {
    healthState: import("@nasnet/core/types").RuntimeHealth;
    showWarning: boolean;
    latencyColor: "success" | "error" | "warning";
    formattedUptime: string;
    formattedLastHealthy: string;
    hasFailures: boolean;
    isProcessAlive: boolean;
    isConnected: boolean;
    raw: {
        status: InstanceHealthState;
        latencyMs: import("@nasnet/api-client/generated/types").Maybe<number>;
        consecutiveFails: number;
        connectionStatus: HealthConnectionState;
    };
};
//# sourceMappingURL=useServiceHealthBadge.d.ts.map