/**
 * User profile information
 */
export interface User {
    /**
     * Unique user identifier
     */
    id: string;
    /**
     * Username for display
     */
    username: string;
    /**
     * Email address (optional)
     */
    email: string | null;
    /**
     * User permissions array
     */
    permissions: string[];
}
/**
 * Auth state interface
 */
export interface AuthState {
    /**
     * JWT access token (null if not authenticated)
     */
    token: string | null;
    /**
     * Token expiration timestamp
     */
    tokenExpiry: Date | null;
    /**
     * Refresh token for obtaining new access tokens
     */
    refreshToken: string | null;
    /**
     * Current user profile (null if not authenticated)
     */
    user: User | null;
    /**
     * Whether user is currently authenticated
     */
    isAuthenticated: boolean;
    /**
     * Whether a token refresh is in progress
     */
    isRefreshing: boolean;
    /**
     * Number of refresh attempts (max 3)
     */
    refreshAttempts: number;
    /**
     * Timestamp of last user activity
     */
    lastActivity: Date | null;
}
/**
 * Auth actions interface
 */
export interface AuthActions {
    /**
     * Set authentication state after successful login
     *
     * @param token - JWT access token
     * @param user - User profile
     * @param expiresAt - Token expiration timestamp
     * @param refreshToken - Optional refresh token
     */
    setAuth: (token: string, user: User, expiresAt: Date, refreshToken?: string) => void;
    /**
     * Clear all authentication state (logout)
     */
    clearAuth: () => void;
    /**
     * Set refreshing state
     *
     * @param isRefreshing - Whether refresh is in progress
     */
    setRefreshing: (isRefreshing: boolean) => void;
    /**
     * Increment refresh attempt counter
     */
    incrementRefreshAttempts: () => void;
    /**
     * Reset refresh attempt counter
     */
    resetRefreshAttempts: () => void;
    /**
     * Update last activity timestamp
     */
    updateLastActivity: () => void;
    /**
     * Check if token is expiring within 5 minutes
     *
     * @returns true if token expires within 5 minutes
     */
    isTokenExpiringSoon: () => boolean;
    /**
     * Get milliseconds until token expiry
     *
     * @returns Milliseconds until expiry, or null if no token
     */
    getTimeUntilExpiry: () => number | null;
    /**
     * Check if refresh should be attempted
     *
     * @returns true if refresh should be attempted
     */
    shouldAttemptRefresh: () => boolean;
}
/**
 * Zustand store for authentication state management.
 *
 * Usage with selectors (CRITICAL for performance):
 *
 * ```tsx
 * // ✅ GOOD: Only re-renders when isAuthenticated changes
 * const isAuthenticated = useAuthStore(state => state.isAuthenticated);
 *
 * // ✅ GOOD: Select multiple fields with shallow comparison
 * import { shallow } from 'zustand/shallow';
 * const { user, token } = useAuthStore(
 *   state => ({ user: state.user, token: state.token }),
 *   shallow
 * );
 *
 * // ❌ BAD: Re-renders on ANY store change
 * const { user, token, isRefreshing } = useAuthStore();
 * ```
 *
 * Token Refresh Flow:
 * 1. useTokenRefresh hook checks isTokenExpiringSoon() every minute
 * 2. If true and shouldAttemptRefresh(), starts refresh
 * 3. On success: setAuth() with new token, resetRefreshAttempts()
 * 4. On failure: incrementRefreshAttempts()
 * 5. After MAX_REFRESH_ATTEMPTS: Show SessionExpiringDialog
 *
 * Persistence:
 * - token, tokenExpiry, refreshToken, user, isAuthenticated persisted
 * - isRefreshing, refreshAttempts NOT persisted (reset on reload)
 * - Date objects properly serialized/deserialized
 *
 * DevTools:
 * - Integrated with Redux DevTools (store name: 'auth-store')
 */
export declare const useAuthStore: import("zustand").UseBoundStore<Omit<Omit<import("zustand").StoreApi<AuthState & AuthActions>, "setState"> & {
    setState<A extends string | {
        type: string;
    }>(partial: (AuthState & AuthActions) | Partial<AuthState & AuthActions> | ((state: AuthState & AuthActions) => (AuthState & AuthActions) | Partial<AuthState & AuthActions>), replace?: boolean | undefined, action?: A | undefined): void;
}, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AuthState & AuthActions, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AuthState & AuthActions) => void) => () => void;
        onFinishHydration: (fn: (state: AuthState & AuthActions) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AuthState & AuthActions, unknown>>;
    };
}>;
/**
 * Select whether user is authenticated
 */
export declare const selectIsAuthenticated: (state: AuthState) => boolean;
/**
 * Select current user
 */
export declare const selectUser: (state: AuthState) => User | null;
/**
 * Select current token
 */
export declare const selectToken: (state: AuthState) => string | null;
/**
 * Select whether token refresh is in progress
 */
export declare const selectIsRefreshing: (state: AuthState) => boolean;
/**
 * Select refresh attempts count
 */
export declare const selectRefreshAttempts: (state: AuthState) => number;
/**
 * Select whether max refresh attempts exceeded
 */
export declare const selectMaxRefreshExceeded: (state: AuthState) => boolean;
/**
 * Select user permissions
 */
export declare const selectPermissions: (state: AuthState) => string[];
/**
 * Check if user has a specific permission
 */
export declare const selectHasPermission: (permission: string) => (state: AuthState) => boolean;
/**
 * Get auth store state outside of React
 */
export declare const getAuthState: () => AuthState & AuthActions;
/**
 * Subscribe to auth store changes outside of React
 */
export declare const subscribeAuthState: (listener: (state: AuthState & AuthActions, prevState: AuthState & AuthActions) => void) => () => void;
/**
 * Check if user is authenticated (for use outside React)
 */
export declare function isAuthenticated(): boolean;
/**
 * Get current auth token (for use outside React)
 */
export declare function getAuthToken(): string | null;
//# sourceMappingURL=auth.store.d.ts.map