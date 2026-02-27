/**
 * Token Refresh Hook
 *
 * Proactively refreshes JWT tokens before expiry to maintain user sessions.
 * Checks token expiry every minute and attempts refresh 5 minutes before expiration.
 *
 * Features:
 * - Automatic refresh at 5 minutes before expiry
 * - Retry logic with max 3 attempts
 * - Integration with notification store for error feedback
 * - Proper cleanup on unmount
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 */
/**
 * Token refresh result from the refresh function
 */
export interface TokenRefreshResult {
  /**
   * New access token
   */
  token: string;
  /**
   * New token expiration time
   */
  expiresAt: Date;
  /**
   * Optional new refresh token
   */
  refreshToken?: string;
}
/**
 * Callback to perform the actual token refresh
 */
export type TokenRefreshFn = () => Promise<TokenRefreshResult>;
/**
 * Options for useTokenRefresh hook
 */
export interface UseTokenRefreshOptions {
  /**
   * Callback to perform the actual token refresh
   */
  refreshTokenFn: TokenRefreshFn;
  /**
   * Callback when re-authentication is required
   * Called after max refresh attempts exceeded
   */
  onReauthRequired?: () => void;
  /**
   * Whether to show notifications (default: true)
   */
  showNotifications?: boolean;
  /**
   * Check interval in milliseconds (default: 60000)
   */
  checkInterval?: number;
}
/**
 * Hook for proactive JWT token refresh.
 *
 * Monitors token expiry and automatically refreshes tokens 5 minutes
 * before they expire. If refresh fails after 3 attempts, calls
 * onReauthRequired callback.
 *
 * Usage:
 * ```tsx
 * function AuthProvider({ children }) {
 *   useTokenRefresh({
 *     refreshTokenFn: async () => {
 *       const response = await api.post('/auth/refresh');
 *       return {
 *         token: response.data.token,
 *         expiresAt: new Date(response.data.expiresAt),
 *       };
 *     },
 *     onReauthRequired: () => {
 *       navigate('/login');
 *     },
 *   });
 *
 *   return children;
 * }
 * ```
 *
 * @param options - Token refresh configuration
 */
export declare function useTokenRefresh(options: UseTokenRefreshOptions): void;
/**
 * Create a token refresh function for Apollo Client.
 *
 * This can be used with useTokenRefresh when using Apollo Client:
 *
 * ```tsx
 * const refreshTokenFn = createApolloRefreshFn(apolloClient);
 * useTokenRefresh({ refreshTokenFn });
 * ```
 *
 * @param mutation - GraphQL mutation function
 * @returns Token refresh function
 */
export declare function createMutationRefreshFn(
  mutation: () => Promise<{
    token: string;
    expiresAt: string;
    refreshToken?: string;
  }>
): TokenRefreshFn;
//# sourceMappingURL=useTokenRefresh.d.ts.map
