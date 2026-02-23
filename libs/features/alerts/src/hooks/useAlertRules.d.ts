import type { AlertRuleFormData } from '../schemas/alert-rule.schema';
/**
 * Hook to fetch all alert rules.
 *
 * @description Fetches all alert rules for an optional device, using
 * cache-and-network policy for fresh data on every load.
 *
 * @param deviceId - Optional device ID to filter rules
 * @returns Apollo query result with alert rules array
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useAlertRules(routerId);
 * ```
 */
export declare function useAlertRules(deviceId?: string): import("@apollo/client").InteropQueryResult<any, import("@apollo/client").OperationVariables>;
/**
 * Hook to fetch a single alert rule by ID.
 *
 * @description Fetches a specific alert rule. Query is skipped if ID is not provided.
 *
 * @param id - Alert rule ID (skips query if falsy)
 * @returns Apollo query result with single alert rule
 *
 * @example
 * ```tsx
 * const { data, loading } = useAlertRule(selectedRuleId);
 * ```
 */
export declare function useAlertRule(id: string): import("@apollo/client").InteropQueryResult<any, import("@apollo/client").OperationVariables>;
/**
 * Hook to create an alert rule.
 *
 * @description Provides mutation function to create a new alert rule.
 * Automatically refetches all alert rules after successful creation.
 *
 * @returns Object with createRule function and mutation result state
 *
 * @example
 * ```tsx
 * const { createRule, loading, error } = useCreateAlertRule();
 * await createRule(formData);
 * ```
 */
export declare function useCreateAlertRule(): {
    data?: any;
    error?: import("@apollo/client").ApolloError;
    loading: boolean;
    called: boolean;
    client: import("@apollo/client").ApolloClient<object>;
    reset: () => void;
    createRule: (input: AlertRuleFormData) => Promise<any>;
};
/**
 * Hook to update an alert rule.
 *
 * @description Provides mutation function to update an existing alert rule.
 * Automatically refetches all alert rules after successful update.
 *
 * @returns Object with updateRule function and mutation result state
 *
 * @example
 * ```tsx
 * const { updateRule, loading, error } = useUpdateAlertRule();
 * await updateRule(ruleId, updatedFormData);
 * ```
 */
export declare function useUpdateAlertRule(): {
    data?: any;
    error?: import("@apollo/client").ApolloError;
    loading: boolean;
    called: boolean;
    client: import("@apollo/client").ApolloClient<object>;
    reset: () => void;
    updateRule: (id: string, input: Partial<AlertRuleFormData>) => Promise<any>;
};
/**
 * Hook to delete an alert rule.
 *
 * @description Provides mutation function to delete an alert rule.
 * Automatically refetches all alert rules after successful deletion.
 *
 * @returns Object with deleteRule function and mutation result state
 *
 * @example
 * ```tsx
 * const { deleteRule, loading, error } = useDeleteAlertRule();
 * await deleteRule(ruleId);
 * ```
 */
export declare function useDeleteAlertRule(): {
    data?: any;
    error?: import("@apollo/client").ApolloError;
    loading: boolean;
    called: boolean;
    client: import("@apollo/client").ApolloClient<object>;
    reset: () => void;
    deleteRule: (id: string) => Promise<any>;
};
//# sourceMappingURL=useAlertRules.d.ts.map