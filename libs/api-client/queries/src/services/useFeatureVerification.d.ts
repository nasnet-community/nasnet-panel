/**
 * useFeatureVerification Hook
 *
 * Apollo Client hook for querying feature binary verification status.
 * Part of the binary verification security feature.
 *
 * @module @nasnet/api-client/queries/services
 */
import { type QueryHookOptions } from '@apollo/client';
import type { BinaryVerification } from '@nasnet/api-client/generated';
/**
 * GraphQL query for feature verification data
 * Fetches verification data embedded in ServiceInstance
 */
export declare const GET_FEATURE_VERIFICATION: import("graphql").DocumentNode;
/**
 * GraphQL query for all verification statuses on a router
 * Returns only instances with verification enabled
 */
export declare const GET_INSTANCE_VERIFICATION_STATUS: import("graphql").DocumentNode;
/**
 * Variables for GET_FEATURE_VERIFICATION query
 */
export interface GetFeatureVerificationVariables {
    routerID: string;
    instanceID: string;
}
/**
 * Result type for GET_FEATURE_VERIFICATION query
 */
export interface GetFeatureVerificationResult {
    serviceInstance: {
        id: string;
        verification: BinaryVerification | null;
    } | null;
}
/**
 * Variables for GET_INSTANCE_VERIFICATION_STATUS query
 */
export interface GetInstanceVerificationStatusVariables {
    routerID: string;
}
/**
 * Result type for GET_INSTANCE_VERIFICATION_STATUS query
 */
export interface GetInstanceVerificationStatusResult {
    instanceVerificationStatus: BinaryVerification[];
}
/**
 * Hook for querying a single feature's verification status.
 *
 * Uses cache-first policy for fast UI rendering with automatic updates
 * when mutations complete.
 *
 * @param routerID - Router ID
 * @param instanceID - Service instance ID
 * @param options - Apollo query options
 * @returns Query result with verification data
 *
 * @example
 * ```tsx
 * function FeatureCard({ routerID, instanceID }) {
 *   const { data, loading, error, refetch } = useFeatureVerification(routerID, instanceID);
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   const verification = data?.serviceInstance?.verification;
 *
 *   return (
 *     <Card>
 *       <VerificationBadge verification={verification} instanceId={instanceID} />
 *       <Button onClick={() => refetch()}>Refresh</Button>
 *     </Card>
 *   );
 * }
 * ```
 */
export declare function useFeatureVerification(routerID: string, instanceID: string, options?: QueryHookOptions<GetFeatureVerificationResult, GetFeatureVerificationVariables>): import("@apollo/client").InteropQueryResult<GetFeatureVerificationResult, GetFeatureVerificationVariables>;
/**
 * Hook for querying verification status for all instances on a router.
 *
 * Returns only instances with verification enabled.
 * Useful for dashboards and bulk verification views.
 *
 * @param routerID - Router ID
 * @param options - Apollo query options
 * @returns Query result with all verification statuses
 *
 * @example
 * ```tsx
 * function VerificationDashboard({ routerID }) {
 *   const { data, loading } = useInstanceVerificationStatus(routerID);
 *
 *   if (loading) return <Spinner />;
 *
 *   const verifications = data?.instanceVerificationStatus ?? [];
 *   const validCount = verifications.filter(v => v.status === 'VALID').length;
 *
 *   return (
 *     <div>
 *       <h2>Verification Status</h2>
 *       <p>{validCount} / {verifications.length} verified</p>
 *       <VerificationList verifications={verifications} />
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useInstanceVerificationStatus(routerID: string, options?: QueryHookOptions<GetInstanceVerificationStatusResult, GetInstanceVerificationStatusVariables>): import("@apollo/client").InteropQueryResult<GetInstanceVerificationStatusResult, GetInstanceVerificationStatusVariables>;
//# sourceMappingURL=useFeatureVerification.d.ts.map