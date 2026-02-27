/// <reference types="vite/client" />

/**
 * Authentication State Store
 *
 * Manages JWT tokens, user sessions, and authentication state.
 * Part of Layer 2 (UI State) in the Four-Layer State Architecture.
 *
 * Features:
 * - JWT token storage with proper Date serialization
 * - User profile and permissions storage
 * - Proactive token refresh (5 min before expiry)
 * - Auth state persistence with custom storage handler
 * - Redux DevTools integration
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 * @see Docs/architecture/frontend-architecture.md#state-management
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

// ===== Types =====

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
  // ===== Token State =====

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

  // ===== User State =====

  /**
   * Current user profile (null if not authenticated)
   */
  user: User | null;

  /**
   * Whether user is currently authenticated
   */
  isAuthenticated: boolean;

  // ===== Session State =====

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
  // ===== Authentication Actions =====

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

  // ===== Refresh State Actions =====

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

  // ===== Activity Tracking =====

  /**
   * Update last activity timestamp
   */
  updateLastActivity: () => void;

  // ===== Token State Queries =====

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

// ===== Constants =====

/**
 * Token expiry warning threshold (5 minutes)
 */
const TOKEN_EXPIRY_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Maximum refresh attempts before re-auth required
 */
const MAX_REFRESH_ATTEMPTS = 3;

// ===== Custom Storage Handler =====

/**
 * Custom storage handler that properly serializes/deserializes Date objects.
 *
 * The default JSON serialization converts Date to string, which breaks
 * comparison logic. This handler rehydrates Date objects on load.
 */
const authStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof localStorage === 'undefined') return null;

    const str = localStorage.getItem(name);
    if (!str) return null;

    try {
      const parsed = JSON.parse(str);

      // Rehydrate Date objects from ISO strings
      if (parsed.state?.tokenExpiry) {
        parsed.state.tokenExpiry = new Date(parsed.state.tokenExpiry);
      }
      if (parsed.state?.lastActivity) {
        parsed.state.lastActivity = new Date(parsed.state.lastActivity);
      }

      return JSON.stringify(parsed);
    } catch {
      return str;
    }
  },

  setItem: (name: string, value: string): void => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(name, value);
  },

  removeItem: (name: string): void => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(name);
  },
};

// ===== Store Implementation =====

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
export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set, get) => ({
        // ===== Initial State =====
        token: null,
        tokenExpiry: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isRefreshing: false,
        refreshAttempts: 0,
        lastActivity: null,

        // ===== Authentication Actions =====

        setAuth: (token, user, expiresAt, refreshToken) =>
          set(
            {
              token,
              tokenExpiry: expiresAt,
              refreshToken: refreshToken ?? null,
              user,
              isAuthenticated: true,
              lastActivity: new Date(),
              refreshAttempts: 0,
              isRefreshing: false,
            },
            false,
            'setAuth'
          ),

        clearAuth: () =>
          set(
            {
              token: null,
              tokenExpiry: null,
              refreshToken: null,
              user: null,
              isAuthenticated: false,
              isRefreshing: false,
              refreshAttempts: 0,
            },
            false,
            'clearAuth'
          ),

        // ===== Refresh State Actions =====

        setRefreshing: (isRefreshing) =>
          set({ isRefreshing }, false, `setRefreshing/${isRefreshing}`),

        incrementRefreshAttempts: () =>
          set(
            (state) => ({
              refreshAttempts: state.refreshAttempts + 1,
            }),
            false,
            'incrementRefreshAttempts'
          ),

        resetRefreshAttempts: () => set({ refreshAttempts: 0 }, false, 'resetRefreshAttempts'),

        // ===== Activity Tracking =====

        updateLastActivity: () => set({ lastActivity: new Date() }, false, 'updateLastActivity'),

        // ===== Token State Queries =====

        isTokenExpiringSoon: () => {
          const { tokenExpiry } = get();
          if (!tokenExpiry) return false;

          const now = Date.now();
          const expiryTime = tokenExpiry.getTime();

          return expiryTime - now < TOKEN_EXPIRY_THRESHOLD_MS;
        },

        getTimeUntilExpiry: () => {
          const { tokenExpiry } = get();
          if (!tokenExpiry) return null;

          return tokenExpiry.getTime() - Date.now();
        },

        shouldAttemptRefresh: () => {
          const { refreshAttempts, isRefreshing, refreshToken } = get();

          // Need a refresh token
          if (!refreshToken) return false;

          // Not already refreshing
          if (isRefreshing) return false;

          // Haven't exceeded max attempts
          return refreshAttempts < MAX_REFRESH_ATTEMPTS;
        },
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => authStorage),
        // Only persist essential auth state
        partialize: (state) => ({
          token: state.token,
          tokenExpiry: state.tokenExpiry,
          refreshToken: state.refreshToken,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
      enabled:
        typeof window !== 'undefined' &&
        (typeof import.meta !== 'undefined' ? import.meta.env?.DEV !== false : true),
    }
  )
);

// ===== Selectors =====

/**
 * Select whether user is authenticated
 */
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;

/**
 * Select current user
 */
export const selectUser = (state: AuthState) => state.user;

/**
 * Select current token
 */
export const selectToken = (state: AuthState) => state.token;

/**
 * Select whether token refresh is in progress
 */
export const selectIsRefreshing = (state: AuthState) => state.isRefreshing;

/**
 * Select refresh attempts count
 */
export const selectRefreshAttempts = (state: AuthState) => state.refreshAttempts;

/**
 * Select whether max refresh attempts exceeded
 */
export const selectMaxRefreshExceeded = (state: AuthState) =>
  state.refreshAttempts >= MAX_REFRESH_ATTEMPTS;

/**
 * Select user permissions
 */
export const selectPermissions = (state: AuthState) => state.user?.permissions ?? [];

/**
 * Check if user has a specific permission
 */
export const selectHasPermission = (permission: string) => (state: AuthState) =>
  state.user?.permissions?.includes(permission) ?? false;

// ===== Helper Functions =====

/**
 * Get auth store state outside of React
 */
export const getAuthState = () => useAuthStore.getState();

/**
 * Subscribe to auth store changes outside of React
 */
export const subscribeAuthState = useAuthStore.subscribe;

/**
 * Check if user is authenticated (for use outside React)
 */
export function isAuthenticated(): boolean {
  const state = useAuthStore.getState();
  if (!state.isAuthenticated || !state.tokenExpiry) return false;

  // Also check if token is expired
  return state.tokenExpiry.getTime() > Date.now();
}

/**
 * Get current auth token (for use outside React)
 */
export function getAuthToken(): string | null {
  const state = useAuthStore.getState();
  if (!state.token || !state.tokenExpiry) return null;

  // Return null if token is expired
  if (state.tokenExpiry.getTime() <= Date.now()) return null;

  return state.token;
}

// ===== Type Exports =====

// Types are already exported inline above
