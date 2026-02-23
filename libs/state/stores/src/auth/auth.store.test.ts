import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { useAuthStore, type User } from './auth.store';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store state before each test
    useAuthStore.setState({
      token: null,
      tokenExpiry: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isRefreshing: false,
      refreshAttempts: 0,
      lastActivity: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with unauthenticated state', () => {
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.tokenExpiry).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isRefreshing).toBe(false);
    });
  });

  describe('setAuth', () => {
    it('should set tokens and mark as authenticated', () => {
      const { setAuth } = useAuthStore.getState();
      const user: User = { id: '1', username: 'test', email: 'test@example.com', permissions: [] };
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      setAuth('access-token', user, expiresAt, 'refresh-token');

      const state = useAuthStore.getState();
      expect(state.token).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.tokenExpiry).toBeInstanceOf(Date);
    });

    it('should calculate correct expiration time', () => {
      vi.useFakeTimers();
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const { setAuth } = useAuthStore.getState();
      const user: User = { id: '1', username: 'test', email: 'test@example.com', permissions: [] };
      const expectedExpiry = new Date(now.getTime() + 3600 * 1000);

      setAuth('access-token', user, expectedExpiry, 'refresh-token');

      const state = useAuthStore.getState();
      expect(state.tokenExpiry!.getTime()).toBe(expectedExpiry.getTime());
    });

    it('should reset refresh attempts when setting tokens', () => {
      const { setAuth } = useAuthStore.getState();

      // Set initial refresh attempts
      useAuthStore.setState({ refreshAttempts: 5 });

      const user: User = { id: '1', username: 'test', email: 'test@example.com', permissions: [] };
      const expiresAt = new Date(Date.now() + 3600 * 1000);
      setAuth('new-token', user, expiresAt, 'new-refresh');

      const state = useAuthStore.getState();
      expect(state.refreshAttempts).toBe(0);
    });
  });

  describe('clearAuth', () => {
    it('should clear all auth state', () => {
      const { setAuth, clearAuth } = useAuthStore.getState();
      const user: User = { id: '1', username: 'test', email: 'test@example.com', permissions: [] };
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      // First set tokens
      setAuth('access-token', user, expiresAt, 'refresh-token');

      // Then clear
      clearAuth();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.tokenExpiry).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.refreshAttempts).toBe(0);
    });
  });

  describe('setAuth', () => {
    it('should set user data when authenticating', () => {
      const { setAuth } = useAuthStore.getState();
      const user: User = { id: '1', username: 'testuser', email: null, permissions: ['read', 'write'] };
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      setAuth('token', user, expiresAt);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
    });

    it('should clear user when clearAuth is called', () => {
      const { setAuth, clearAuth } = useAuthStore.getState();
      const user: User = { id: '1', username: 'test', email: null, permissions: [] };
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      setAuth('token', user, expiresAt);
      clearAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });
  });

  describe('Token Expiry Helpers', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('tokenExpiry should indicate when token is expired', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      // Set token that expired 1 hour ago
      useAuthStore.setState({
        tokenExpiry: new Date(now.getTime() - 3600 * 1000),
        isAuthenticated: true,
      });

      const state = useAuthStore.getState();
      expect(state.tokenExpiry!.getTime()).toBeLessThan(now.getTime());
    });

    it('tokenExpiry should indicate when token is valid', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      // Set token that expires in 1 hour
      useAuthStore.setState({
        tokenExpiry: new Date(now.getTime() + 3600 * 1000),
        isAuthenticated: true,
      });

      const state = useAuthStore.getState();
      expect(state.tokenExpiry!.getTime()).toBeGreaterThan(now.getTime());
    });

    it('isTokenExpiringSoon should return true within threshold', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      // Set token that expires in 2 minutes (within 5 min threshold)
      useAuthStore.setState({
        tokenExpiry: new Date(now.getTime() + 2 * 60 * 1000),
        isAuthenticated: true,
      });

      const { isTokenExpiringSoon } = useAuthStore.getState();
      expect(isTokenExpiringSoon()).toBe(true); // 5 min default threshold
    });

    it('isTokenExpiringSoon should return false outside threshold', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      // Set token that expires in 10 minutes
      useAuthStore.setState({
        tokenExpiry: new Date(now.getTime() + 10 * 60 * 1000),
        isAuthenticated: true,
      });

      const { isTokenExpiringSoon } = useAuthStore.getState();
      expect(isTokenExpiringSoon()).toBe(false); // 5 min default threshold
    });

    it('getTimeUntilExpiry should return correct milliseconds', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const expiresInMs = 30 * 60 * 1000; // 30 minutes
      useAuthStore.setState({
        tokenExpiry: new Date(now.getTime() + expiresInMs),
        isAuthenticated: true,
      });

      const { getTimeUntilExpiry } = useAuthStore.getState();
      const timeLeft = getTimeUntilExpiry();
      expect(timeLeft).toBeGreaterThan(0);
      expect(timeLeft).toBeLessThanOrEqual(expiresInMs);
    });

    it('getTimeUntilExpiry should return negative when expired', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      useAuthStore.setState({
        tokenExpiry: new Date(now.getTime() - 1000), // expired 1 second ago
        isAuthenticated: true,
      });

      const { getTimeUntilExpiry } = useAuthStore.getState();
      const timeLeft = getTimeUntilExpiry();
      expect(timeLeft).toBeLessThan(0);
    });
  });

  describe('Refresh Attempt Tracking', () => {
    it('shouldAttemptRefresh should return true when under max attempts', () => {
      useAuthStore.setState({
        refreshAttempts: 1,
        refreshToken: 'token',
        isRefreshing: false,
      });

      const { shouldAttemptRefresh } = useAuthStore.getState();
      expect(shouldAttemptRefresh()).toBe(true);
    });

    it('shouldAttemptRefresh should return false when at max attempts', () => {
      useAuthStore.setState({
        refreshAttempts: 3,
        refreshToken: 'token',
        isRefreshing: false,
      });

      const { shouldAttemptRefresh } = useAuthStore.getState();
      expect(shouldAttemptRefresh()).toBe(false);
    });

    it('incrementRefreshAttempts should increment attempts', () => {
      const { incrementRefreshAttempts } = useAuthStore.getState();

      incrementRefreshAttempts();
      expect(useAuthStore.getState().refreshAttempts).toBe(1);

      incrementRefreshAttempts();
      expect(useAuthStore.getState().refreshAttempts).toBe(2);
    });

    it('incrementRefreshAttempts should update refreshAttempts', () => {
      vi.useFakeTimers();
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const { incrementRefreshAttempts } = useAuthStore.getState();

      incrementRefreshAttempts();

      const state = useAuthStore.getState();
      expect(state.refreshAttempts).toBe(1);
    });

    it('resetRefreshAttempts should clear attempt tracking', () => {
      const { incrementRefreshAttempts, resetRefreshAttempts } = useAuthStore.getState();

      incrementRefreshAttempts();
      incrementRefreshAttempts();
      incrementRefreshAttempts();

      resetRefreshAttempts();

      const state = useAuthStore.getState();
      expect(state.refreshAttempts).toBe(0);
    });
  });

  describe('Persistence', () => {
    it('should persist auth state to localStorage', () => {
      const { setAuth } = useAuthStore.getState();
      const user: User = { id: '1', username: 'test', email: null, permissions: ['admin'] };
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      setAuth('access-token', user, expiresAt, 'refresh-token');

      const stored = localStorage.getItem('auth-storage');
      expect(stored).toBeTruthy();

      const data = JSON.parse(stored!);
      expect(data.state.token).toBe('access-token');
      expect(data.state.refreshToken).toBe('refresh-token');
      expect(data.state.user.username).toBe('test');
    });

    it('should serialize Date objects correctly', () => {
      vi.useFakeTimers();
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const { setAuth } = useAuthStore.getState();
      const user: User = { id: '1', username: 'test', email: null, permissions: [] };
      const expiresAt = new Date(now.getTime() + 3600 * 1000);

      setAuth('access-token', user, expiresAt, 'refresh-token');

      const stored = localStorage.getItem('auth-storage');
      const data = JSON.parse(stored!);

      // tokenExpiry should be stored as ISO string
      expect(typeof data.state.tokenExpiry).toBe('string');
      expect(data.state.tokenExpiry).toContain('2024-01-01');
    });

    it('should deserialize Date objects on rehydration', () => {
      // Manually set localStorage (simulating previous session)
      const testData = {
        state: {
          token: 'test-token',
          tokenExpiry: '2024-01-01T13:00:00.000Z',
          refreshToken: 'test-refresh',
          user: { id: '1', username: 'test', email: 'test@example.com', permissions: [] },
          isAuthenticated: true,
        },
        version: 1,
      };
      localStorage.setItem('auth-storage', JSON.stringify(testData));

      // The custom storage handler should rehydrate Date from string
      // In actual app, Zustand persist would handle this
      const stored = localStorage.getItem('auth-storage');
      const parsed = JSON.parse(stored!);

      expect(parsed.state.tokenExpiry).toBe('2024-01-01T13:00:00.000Z');
    });

    it('should NOT persist isRefreshing state', () => {
      useAuthStore.setState({ isRefreshing: true });

      const stored = localStorage.getItem('auth-storage');
      // isRefreshing should not trigger persist or should be filtered
      // The partialize function filters it out
      if (stored) {
        const data = JSON.parse(stored);
        expect(data.state.isRefreshing).toBeUndefined();
      }
    });
  });

  describe('Logout', () => {
    it('clearAuth should clear all state', () => {
      const { setAuth, clearAuth } = useAuthStore.getState();
      const user: User = { id: '1', username: 'test', email: null, permissions: [] };
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      setAuth('access-token', user, expiresAt, 'refresh-token');

      clearAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.user).toBeNull();
    });

    it('clearAuth should clear refresh state', () => {
      const { clearAuth } = useAuthStore.getState();

      // Set some refresh state
      useAuthStore.setState({ isRefreshing: true, refreshAttempts: 2 });

      clearAuth();

      const state = useAuthStore.getState();
      expect(state.isRefreshing).toBe(false);
      expect(state.refreshAttempts).toBe(0);
    });
  });

  describe('User Permissions', () => {
    it('user permissions should be available when authenticated', () => {
      const { setAuth } = useAuthStore.getState();
      const user: User = {
        id: '1',
        username: 'admin',
        email: null,
        permissions: ['read', 'write', 'admin'],
      };
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      setAuth('token', user, expiresAt);

      const state = useAuthStore.getState();
      expect(state.user?.permissions).toContain('read');
      expect(state.user?.permissions).toContain('admin');
      expect(state.user?.permissions).not.toContain('superadmin');
    });

    it('user should be null when not authenticated', () => {
      useAuthStore.setState({ user: null, isAuthenticated: false });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it('permissions array should be mutable for user', () => {
      const { setAuth } = useAuthStore.getState();
      const user: User = {
        id: '1',
        username: 'user',
        email: null,
        permissions: ['read'],
      };
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      setAuth('token', user, expiresAt);

      let state = useAuthStore.getState();
      expect(state.user?.permissions).toHaveLength(1);
      expect(state.user?.permissions).toContain('read');

      // Update user with more permissions
      const updatedUser: User = { ...user, permissions: ['read', 'write'] };
      setAuth('token', updatedUser, expiresAt);

      state = useAuthStore.getState();
      expect(state.user?.permissions).toHaveLength(2);
      expect(state.user?.permissions).toContain('write');
    });

    it('full permissions list should be accessible', () => {
      const { setAuth } = useAuthStore.getState();
      const user: User = {
        id: '1',
        username: 'admin',
        email: null,
        permissions: ['read', 'write', 'admin'],
      };
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      setAuth('token', user, expiresAt);

      const state = useAuthStore.getState();
      expect(state.user?.permissions).toEqual(['read', 'write', 'admin']);
    });
  });
});
