import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { useConnectionStore } from './connection.store';

describe('useConnectionStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store state before each test
    useConnectionStore.setState({
      wsStatus: 'disconnected',
      isReconnecting: false,
      reconnectAttempts: 0,
      maxReconnectAttempts: 10,
      lastConnectedAt: null,
      activeRouterId: null,
      routers: {},
      // Legacy fields
      state: 'disconnected',
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const state = useConnectionStore.getState();
      expect(state.wsStatus).toBe('disconnected');
      expect(state.isReconnecting).toBe(false);
      expect(state.reconnectAttempts).toBe(0);
      expect(state.maxReconnectAttempts).toBe(10);
      expect(state.lastConnectedAt).toBeNull();
      expect(state.activeRouterId).toBeNull();
      expect(state.routers).toEqual({});
    });

    it('should have legacy state field for backwards compatibility', () => {
      const state = useConnectionStore.getState();
      expect(state.state).toBe('disconnected');
    });
  });

  describe('WebSocket Status (setWsStatus)', () => {
    it('should update wsStatus to connecting', () => {
      const { setWsStatus } = useConnectionStore.getState();

      setWsStatus('connecting');

      const state = useConnectionStore.getState();
      expect(state.wsStatus).toBe('connecting');
      expect(state.state).toBe('connecting'); // Legacy field
    });

    it('should update wsStatus to connected and set lastConnectedAt', () => {
      const { setWsStatus } = useConnectionStore.getState();

      const beforeTime = new Date();
      setWsStatus('connected');
      const afterTime = new Date();

      const state = useConnectionStore.getState();
      expect(state.wsStatus).toBe('connected');
      expect(state.isReconnecting).toBe(false);
      expect(state.reconnectAttempts).toBe(0);
      expect(state.lastConnectedAt).not.toBeNull();
      expect(state.lastConnectedAt!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(state.lastConnectedAt!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should update wsStatus to disconnected', () => {
      const { setWsStatus } = useConnectionStore.getState();

      // First connect
      setWsStatus('connected');
      const connectedAt = useConnectionStore.getState().lastConnectedAt;

      // Then disconnect
      setWsStatus('disconnected');

      const state = useConnectionStore.getState();
      expect(state.wsStatus).toBe('disconnected');
      // lastConnectedAt should be preserved
      expect(state.lastConnectedAt).toEqual(connectedAt);
    });

    it('should update wsStatus to error', () => {
      const { setWsStatus } = useConnectionStore.getState();

      setWsStatus('error');

      const state = useConnectionStore.getState();
      expect(state.wsStatus).toBe('error');
      expect(state.state).toBe('error');
    });
  });

  describe('Reconnection Management', () => {
    it('should start reconnection', () => {
      const { startReconnection } = useConnectionStore.getState();

      startReconnection();

      const state = useConnectionStore.getState();
      expect(state.isReconnecting).toBe(true);
      expect(state.reconnectAttempts).toBe(1);
    });

    it('should increment reconnect attempts', () => {
      const { startReconnection, incrementReconnectAttempts } = useConnectionStore.getState();

      startReconnection();
      incrementReconnectAttempts();

      const state = useConnectionStore.getState();
      expect(state.reconnectAttempts).toBe(2);
    });

    it('should reset reconnection state', () => {
      const { startReconnection, incrementReconnectAttempts, resetReconnection } =
        useConnectionStore.getState();

      startReconnection();
      incrementReconnectAttempts();
      incrementReconnectAttempts();

      resetReconnection();

      const state = useConnectionStore.getState();
      expect(state.isReconnecting).toBe(false);
      expect(state.reconnectAttempts).toBe(0);
    });

    it('should detect when max attempts reached', () => {
      const { startReconnection, incrementReconnectAttempts } = useConnectionStore.getState();

      // Set max to 3 for easier testing
      useConnectionStore.setState({ maxReconnectAttempts: 3 });

      startReconnection(); // attempt 1
      incrementReconnectAttempts(); // attempt 2
      incrementReconnectAttempts(); // attempt 3

      const state = useConnectionStore.getState();
      expect(state.reconnectAttempts).toBe(3);
      expect(state.reconnectAttempts >= state.maxReconnectAttempts).toBe(true);
    });
  });

  describe('Router Connection Management', () => {
    it('should set active router', () => {
      const { setActiveRouter } = useConnectionStore.getState();

      setActiveRouter('router-1');

      const state = useConnectionStore.getState();
      expect(state.activeRouterId).toBe('router-1');
    });

    it('should update router connection state', () => {
      const { updateRouterConnection } = useConnectionStore.getState();

      updateRouterConnection('router-1', {
        status: 'connected',
        protocol: 'api',
        latencyMs: 50,
      });

      const state = useConnectionStore.getState();
      expect(state.routers['router-1']).toBeDefined();
      expect(state.routers['router-1'].status).toBe('connected');
      expect(state.routers['router-1'].protocol).toBe('api');
      expect(state.routers['router-1'].latencyMs).toBe(50);
    });

    it('should merge router connection updates', () => {
      const { updateRouterConnection } = useConnectionStore.getState();

      // Initial update
      updateRouterConnection('router-1', {
        status: 'connected',
        protocol: 'api',
        latencyMs: 50,
      });

      // Partial update
      updateRouterConnection('router-1', {
        latencyMs: 75,
      });

      const state = useConnectionStore.getState();
      expect(state.routers['router-1'].status).toBe('connected');
      expect(state.routers['router-1'].protocol).toBe('api');
      expect(state.routers['router-1'].latencyMs).toBe(75);
    });

    it('should remove router connection', () => {
      const { updateRouterConnection, removeRouterConnection } = useConnectionStore.getState();

      updateRouterConnection('router-1', {
        status: 'connected',
        protocol: 'api',
      });

      removeRouterConnection('router-1');

      const state = useConnectionStore.getState();
      expect(state.routers['router-1']).toBeUndefined();
    });

    it('should clear active router if removed', () => {
      const { setActiveRouter, updateRouterConnection, removeRouterConnection } =
        useConnectionStore.getState();

      updateRouterConnection('router-1', { status: 'connected' });
      setActiveRouter('router-1');

      removeRouterConnection('router-1');

      const state = useConnectionStore.getState();
      expect(state.activeRouterId).toBeNull();
    });

    it('should not clear active router if different router removed', () => {
      const { setActiveRouter, updateRouterConnection, removeRouterConnection } =
        useConnectionStore.getState();

      updateRouterConnection('router-1', { status: 'connected' });
      updateRouterConnection('router-2', { status: 'connected' });
      setActiveRouter('router-1');

      removeRouterConnection('router-2');

      const state = useConnectionStore.getState();
      expect(state.activeRouterId).toBe('router-1');
    });
  });

  describe('Legacy API Compatibility', () => {
    it('should support connect() method', () => {
      const { connect } = useConnectionStore.getState();

      connect();

      const state = useConnectionStore.getState();
      expect(state.state).toBe('connected');
      expect(state.wsStatus).toBe('connected');
    });

    it('should support disconnect() method', () => {
      const { connect, disconnect } = useConnectionStore.getState();

      connect();
      disconnect();

      const state = useConnectionStore.getState();
      expect(state.state).toBe('disconnected');
      expect(state.wsStatus).toBe('disconnected');
    });

    it('should support reconnect() method', () => {
      const { reconnect } = useConnectionStore.getState();

      reconnect();

      const state = useConnectionStore.getState();
      expect(state.state).toBe('reconnecting');
      expect(state.isReconnecting).toBe(true);
    });
  });

  describe('Persistence', () => {
    it('should persist activeRouterId to localStorage', () => {
      const { setActiveRouter } = useConnectionStore.getState();

      setActiveRouter('router-1');

      // Force persist
      const stored = localStorage.getItem('nasnet-connection');
      expect(stored).toBeTruthy();

      const data = JSON.parse(stored!);
      expect(data.state.activeRouterId).toBe('router-1');
    });

    it('should NOT persist sensitive connection state', () => {
      const { setWsStatus, updateRouterConnection } = useConnectionStore.getState();

      setWsStatus('connected');
      updateRouterConnection('router-1', {
        status: 'connected',
        protocol: 'api',
        latencyMs: 50,
      });

      const stored = localStorage.getItem('nasnet-connection');
      const data = JSON.parse(stored!);

      // wsStatus, routers, etc. should NOT be persisted
      expect(data.state.wsStatus).toBeUndefined();
      expect(data.state.routers).toBeUndefined();
      expect(data.state.lastConnectedAt).toBeUndefined();
    });
  });

  describe('Reset', () => {
    it('should reset all connection state', () => {
      const {
        setWsStatus,
        startReconnection,
        setActiveRouter,
        updateRouterConnection,
        reset,
      } = useConnectionStore.getState();

      // Setup state
      setWsStatus('connected');
      startReconnection();
      setActiveRouter('router-1');
      updateRouterConnection('router-1', { status: 'connected' });

      // Reset
      reset();

      const state = useConnectionStore.getState();
      expect(state.wsStatus).toBe('disconnected');
      expect(state.isReconnecting).toBe(false);
      expect(state.reconnectAttempts).toBe(0);
      expect(state.lastConnectedAt).toBeNull();
      expect(state.activeRouterId).toBeNull();
      expect(state.routers).toEqual({});
    });
  });
});
