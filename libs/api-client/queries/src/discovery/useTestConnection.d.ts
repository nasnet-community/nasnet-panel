/**
 * Test Connection Hook
 * React Query hook for validating router credentials (Story 0-1-4)
 */
import { UseMutationResult } from '@tanstack/react-query';
import type { RouterCredentials } from '@nasnet/core/types';
import { type CredentialValidationResult } from '@nasnet/features/router-discovery';
/**
 * Input for connection test mutation
 */
export interface TestConnectionInput {
    /**
     * Router IP address to test
     */
    ipAddress: string;
    /**
     * Credentials to validate
     */
    credentials: RouterCredentials;
}
/**
 * React Query mutation hook for testing router connections
 *
 * Validates credentials by attempting to connect to the router
 * and retrieve system information.
 *
 * @returns Mutation result with validation status and router info
 *
 * @example
 * ```tsx
 * function RouterLogin({ routerIp }: { routerIp: string }) {
 *   const testConnection = useTestConnection();
 *
 *   const handleSubmit = (credentials: RouterCredentials) => {
 *     testConnection.mutate(
 *       { ipAddress: routerIp, credentials },
 *       {
 *         onSuccess: (result) => {
 *           if (result.isValid) {
 *             console.log("Connected to:", result.routerInfo?.identity);
 *             // Proceed with connection setup
 *           } else {
 *             console.error("Failed:", result.error);
 *           }
 *         },
 *       }
 *     );
 *   };
 *
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault();
 *       const formData = new FormData(e.currentTarget);
 *       handleSubmit({
 *         username: formData.get('username') as string,
 *         password: formData.get('password') as string,
 *       });
 *     }}>
 *       <input name="username" placeholder="Username" />
 *       <input name="password" type="password" placeholder="Password" />
 *       <button type="submit" disabled={testConnection.isPending}>
 *         {testConnection.isPending ? 'Testing...' : 'Connect'}
 *       </button>
 *       {testConnection.isError && (
 *         <p>Error: {testConnection.error.message}</p>
 *       )}
 *     </form>
 *   );
 * }
 * ```
 */
export declare function useTestConnection(): UseMutationResult<CredentialValidationResult, Error, TestConnectionInput>;
/**
 * Query key factory for connection-related queries
 */
export declare const connectionKeys: {
    readonly all: readonly ["connection"];
    readonly test: (ip: string) => readonly ["connection", "test", string];
};
//# sourceMappingURL=useTestConnection.d.ts.map