import type { BridgePort } from '@nasnet/api-client/generated';
export interface StpPortTableProps {
    ports: BridgePort[];
    className?: string;
}
/**
 * STP Port Table - Shows per-port spanning tree status
 * Displays: Interface name, Role, State, Path cost, Edge flag
 *
 * @description Renders a table showing per-port STP metrics including role, state,
 * path cost, and edge port status. Technical values (path cost) use monospace font.
 */
declare function StpPortTableComponent({ ports, className }: StpPortTableProps): import("react/jsx-runtime").JSX.Element;
declare namespace StpPortTableComponent {
    var displayName: string;
}
export declare const StpPortTable: import("react").MemoExoticComponent<typeof StpPortTableComponent>;
export {};
//# sourceMappingURL=StpPortTable.d.ts.map