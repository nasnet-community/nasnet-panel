/**
 * Routing Table Component
 * @description Displays router's routing table entries with sorting
 *
 * Features:
 * - Sortable columns (destination, gateway, interface, distance, type, active)
 * - Active routes highlighted (bold + green background)
 * - Dynamic routes marked with badge
 * - Route type badges (unicast, blackhole, unreachable, prohibit)
 * - Default route (0.0.0.0/0 or ::/0) marked with border
 * - Technical IP/gateway data in font-mono
 * - Disabled routes styling (opacity + line-through)
 */
export interface RoutingTableProps {
    /** Optional className for styling */
    className?: string;
}
/**
 * RoutingTable Component
 * @description Displays router's routing table with sortable columns
 *
 * @example
 * ```tsx
 * <RoutingTable />
 * ```
 */
export declare const RoutingTable: {
    ({ className }: RoutingTableProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
//# sourceMappingURL=RoutingTable.d.ts.map