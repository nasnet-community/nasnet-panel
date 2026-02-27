/**
 * Route Guard Hooks
 *
 * Authentication guards for protected routes using TanStack Router.
 * Redirects unauthenticated users to login and preserves return URL.
 *
 * Features:
 * - TanStack Router beforeLoad guard function
 * - React hook for component-level auth checks
 * - Token expiry validation
 * - Return URL preservation
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 */

import { redirect } from '@tanstack/react-router';

import { useAuthStore } from '../auth/auth.store';

// ===== Types =====

/**
 * Route location information
 */
export interface RouteLocation {
  pathname: string;
  search?: Record<string, string>;
}

/**
 * Route guard result for component-level checks
 */
export interface AuthStatus {
  /**
   * Whether user is authenticated with valid token
   */
  isAuthenticated: boolean;

  /**
   * Whether token has expired
   */
  isExpired: boolean;

  /**
   * Whether token is expiring soon (within 5 minutes)
   */
  isExpiringSoon: boolean;
}

// ===== TanStack Router Guards =====

/**
 * Route guard for TanStack Router beforeLoad.
 *
 * Use in route definitions to protect routes from unauthenticated access.
 * Redirects to login page with return URL preserved.
 *
 * Usage with TanStack Router:
 * ```tsx
 * import { createRoute } from '@tanstack/react-router';
 * import { requireAuth } from '@nasnet/state/stores';
 *
 * export const dashboardRoute = createRoute({
 *   getParentRoute: () => rootRoute,
 *   path: '/dashboard',
 *   beforeLoad: requireAuth,
 *   component: Dashboard,
 * });
 * ```
 *
 * @param context - Route context containing location
 * @throws Redirect to login page if not authenticated
 */
export function requireAuth({ location }: { location: RouteLocation }): void {
  const { isAuthenticated, tokenExpiry } = useAuthStore.getState();

  // Check if token is expired
  const isExpired = tokenExpiry ? tokenExpiry.getTime() < Date.now() : true;

  if (!isAuthenticated || isExpired) {
    throw redirect({
      to: '/login' as string,
      search: { redirect: location.pathname } as Record<string, unknown>,
    });
  }
}

/**
 * Route guard that requires specific permission.
 *
 * Creates a beforeLoad guard that checks for a specific permission.
 * Redirects to unauthorized page if permission is missing.
 *
 * Usage:
 * ```tsx
 * export const adminRoute = createRoute({
 *   beforeLoad: requirePermission('admin'),
 *   component: AdminPanel,
 * });
 * ```
 *
 * @param permission - Required permission string
 * @returns beforeLoad guard function
 */
export function requirePermission(
  permission: string
): (context: { location: RouteLocation }) => void {
  return ({ location }) => {
    // First check authentication
    requireAuth({ location });

    // Then check permission
    const user = useAuthStore.getState().user;
    const hasPermission = user?.permissions?.includes(permission) ?? false;

    if (!hasPermission) {
      throw redirect({
        to: '/unauthorized' as string,
        search: { required: permission } as Record<string, unknown>,
      });
    }
  };
}

/**
 * Route guard for guest-only routes (login, register).
 *
 * Redirects authenticated users away from guest-only pages.
 *
 * Usage:
 * ```tsx
 * export const loginRoute = createRoute({
 *   beforeLoad: requireGuest,
 *   component: LoginPage,
 * });
 * ```
 *
 * @param context - Route context containing location
 * @throws Redirect to dashboard if already authenticated
 */
export function requireGuest({ location }: { location: RouteLocation }): void {
  const { isAuthenticated, tokenExpiry } = useAuthStore.getState();

  // Check if token is still valid
  const isValid = tokenExpiry ? tokenExpiry.getTime() > Date.now() : false;

  if (isAuthenticated && isValid) {
    // Get redirect URL from search params or default to dashboard
    const redirectTo = (location.search as Record<string, string>)?.redirect || '/dashboard';

    throw redirect({
      to: redirectTo,
    });
  }
}

// ===== React Hooks =====

/**
 * Hook for component-level authentication checks.
 *
 * Provides current auth status for conditional rendering
 * and auth-dependent logic in components.
 *
 * Usage:
 * ```tsx
 * function ProtectedContent() {
 *   const { isAuthenticated, isExpired, isExpiringSoon } = useRequireAuth();
 *
 *   if (!isAuthenticated) {
 *     return <Navigate to="/login" />;
 *   }
 *
 *   if (isExpiringSoon) {
 *     return <SessionExpiringDialog />;
 *   }
 *
 *   return <Content />;
 * }
 * ```
 *
 * @returns Authentication status object
 */
export function useRequireAuth(): AuthStatus {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tokenExpiry = useAuthStore((state) => state.tokenExpiry);
  const isTokenExpiringSoon = useAuthStore((state) => state.isTokenExpiringSoon);

  const now = Date.now();
  const isExpired = tokenExpiry ? tokenExpiry.getTime() < now : true;
  const isExpiringSoon = isTokenExpiringSoon();

  return {
    isAuthenticated: isAuthenticated && !isExpired,
    isExpired,
    isExpiringSoon,
  };
}

/**
 * Hook to check if user has a specific permission.
 *
 * Usage:
 * ```tsx
 * function AdminButton() {
 *   const hasAdminAccess = useHasPermission('admin');
 *
 *   if (!hasAdminAccess) return null;
 *
 *   return <Button>Admin Panel</Button>;
 * }
 * ```
 *
 * @param permission - Permission to check
 * @returns Whether user has the permission
 */
export function useHasPermission(permission: string): boolean {
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);
  return permissions.includes(permission);
}

/**
 * Hook to get current user information.
 *
 * Usage:
 * ```tsx
 * function UserProfile() {
 *   const user = useCurrentUser();
 *
 *   if (!user) return <LoginPrompt />;
 *
 *   return <div>Welcome, {user.username}!</div>;
 * }
 * ```
 *
 * @returns Current user or null
 */
export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}

/**
 * Hook to get auth actions.
 *
 * Provides stable action references for login/logout operations.
 *
 * Usage:
 * ```tsx
 * function LogoutButton() {
 *   const { logout } = useAuthActions();
 *
 *   return <Button onClick={logout}>Logout</Button>;
 * }
 * ```
 *
 * @returns Auth action functions
 */
export function useAuthActions() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const updateLastActivity = useAuthStore((state) => state.updateLastActivity);

  return {
    login: setAuth,
    logout: clearAuth,
    updateActivity: updateLastActivity,
  };
}

// ===== Type Exports =====

// Types are already exported inline above
