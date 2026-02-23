/**
 * Auth Provider Component
 *
 * Authentication context provider that integrates with Zustand auth store.
 * Provides auth state and methods via React context for convenience.
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 * @example
 * ```tsx
 * <AuthProvider
 *   onRefreshToken={async () => ({ accessToken, refreshToken, expiresIn })}
 *   onSessionExpired={() => navigate('/login')}
 * >
 *   <App />
 * </AuthProvider>
 * ```
 */
import { type ReactNode, type ReactElement } from 'react';
export interface User {
    id: string;
    username: string;
    email?: string;
    permissions: string[];
}
export interface AuthContextValue {
    /**
     * Whether the user is authenticated
     */
    isAuthenticated: boolean;
    /**
     * Whether auth state is being loaded/checked
     */
    isLoading: boolean;
    /**
     * Current user (if authenticated)
     */
    user: User | null;
    /**
     * Current access token (if authenticated)
     */
    accessToken: string | null;
    /**
     * Token expiration date (if authenticated)
     */
    expiresAt: Date | null;
    /**
     * Login with credentials
     */
    login: (accessToken: string, refreshToken: string, expiresIn: number, user: User) => void;
    /**
     * Logout and clear auth state
     */
    logout: () => void;
    /**
     * Refresh the access token
     */
    refreshToken: () => Promise<boolean>;
    /**
     * Check if user has a specific permission
     */
    hasPermission: (permission: string) => boolean;
    /**
     * Check if user has any of the specified permissions
     */
    hasAnyPermission: (permissions: string[]) => boolean;
    /**
     * Check if user has all of the specified permissions
     */
    hasAllPermissions: (permissions: string[]) => boolean;
}
/**
 * Hook to access auth context
 *
 * @throws Error if used outside AuthProvider
 */
export declare function useAuth(): AuthContextValue;
/**
 * Hook to access auth context (returns null if outside provider)
 *
 * Unlike `useAuth()`, this hook doesn't throw an error if used outside AuthProvider.
 * Returns `null` instead, making it safe for optional auth contexts.
 *
 * @returns Auth context value or null if not provided
 */
export declare function useAuthOptional(): AuthContextValue | null;
/**
 * Props for AuthProvider component
 * Configures authentication behavior and session management
 */
export interface AuthProviderProps {
    /**
     * Child components
     */
    children: ReactNode;
    /**
     * Token refresh function - called when token needs to be refreshed
     * Should return new tokens on success
     */
    onRefreshToken?: () => Promise<{
        accessToken: string;
        refreshToken?: string;
        expiresIn: number;
    }>;
    /**
     * Called when session expires
     */
    onSessionExpired?: () => void;
    /**
     * Whether to show session expiring dialog
     * @default true
     */
    showSessionWarning?: boolean;
    /**
     * Session warning threshold in seconds
     * @default 300 (5 minutes)
     */
    sessionWarningThreshold?: number;
    /**
     * Whether to enable automatic token refresh
     * @default true
     */
    enableAutoRefresh?: boolean;
}
export declare const AuthProvider: import("react").ForwardRefExoticComponent<AuthProviderProps & import("react").RefAttributes<HTMLDivElement>>;
/**
 * Props for RequireAuth component
 * Controls conditional rendering based on authentication and permissions
 */
export interface RequireAuthProps {
    /**
     * Content to show when authenticated
     */
    children: ReactNode;
    /**
     * Content to show when not authenticated
     */
    fallback?: ReactNode;
    /**
     * Required permissions (all must be present)
     */
    permissions?: string[];
    /**
     * Content to show when permissions not met
     */
    unauthorizedFallback?: ReactNode;
}
/**
 * Conditional rendering based on auth state
 *
 * Guards content to only show when user is authenticated and has required permissions.
 * Handles loading state during auth initialization.
 *
 * @example
 * ```tsx
 * <RequireAuth fallback={<LoginPage />}>
 *   <Dashboard />
 * </RequireAuth>
 *
 * <RequireAuth
 *   permissions={['admin']}
 *   unauthorizedFallback={<AccessDenied />}
 * >
 *   <AdminPanel />
 * </RequireAuth>
 * ```
 */
export declare function RequireAuth({ children, fallback, permissions, unauthorizedFallback, }: RequireAuthProps): ReactElement;
//# sourceMappingURL=AuthProvider.d.ts.map