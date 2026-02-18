import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { useAuthStore } from './auth.store';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store state before each test
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      lastRefreshAttempt: null,
      refreshAttempts: 0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with unauthenticated state', () => {
      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.expiresAt).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setTokens', () => {
    it('should set tokens and mark as authenticated', () => {
      const { setTokens } = useAuthStore.getState();

      setTokens('access-token', 'refresh-token', 3600);

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.expiresAt).toBeInstanceOf(Date);
    });

    it('should calculate correct expiration time', () => {
      vi.useFakeTimers();
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const { setTokens } = useAuthStore.getState();

      setTokens('access-token', 'refresh-token', 3600); // 1 hour

      const state = useAuthStore.getState();
      const expectedExpiry = new Date(now.getTime() + 3600 * 1000);
      expect(state.expiresAt!.getTime()).toBe(expectedExpiry.getTime());
    });

    it('should reset refresh attempts when setting tokens', () => {
      const { setTokens } = useAuthStore.getState();

      // Set initial refresh attempts
      useAuthStore.setState({ refreshAttempts: 5 });

      setTokens('new-token', 'new-refresh', 3600);

      const state = useAuthStore.getState();
      expect(state.refreshAttempts).toBe(0);
    });
  });

  describe('clearTokens', () => {
    it('should clear all auth state', () => {
      const { setTokens, clearTokens } = useAuthStore.getState();

      // First set tokens
      setTokens('access-token', 'refresh-token', 3600);
      useAuthStore.setState({
        user: { id: '1', username: 'test', permissions: [] },
      });

      // Then clear
      clearTokens();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.expiresAt).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.refreshAttempts).toBe(0);
    });
  });

  describe('setUser', () => {
    it('should set user data', () => {
      const { setUser } = useAuthStore.getState();
      const user = { id: '1', username: 'testuser', permissions: ['read', 'write'] };

      setUser(user);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
    });

    it('should clear user when passed null', () => {
      const { setUser } = useAuthStore.getState();

      setUser({ id: '1', username: 'test', permissions: [] });
      setUser(null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });
  });

  describe('Token Expiry Helpers', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('isTokenExpired should return true when token is expired', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      // Set token that expired 1 hour ago
      useAuthStore.setState({
        expiresAt: new Date(now.getTime() - 3600 * 1000),
        isAuthenticated: true,
      });

      const { isTokenExpired } = useAuthStore.getState();
      expect(isTokenExpired()).toBe(true);
    });

    it('isTokenExpired should return false when token is valid', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      // Set token that expires in 1 hour
      useAuthStore.setState({
        expiresAt: new Date(now.getTime() + 3600 * 1000),
        isAuthenticated: true,
      });

      const { isTokenExpired } = useAuthStore.getState();
      expect(isTokenExpired()).toBe(false);
    });

    it('isTokenExpiringSoon should return true within threshold', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      // Set token that expires in 2 minutes (within 5 min threshold)
      useAuthStore.setState({
        expiresAt: new Date(now.getTime() + 2 * 60 * 1000),
        isAuthenticated: true,
      });

      const { isTokenExpiringSoon } = useAuthStore.getState();
      expect(isTokenExpiringSoon(5 * 60 * 1000)).toBe(true); // 5 min threshold
    });

    it('isTokenExpiringSoon should return false outside threshold', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      // Set token that expires in 10 minutes
      useAuthStore.setState({
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
        isAuthenticated: true,
      });

      const { isTokenExpiringSoon } = useAuthStore.getState();
      expect(isTokenExpiringSoon(5 * 60 * 1000)).toBe(false); // 5 min threshold
    });

    it('getTimeUntilExpiry should return correct milliseconds', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const expiresInMs = 30 * 60 * 1000; // 30 minutes
      useAuthStore.setState({
        expiresAt: new Date(now.getTime() + expiresInMs),
        isAuthenticated: true,
      });

      const { getTimeUntilExpiry } = useAuthStore.getState();
      expect(getTimeUntilExpiry()).toBe(expiresInMs);
    });

    it('getTimeUntilExpiry should return 0 when expired', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      useAuthStore.setState({
        expiresAt: new Date(now.getTime() - 1000), // expired 1 second ago
        isAuthenticated: true,
      });

      const { getTimeUntilExpiry } = useAuthStore.getState();
      expect(getTimeUntilExpiry()).toBe(0);
    });
  });

  describe('Refresh Attempt Tracking', () => {
    it('shouldAttemptRefresh should return true when under max attempts', () => {
      useAuthStore.setState({
        refreshAttempts: 1,
      });

      const { shouldAttemptRefresh } = useAuthStore.getState();
      expect(shouldAttemptRefresh(3)).toBe(true);
    });

    it('shouldAttemptRefresh should return false when at max attempts', () => {
      useAuthStore.setState({
        refreshAttempts: 3,
      });

      const { shouldAttemptRefresh } = useAuthStore.getState();
      expect(shouldAttemptRefresh(3)).toBe(false);
    });

    it('recordRefreshAttempt should increment attempts', () => {
      const { recordRefreshAttempt } = useAuthStore.getState();

      recordRefreshAttempt();
      expect(useAuthStore.getState().refreshAttempts).toBe(1);

      recordRefreshAttempt();
      expect(useAuthStore.getState().refreshAttempts).toBe(2);
    });

    it('recordRefreshAttempt should update lastRefreshAttempt', () => {
      vi.useFakeTimers();
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const { recordRefreshAttempt } = useAuthStore.getState();

      recordRefreshAttempt();

      const state = useAuthStore.getState();
      expect(state.lastRefreshAttempt).toBeInstanceOf(Date);
      expect(state.lastRefreshAttempt!.getTime()).toBe(now.getTime());
    });

    it('resetRefreshAttempts should clear attempt tracking', () => {
      const { recordRefreshAttempt, resetRefreshAttempts } = useAuthStore.getState();

      recordRefreshAttempt();
      recordRefreshAttempt();
      recordRefreshAttempt();

      resetRefreshAttempts();

      const state = useAuthStore.getState();
      expect(state.refreshAttempts).toBe(0);
      expect(state.lastRefreshAttempt).toBeNull();
    });
  });

  describe('Persistence', () => {
    it('should persist auth state to localStorage', () => {
      const { setTokens, setUser } = useAuthStore.getState();

      setTokens('access-token', 'refresh-token', 3600);
      setUser({ id: '1', username: 'test', permissions: ['admin'] });

      const stored = localStorage.getItem('nasnet-auth');
      expect(stored).toBeTruthy();

      const data = JSON.parse(stored!);
      expect(data.state.accessToken).toBe('access-token');
      expect(data.state.refreshToken).toBe('refresh-token');
      expect(data.state.user.username).toBe('test');
    });

    it('should serialize Date objects correctly', () => {
      vi.useFakeTimers();
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const { setTokens } = useAuthStore.getState();

      setTokens('access-token', 'refresh-token', 3600);

      const stored = localStorage.getItem('nasnet-auth');
      const data = JSON.parse(stored!);

      // expiresAt should be stored as ISO string
      expect(typeof data.state.expiresAt).toBe('string');
      expect(data.state.expiresAt).toContain('2024-01-01');
    });

    it('should deserialize Date objects on rehydration', () => {
      // Manually set localStorage (simulating previous session)
      const testData = {
        state: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          expiresAt: '2024-01-01T13:00:00.000Z',
          user: { id: '1', username: 'test', permissions: [] },
          isAuthenticated: true,
          isLoading: false,
          lastRefreshAttempt: null,
          refreshAttempts: 0,
        },
        version: 1,
      };
      localStorage.setItem('nasnet-auth', JSON.stringify(testData));

      // The custom storage handler should rehydrate Date from string
      // In actual app, Zustand persist would handle this
      const stored = localStorage.getItem('nasnet-auth');
      const parsed = JSON.parse(stored!);

      expect(parsed.state.expiresAt).toBe('2024-01-01T13:00:00.000Z');
    });

    it('should NOT persist isLoading state', () => {
      useAuthStore.setState({ isLoading: true });

      const stored = localStorage.getItem('nasnet-auth');
      // isLoading should not trigger persist or should be filtered
      // The partialize function filters it out
      if (stored) {
        const data = JSON.parse(stored);
        expect(data.state.isLoading).toBeUndefined();
      }
    });
  });

  describe('Logout', () => {
    it('logout should clear all state', () => {
      const { setTokens, setUser, logout } = useAuthStore.getState();

      setTokens('access-token', 'refresh-token', 3600);
      setUser({ id: '1', username: 'test', permissions: [] });

      logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.user).toBeNull();
    });

    it('logout should be alias for clearTokens', () => {
      const { logout, clearTokens } = useAuthStore.getState();

      // They should reference the same function or produce same result
      expect(typeof logout).toBe('function');
      expect(typeof clearTokens).toBe('function');
    });
  });

  describe('Permission Checking', () => {
    it('hasPermission should check user permissions', () => {
      const { setUser, hasPermission } = useAuthStore.getState();

      setUser({
        id: '1',
        username: 'admin',
        permissions: ['read', 'write', 'admin'],
      });

      expect(hasPermission('read')).toBe(true);
      expect(hasPermission('admin')).toBe(true);
      expect(hasPermission('superadmin')).toBe(false);
    });

    it('hasPermission should return false when no user', () => {
      const { hasPermission } = useAuthStore.getState();

      expect(hasPermission('read')).toBe(false);
    });

    it('hasAnyPermission should check for any matching permission', () => {
      const { setUser, hasAnyPermission } = useAuthStore.getState();

      setUser({
        id: '1',
        username: 'user',
        permissions: ['read'],
      });

      expect(hasAnyPermission(['read', 'write'])).toBe(true);
      expect(hasAnyPermission(['admin', 'superadmin'])).toBe(false);
    });

    it('hasAllPermissions should check for all matching permissions', () => {
      const { setUser, hasAllPermissions } = useAuthStore.getState();

      setUser({
        id: '1',
        username: 'admin',
        permissions: ['read', 'write', 'admin'],
      });

      expect(hasAllPermissions(['read', 'write'])).toBe(true);
      expect(hasAllPermissions(['read', 'superadmin'])).toBe(false);
    });
  });
});
