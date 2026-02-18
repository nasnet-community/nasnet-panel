/**
 * Auth Provider Component
 *
 * Authentication context provider that integrates with Zustand auth store.
 * Provides auth state and methods via React context for convenience.
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 */

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

import { useAuthStore, useTokenRefresh } from '@nasnet/state/stores';

import { SessionExpiringDialog } from '../session-expiring-dialog';

// ===== Types =====

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

// ===== Context =====

const AuthContext = createContext<AuthContextValue | null>(null);

// ===== Hook =====

/**
 * Hook to access auth context
 *
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to access auth context (returns null if outside provider)
 */
export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}

// ===== Provider Props =====

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

// ===== Provider Component =====

/**
 * Auth Provider
 *
 * Wraps app to provide authentication context and features:
 * - Auth state from Zustand store
 * - Automatic token refresh
 * - Session expiring warning dialog
 * - Permission checking helpers
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AuthProvider
 *       onRefreshToken={async () => {
 *         const response = await api.refreshToken();
 *         return {
 *           accessToken: response.accessToken,
 *           refreshToken: response.refreshToken,
 *           expiresIn: response.expiresIn,
 *         };
 *       }}
 *       onSessionExpired={() => navigate('/login')}
 *     >
 *       <RouterProvider />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({
  children,
  onRefreshToken,
  onSessionExpired,
  showSessionWarning = true,
  sessionWarningThreshold = 300,
  enableAutoRefresh = true,
}: AuthProviderProps) {
  // Get auth store state and actions
  const {
    token: accessToken,
    refreshToken: storedRefreshToken,
    tokenExpiry: expiresAt,
    user,
    isAuthenticated,
    isRefreshing: isLoading,
    setAuth,
    clearAuth,
  } = useAuthStore();

  // Enable automatic token refresh
  useTokenRefresh({
    refreshTokenFn: onRefreshToken
      ? async () => {
          const result = await onRefreshToken();
          return {
            token: result.accessToken,
            expiresAt: new Date(Date.now() + result.expiresIn * 1000),
            refreshToken: result.refreshToken,
          };
        }
      : async () => { throw new Error('No refresh function provided'); },
    onReauthRequired: () => {
      clearAuth();
      onSessionExpired?.();
    },
  });

  // Login handler
  const login = useCallback(
    (accessToken: string, refreshToken: string, expiresIn: number, loginUser: User) => {
      setAuth(accessToken, loginUser as any, new Date(Date.now() + expiresIn * 1000), refreshToken);
    },
    [setAuth]
  );

  // Logout handler
  const logout = useCallback(() => {
    clearAuth();
    onSessionExpired?.();
  }, [clearAuth, onSessionExpired]);

  // Refresh token handler
  const refreshTokenFn = useCallback(async (): Promise<boolean> => {
    if (!onRefreshToken) return false;

    try {
      const result = await onRefreshToken();
      if (user) {
        setAuth(
          result.accessToken,
          user as any,
          new Date(Date.now() + result.expiresIn * 1000),
          result.refreshToken ?? storedRefreshToken ?? undefined
        );
      }
      return true;
    } catch {
      return false;
    }
  }, [onRefreshToken, setAuth, user, storedRefreshToken]);

  // Permission helpers
  const hasPermission = useCallback(
    (permission: string): boolean => {
      return user?.permissions.includes(permission) ?? false;
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (!user?.permissions) return false;
      return permissions.some((p) => user.permissions.includes(p));
    },
    [user]
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      if (!user?.permissions) return false;
      return permissions.every((p) => user.permissions.includes(p));
    },
    [user]
  );

  // Extend session handler
  const handleExtendSession = useCallback(async () => {
    if (!onRefreshToken) return;

    const result = await onRefreshToken();
    if (user) {
      setAuth(
        result.accessToken,
        user as any,
        new Date(Date.now() + result.expiresIn * 1000),
        result.refreshToken ?? storedRefreshToken ?? undefined
      );
    }
  }, [onRefreshToken, setAuth, user, storedRefreshToken]);

  // Memoize context value
  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      user: user as User | null,
      accessToken,
      expiresAt,
      login,
      logout,
      refreshToken: refreshTokenFn,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    }),
    [
      isAuthenticated,
      isLoading,
      user,
      accessToken,
      expiresAt,
      login,
      logout,
      refreshTokenFn,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* Session expiring dialog */}
      {showSessionWarning && (
        <SessionExpiringDialog
          warningThreshold={sessionWarningThreshold}
          onExtendSession={onRefreshToken ? handleExtendSession : undefined}
          onSessionExpired={onSessionExpired}
        />
      )}
    </AuthContext.Provider>
  );
}

// ===== Utility Components =====

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
export function RequireAuth({
  children,
  fallback = null,
  permissions,
  unauthorizedFallback = null,
}: RequireAuthProps) {
  const { isAuthenticated, hasAllPermissions, isLoading } = useAuth();

  // Still loading
  if (isLoading) {
    return null;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check permissions if specified
  if (permissions && !hasAllPermissions(permissions)) {
    return <>{unauthorizedFallback}</>;
  }

  return <>{children}</>;
}

