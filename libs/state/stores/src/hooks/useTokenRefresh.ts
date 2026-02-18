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

import { useEffect, useRef, useCallback } from 'react';

import { useAuthStore } from '../auth/auth.store';
import { useNotificationStore } from '../ui/notification.store';

// ===== Constants =====

/**
 * Interval for checking token expiry (1 minute)
 */
const REFRESH_CHECK_INTERVAL_MS = 60_000;

/**
 * Maximum refresh attempts before showing re-auth prompt
 */
const MAX_REFRESH_ATTEMPTS = 3;

// ===== Types =====

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

// ===== Hook Implementation =====

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
export function useTokenRefresh(options: UseTokenRefreshOptions): void {
  const {
    refreshTokenFn,
    onReauthRequired,
    showNotifications = true,
    checkInterval = REFRESH_CHECK_INTERVAL_MS,
  } = options;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCheckingRef = useRef(false);

  // Get store selectors
  const isTokenExpiringSoon = useAuthStore((state) => state.isTokenExpiringSoon);
  const shouldAttemptRefresh = useAuthStore((state) => state.shouldAttemptRefresh);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Get store actions (stable references)
  const setRefreshing = useAuthStore((state) => state.setRefreshing);
  const setAuth = useAuthStore((state) => state.setAuth);
  const incrementRefreshAttempts = useAuthStore((state) => state.incrementRefreshAttempts);
  const resetRefreshAttempts = useAuthStore((state) => state.resetRefreshAttempts);

  // Get user and refresh token from store
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  // Notification actions
  const addNotification = useNotificationStore((state) => state.addNotification);

  /**
   * Perform token refresh check and refresh if needed
   */
  const checkAndRefresh = useCallback(async () => {
    // Prevent concurrent checks
    if (isCheckingRef.current) return;

    // Skip if not authenticated
    if (!isAuthenticated) return;

    // Check if refresh is needed
    if (!isTokenExpiringSoon() || !shouldAttemptRefresh()) return;

    isCheckingRef.current = true;
    setRefreshing(true);
    incrementRefreshAttempts();

    try {
      const result = await refreshTokenFn();

      // Update auth state with new token
      if (user) {
        setAuth(
          result.token,
          user,
          result.expiresAt,
          result.refreshToken ?? refreshToken ?? undefined
        );
      }

      // Reset refresh attempts on success
      resetRefreshAttempts();
    } catch (error) {
      // Check if max attempts exceeded
      const attempts = useAuthStore.getState().refreshAttempts;

      if (attempts >= MAX_REFRESH_ATTEMPTS) {
        // Show notification if enabled
        if (showNotifications) {
          addNotification({
            type: 'error',
            title: 'Session expiring',
            message: 'Your session is about to expire. Please log in again.',
          });
        }

        // Call re-auth callback
        onReauthRequired?.();
      }

      // Log error in development
      if (import.meta.env?.DEV) {
        console.error('[useTokenRefresh] Refresh failed:', error);
      }
    } finally {
      setRefreshing(false);
      isCheckingRef.current = false;
    }
  }, [
    isAuthenticated,
    isTokenExpiringSoon,
    shouldAttemptRefresh,
    setRefreshing,
    incrementRefreshAttempts,
    refreshTokenFn,
    user,
    refreshToken,
    setAuth,
    resetRefreshAttempts,
    showNotifications,
    addNotification,
    onReauthRequired,
  ]);

  // Set up interval for checking token expiry
  useEffect(() => {
    // Check immediately on mount
    checkAndRefresh();

    // Set up periodic check
    intervalRef.current = setInterval(checkAndRefresh, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkAndRefresh, checkInterval]);
}

// ===== Utility Functions =====

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
export function createMutationRefreshFn(
  mutation: () => Promise<{ token: string; expiresAt: string; refreshToken?: string }>
): TokenRefreshFn {
  return async () => {
    const result = await mutation();
    return {
      token: result.token,
      expiresAt: new Date(result.expiresAt),
      refreshToken: result.refreshToken,
    };
  };
}

// ===== Type Exports =====

// Types are already exported inline above
