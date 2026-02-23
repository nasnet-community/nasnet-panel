/**
 * Manual Router Entry Component
 * Allows users to manually add routers by IP address (Story 0-1-2)
 */
export interface ManualRouterEntryProps {
    /**
     * Callback when user submits router information
     */
    onSubmit?: (data: {
        ipAddress: string;
        name?: string;
    }) => void;
    /**
     * Callback when user cancels entry
     */
    onCancel?: () => void;
    /**
     * Optional CSS class name
     */
    className?: string;
}
/**
 * ManualRouterEntry Component
 *
 * @description Provides a form for manually adding routers when auto-discovery
 * is not available or doesn't find the router.
 *
 * Features:
 * - IP address input with validation
 * - Optional router name
 * - Real-time validation feedback
 * - Submit/cancel actions
 *
 * @example
 * ```tsx
 * <ManualRouterEntry
 *   onSubmit={(data) => addRouter(data)}
 *   onCancel={() => setShowForm(false)}
 * />
 * ```
 */
export declare const ManualRouterEntry: import("react").NamedExoticComponent<ManualRouterEntryProps>;
//# sourceMappingURL=ManualRouterEntry.d.ts.map