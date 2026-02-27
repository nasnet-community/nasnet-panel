/**
 * React Query hooks for alert escalations (NAS-18.9)
 * @module useAlertEscalations
 */
export interface AlertEscalation {
  id: string;
  alertId: string;
  ruleId: string;
  currentLevel: number;
  maxLevel: number;
  status: 'PENDING' | 'RESOLVED' | 'MAX_REACHED';
  nextEscalationAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}
export interface UseAlertEscalationsOptions {
  status?: 'PENDING' | 'RESOLVED' | 'MAX_REACHED';
  limit?: number;
  offset?: number;
  pollInterval?: number;
}
/**
 * Hook to fetch alert escalations with optional filtering
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useAlertEscalations({
 *   status: 'PENDING',
 *   limit: 10,
 *   pollInterval: 30000 // Poll every 30 seconds
 * });
 * ```
 */
export declare function useAlertEscalations(
  options?: UseAlertEscalationsOptions
): import('@apollo/client').InteropQueryResult<any, import('@apollo/client').OperationVariables>;
/**
 * Hook to fetch a single alert with its escalation status
 *
 * @example
 * ```tsx
 * const { data, loading } = useAlertWithEscalation('alert-123');
 *
 * if (data?.alert?.escalation) {
 *   console.log(`Alert at level ${data.alert.escalation.currentLevel}`);
 * }
 * ```
 */
export declare function useAlertWithEscalation(
  alertId: string
): import('@apollo/client').InteropQueryResult<any, import('@apollo/client').OperationVariables>;
/**
 * Hook to poll for active escalations (auto-refreshing)
 *
 * @example
 * ```tsx
 * const { data, loading } = useActiveEscalations(15000); // Poll every 15s
 * ```
 */
export declare function useActiveEscalations(
  pollInterval?: number
): import('@apollo/client').InteropQueryResult<any, import('@apollo/client').OperationVariables>;
//# sourceMappingURL=useAlertEscalations.d.ts.map
