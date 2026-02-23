/**
 * Router Status Headless Hook
 *
 * Provides all logic and state for router status display.
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 * @see Docs/architecture/adrs/018-headless-platform-presenters.md
 */
import { type ConnectionStatus, type UseRouterStatusReturn } from './types';
export interface UseRouterStatusConfig {
    /**
     * Router ID to subscribe to
     */
    routerId: string;
    /**
     * Callback fired when status changes
     */
    onStatusChange?: (status: ConnectionStatus) => void;
    /**
     * Maximum reconnection attempts before requiring manual retry
     * @default 5
     */
    maxReconnectAttempts?: number;
}
/**
 * Headless hook for router status state.
 *
 * Provides all the logic and derived state needed by presenters.
 * Does not render anything - that's the presenter's job.
 *
 * @param config - Hook configuration
 * @returns Router status state object
 *
 * @example
 * ```tsx
 * function RouterStatusMobile({ routerId }: { routerId: string }) {
 *   const state = useRouterStatus({ routerId });
 *
 *   return (
 *     <div className={state.isOnline ? 'text-success' : 'text-muted-foreground'}>
 *       {state.statusLabel}
 *       {state.data.status === 'CONNECTING' && (
 *         <span>Attempt {state.data.reconnectAttempt} of {state.data.maxReconnectAttempts}</span>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useRouterStatus(config: UseRouterStatusConfig): UseRouterStatusReturn;
//# sourceMappingURL=use-router-status.d.ts.map