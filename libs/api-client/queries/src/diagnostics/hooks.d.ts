/**
 * Diagnostics Query Hooks
 * Apollo Client hooks for internet troubleshooting (NAS-5.11)
 */
import type {
  QueryHookOptions,
  MutationHookOptions,
  SubscriptionHookOptions,
} from '@apollo/client';
/**
 * Get a troubleshooting session by ID
 */
export declare function useTroubleshootSession(
  sessionId: string,
  options?: Omit<QueryHookOptions, 'variables'>
): import('@apollo/client').InteropQueryResult<any, import('@apollo/client').OperationVariables>;
/**
 * Detect WAN interface from default route
 */
export declare function useDetectWanInterface(
  routerId: string,
  options?: Omit<QueryHookOptions, 'variables'>
): import('@apollo/client').InteropQueryResult<any, import('@apollo/client').OperationVariables>;
/**
 * Detect default gateway from DHCP client or static route
 */
export declare function useDetectGateway(
  routerId: string,
  options?: Omit<QueryHookOptions, 'variables'>
): import('@apollo/client').InteropQueryResult<any, import('@apollo/client').OperationVariables>;
/**
 * Detect ISP information from WAN IP
 */
export declare function useDetectISP(
  routerId: string,
  options?: Omit<QueryHookOptions, 'variables'>
): import('@apollo/client').InteropQueryResult<any, import('@apollo/client').OperationVariables>;
/**
 * Start a new troubleshooting session
 */
export declare function useStartTroubleshoot(
  options?: MutationHookOptions
): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Run a specific diagnostic step
 */
export declare function useRunTroubleshootStep(
  options?: MutationHookOptions
): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Apply a suggested fix
 */
export declare function useApplyTroubleshootFix(
  options?: MutationHookOptions
): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Verify a fix by re-running the diagnostic step
 */
export declare function useVerifyTroubleshootFix(
  options?: MutationHookOptions
): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Cancel a troubleshooting session
 */
export declare function useCancelTroubleshoot(
  options?: MutationHookOptions
): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Subscribe to troubleshooting session progress
 */
export declare function useTroubleshootProgress(
  sessionId: string,
  options?: Omit<SubscriptionHookOptions, 'variables'>
): {
  restart: () => void;
  loading: boolean;
  data?: any;
  error?: import('@apollo/client').ApolloError;
  variables?: import('@apollo/client').OperationVariables | undefined;
};
//# sourceMappingURL=hooks.d.ts.map
