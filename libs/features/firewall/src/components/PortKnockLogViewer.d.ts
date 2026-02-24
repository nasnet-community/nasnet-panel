/**
 * Port Knock Log Viewer Component
 * @description Displays port knock attempt log with filtering and export
 *
 * Features:
 * - Infinite scroll pagination
 * - Filter by status (all/success/failed/partial) and IP address
 * - Status badges with semantic colors
 * - "Block IP" action for failed attempts
 * - Export to CSV
 * - Auto-refresh toggle
 * - Professional error and empty states
 */
export interface PortKnockLogViewerProps {
    className?: string;
}
/**
 * PortKnockLogViewer Component
 * @description Displays and manages port knock attempt logs with filtering
 *
 * @example
 * ```tsx
 * <PortKnockLogViewer />
 * ```
 */
export declare const PortKnockLogViewer: {
    ({ className }: PortKnockLogViewerProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
//# sourceMappingURL=PortKnockLogViewer.d.ts.map