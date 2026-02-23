/**
 * Bridge STP Status Component - Real-time spanning tree monitoring
 * Features:
 * - Bridge-level STP info (root bridge, topology changes)
 * - Per-port STP table (role, state, cost, edge)
 * - Real-time updates via GraphQL subscription
 *
 * @description Shows real-time spanning tree protocol status including root bridge ID,
 * path cost, and per-port role/state information.
 *
 * @param bridgeId - Bridge UUID
 * @param className - Optional CSS class for styling
 */
export interface BridgeStpStatusProps {
    bridgeId: string;
    className?: string;
}
declare function BridgeStpStatusComponent({ bridgeId, className }: BridgeStpStatusProps): import("react/jsx-runtime").JSX.Element;
declare namespace BridgeStpStatusComponent {
    var displayName: string;
}
export declare const BridgeStpStatus: import("react").MemoExoticComponent<typeof BridgeStpStatusComponent>;
export {};
//# sourceMappingURL=BridgeStpStatus.d.ts.map