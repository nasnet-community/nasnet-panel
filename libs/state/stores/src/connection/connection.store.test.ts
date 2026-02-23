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
      expect(state.state).toBe('reconnecting'); // Legacy field maps connecting -> reconnecting
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
    it('should increment reconnect attempts', () => {
      const { incrementReconnectAttempts } = useConnectionStore.getState();

      incrementReconnectAttempts();

      const state = useConnectionStore.getState();
      expect(state.reconnectAttempts).toBe(1);
    });

    it('should increment reconnect attempts multiple times', () => {
      const { incrementReconnectAttempts } = useConnectionStore.getState();

      incrementReconnectAttempts();
      incrementReconnectAttempts();

      const state = useConnectionStore.getState();
      expect(state.reconnectAttempts).toBe(2);
    });

    it('should reset reconnection state', () => {
      const { incrementReconnectAttempts, resetReconnection, setWsStatus } =
        useConnectionStore.getState();

      setWsStatus('connecting');
      incrementReconnectAttempts();
      incrementReconnectAttempts();

      resetReconnection();

      const state = useConnectionStore.getState();
      expect(state.isReconnecting).toBe(false);
      expect(state.reconnectAttempts).toBe(0);
    });

    it('should detect when max attempts reached', () => {
      const { incrementReconnectAttempts, hasExceededMaxAttempts } = useConnectionStore.getState();

      // Set max to 3 for easier testing
      useConnectionStore.setState({ maxReconnectAttempts: 3 });

      incrementReconnectAttempts(); // attempt 1
      incrementReconnectAttempts(); // attempt 2
      incrementReconnectAttempts(); // attempt 3

      const state = useConnectionStore.getState();
      expect(state.reconnectAttempts).toBe(3);
      expect(state.reconnectAttempts >= state.maxReconnectAttempts).toBe(true);
      expect(hasExceededMaxAttempts()).toBe(true);
    });
  });

  describe('Router Connection Management', () => {
    it('should set active router', () => {
      const { setActiveRouter } = useConnectionStore.getState();

      setActiveRouter('router-1');

      const state = useConnectionStore.getState();
      expect(state.activeRouterId).toBe('router-1');
    });

    it('should set router connection state', () => {
      const { setRouterConnection } = useConnectionStore.getState();

      setRouterConnection('router-1', {
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
      const { setRouterConnection } = useConnectionStore.getState();

      // Initial update
      setRouterConnection('router-1', {
        status: 'connected',
        protocol: 'api',
        latencyMs: 50,
      });

      // Partial update
      setRouterConnection('router-1', {
        latencyMs: 75,
      });

      const state = useConnectionStore.getState();
      expect(state.routers['router-1'].status).toBe('connected');
      expect(state.routers['router-1'].protocol).toBe('api');
      expect(state.routers['router-1'].latencyMs).toBe(75);
    });

    it('should update latency for a router', () => {
      const { setRouterConnection, updateLatency } = useConnectionStore.getState();

      setRouterConnection('router-1', {
        status: 'connected',
        protocol: 'api',
        latencyMs: 50,
      });

      updateLatency('router-1', 100);

      const state = useConnectionStore.getState();
      expect(state.routers['router-1'].latencyMs).toBe(100);
    });

    it('should clear active router when setting to null', () => {
      const { setActiveRouter, setRouterConnection } = useConnectionStore.getState();

      setRouterConnection('router-1', { status: 'connected' });
      setActiveRouter('router-1');
      expect(useConnectionStore.getState().activeRouterId).toBe('router-1');

      setActiveRouter(null);

      const state = useConnectionStore.getState();
      expect(state.activeRouterId).toBeNull();
    });
  });

  describe('Legacy API Compatibility', () => {
    it('should support setConnected() method', () => {
      const { setConnected } = useConnectionStore.getState();

      setConnected();

      const state = useConnectionStore.getState();
      expect(state.state).toBe('connected');
      expect(state.wsStatus).toBe('connected');
      expect(state.lastConnectedAt).toBeInstanceOf(Date);
    });

    it('should support setDisconnected() method', () => {
      const { setConnected, setDisconnected } = useConnectionStore.getState();

      setConnected();
      setDisconnected();

      const state = useConnectionStore.getState();
      expect(state.state).toBe('disconnected');
      expect(state.wsStatus).toBe('disconnected');
    });

    it('should support setReconnecting() method', () => {
      const { setReconnecting } = useConnectionStore.getState();

      setReconnecting();

      const state = useConnectionStore.getState();
      expect(state.state).toBe('reconnecting');
      expect(state.wsStatus).toBe('connecting');
      expect(state.isReconnecting).toBe(true);
    });

    it('should support setCurrentRouter() method', () => {
      const { setCurrentRouter } = useConnectionStore.getState();

      setCurrentRouter('router-1', '192.168.1.1');

      const state = useConnectionStore.getState();
      expect(state.currentRouterId).toBe('router-1');
      expect(state.currentRouterIp).toBe('192.168.1.1');
      expect(state.activeRouterId).toBe('router-1');
      expect(state.wsStatus).toBe('connected');
    });

    it('should support clearCurrentRouter() method', () => {
      const { setCurrentRouter, clearCurrentRouter } = useConnectionStore.getState();

      setCurrentRouter('router-1', '192.168.1.1');
      clearCurrentRouter();

      const state = useConnectionStore.getState();
      expect(state.currentRouterId).toBeNull();
      expect(state.currentRouterIp).toBeNull();
      expect(state.activeRouterId).toBeNull();
      expect(state.wsStatus).toBe('disconnected');
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
      const { setWsStatus, setRouterConnection } = useConnectionStore.getState();

      setWsStatus('connected');
      setRouterConnection('router-1', {
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

  describe('State Management', () => {
    it('should properly manage complex connection flow', () => {
      const {
        setWsStatus,
        setRouterConnection,
        setActiveRouter,
        incrementReconnectAttempts,
        resetReconnection,
      } = useConnectionStore.getState();

      // Setup state
      setWsStatus('connecting');
      incrementReconnectAttempts();
      setRouterConnection('router-1', { status: 'connecting' });
      setActiveRouter('router-1');

      let state = useConnectionStore.getState();
      expect(state.wsStatus).toBe('connecting');
      expect(state.reconnectAttempts).toBe(1);
      expect(state.activeRouterId).toBe('router-1');

      // Transition to connected
      setWsStatus('connected');
      setRouterConnection('router-1', { status: 'connected' });
      resetReconnection();

      state = useConnectionStore.getState();
      expect(state.wsStatus).toBe('connected');
      expect(state.reconnectAttempts).toBe(0);
      expect(state.isReconnecting).toBe(false);
    });
  });
});
