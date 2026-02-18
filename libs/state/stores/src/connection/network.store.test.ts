/**
 * Network Store Tests
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  useNetworkStore,
  selectIsFullyConnected,
  selectIsDegraded,
  selectIsOffline,
  selectNetworkQuality,
  selectLatency,
  selectWasOffline,
} from './network.store';

describe('useNetworkStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useNetworkStore.setState({
      isOnline: true,
      isRouterReachable: false,
      isRouterConnected: false,
      lastSuccessfulRequest: null,
      reconnectAttempts: 0,
      wasOffline: false,
      quality: 'good',
      latencyMs: null,
      lastError: null,
      lastErrorTime: null,
      listenersInitialized: false,
    });
  });

  describe('basic state', () => {
    it('has correct initial state', () => {
      const state = useNetworkStore.getState();
      expect(state.isOnline).toBe(true);
      expect(state.isRouterReachable).toBe(false);
      expect(state.isRouterConnected).toBe(false);
      expect(state.reconnectAttempts).toBe(0);
      expect(state.quality).toBe('good');
    });

    it('setOnline updates online status', () => {
      useNetworkStore.getState().setOnline(false);
      expect(useNetworkStore.getState().isOnline).toBe(false);
      expect(useNetworkStore.getState().quality).toBe('offline');
    });

    it('setRouterReachable updates reachability', () => {
      useNetworkStore.getState().setRouterReachable(true);
      expect(useNetworkStore.getState().isRouterReachable).toBe(true);
    });

    it('setRouterConnected updates connection status', () => {
      useNetworkStore.getState().setRouterConnected(true);
      expect(useNetworkStore.getState().isRouterConnected).toBe(true);
    });
  });

  describe('reconnect attempts', () => {
    it('incrementReconnectAttempts increases counter', () => {
      useNetworkStore.getState().incrementReconnectAttempts();
      expect(useNetworkStore.getState().reconnectAttempts).toBe(1);

      useNetworkStore.getState().incrementReconnectAttempts();
      expect(useNetworkStore.getState().reconnectAttempts).toBe(2);
    });

    it('resetReconnectAttempts resets counter', () => {
      useNetworkStore.getState().incrementReconnectAttempts();
      useNetworkStore.getState().incrementReconnectAttempts();
      useNetworkStore.getState().resetReconnectAttempts();
      expect(useNetworkStore.getState().reconnectAttempts).toBe(0);
    });

    it('setRouterReachable(true) resets reconnect attempts', () => {
      useNetworkStore.getState().incrementReconnectAttempts();
      useNetworkStore.getState().incrementReconnectAttempts();
      useNetworkStore.getState().setRouterReachable(true);
      expect(useNetworkStore.getState().reconnectAttempts).toBe(0);
    });

    it('setRouterConnected(true) resets reconnect attempts', () => {
      useNetworkStore.getState().incrementReconnectAttempts();
      useNetworkStore.getState().setRouterConnected(true);
      expect(useNetworkStore.getState().reconnectAttempts).toBe(0);
    });
  });

  describe('successful request tracking', () => {
    it('recordSuccessfulRequest updates timestamp', () => {
      expect(useNetworkStore.getState().lastSuccessfulRequest).toBeNull();

      useNetworkStore.getState().recordSuccessfulRequest();

      const state = useNetworkStore.getState();
      expect(state.lastSuccessfulRequest).toBeInstanceOf(Date);
      expect(state.reconnectAttempts).toBe(0);
      expect(state.lastError).toBeNull();
    });
  });

  describe('network quality (NAS-4.15)', () => {
    it('setQuality updates quality', () => {
      useNetworkStore.getState().setQuality('excellent');
      expect(useNetworkStore.getState().quality).toBe('excellent');

      useNetworkStore.getState().setQuality('poor');
      expect(useNetworkStore.getState().quality).toBe('poor');
    });

    it('updateLatency updates latency and quality', () => {
      useNetworkStore.getState().updateLatency(50);
      expect(useNetworkStore.getState().latencyMs).toBe(50);
      expect(useNetworkStore.getState().quality).toBe('excellent');

      useNetworkStore.getState().updateLatency(200);
      expect(useNetworkStore.getState().latencyMs).toBe(200);
      expect(useNetworkStore.getState().quality).toBe('good');

      useNetworkStore.getState().updateLatency(500);
      expect(useNetworkStore.getState().latencyMs).toBe(500);
      expect(useNetworkStore.getState().quality).toBe('poor');
    });

    it('going offline sets quality to offline', () => {
      useNetworkStore.getState().updateLatency(50);
      expect(useNetworkStore.getState().quality).toBe('excellent');

      useNetworkStore.getState().setOnline(false);
      expect(useNetworkStore.getState().quality).toBe('offline');
    });
  });

  describe('wasOffline tracking (NAS-4.15)', () => {
    it('tracks when app was offline and comes back online', () => {
      expect(useNetworkStore.getState().wasOffline).toBe(false);

      useNetworkStore.getState().setOnline(false);
      expect(useNetworkStore.getState().wasOffline).toBe(false); // Not set until coming back online

      useNetworkStore.getState().setOnline(true);
      expect(useNetworkStore.getState().wasOffline).toBe(true);
    });

    it('clearWasOffline clears the flag', () => {
      useNetworkStore.getState().setOnline(false);
      useNetworkStore.getState().setOnline(true);
      expect(useNetworkStore.getState().wasOffline).toBe(true);

      useNetworkStore.getState().clearWasOffline();
      expect(useNetworkStore.getState().wasOffline).toBe(false);
    });
  });

  describe('error tracking (NAS-4.15)', () => {
    it('recordNetworkError stores error and timestamp', () => {
      expect(useNetworkStore.getState().lastError).toBeNull();
      expect(useNetworkStore.getState().lastErrorTime).toBeNull();

      useNetworkStore.getState().recordNetworkError('Connection refused');

      const state = useNetworkStore.getState();
      expect(state.lastError).toBe('Connection refused');
      expect(state.lastErrorTime).toBeInstanceOf(Date);
    });

    it('recordSuccessfulRequest clears error', () => {
      useNetworkStore.getState().recordNetworkError('Some error');
      expect(useNetworkStore.getState().lastError).toBe('Some error');

      useNetworkStore.getState().recordSuccessfulRequest();
      expect(useNetworkStore.getState().lastError).toBeNull();
    });
  });
});

describe('selectors', () => {
  beforeEach(() => {
    useNetworkStore.setState({
      isOnline: true,
      isRouterReachable: false,
      isRouterConnected: false,
      lastSuccessfulRequest: null,
      reconnectAttempts: 0,
      wasOffline: false,
      quality: 'good',
      latencyMs: null,
      lastError: null,
      lastErrorTime: null,
      listenersInitialized: false,
    });
  });

  describe('selectIsFullyConnected', () => {
    it('returns false when any connection is missing', () => {
      expect(selectIsFullyConnected(useNetworkStore.getState())).toBe(false);

      useNetworkStore.setState({ isRouterReachable: true });
      expect(selectIsFullyConnected(useNetworkStore.getState())).toBe(false);

      useNetworkStore.setState({ isRouterConnected: true });
      expect(selectIsFullyConnected(useNetworkStore.getState())).toBe(true);
    });

    it('returns true when all connections are active', () => {
      useNetworkStore.setState({
        isOnline: true,
        isRouterReachable: true,
        isRouterConnected: true,
      });
      expect(selectIsFullyConnected(useNetworkStore.getState())).toBe(true);
    });
  });

  describe('selectIsDegraded', () => {
    it('returns true when online but backend not reachable', () => {
      useNetworkStore.setState({
        isOnline: true,
        isRouterReachable: false,
        isRouterConnected: false,
      });
      expect(selectIsDegraded(useNetworkStore.getState())).toBe(true);
    });

    it('returns true when online but WebSocket not connected', () => {
      useNetworkStore.setState({
        isOnline: true,
        isRouterReachable: true,
        isRouterConnected: false,
      });
      expect(selectIsDegraded(useNetworkStore.getState())).toBe(true);
    });

    it('returns false when fully connected', () => {
      useNetworkStore.setState({
        isOnline: true,
        isRouterReachable: true,
        isRouterConnected: true,
      });
      expect(selectIsDegraded(useNetworkStore.getState())).toBe(false);
    });

    it('returns false when offline (not degraded, just offline)', () => {
      useNetworkStore.setState({
        isOnline: false,
        isRouterReachable: false,
        isRouterConnected: false,
      });
      expect(selectIsDegraded(useNetworkStore.getState())).toBe(false);
    });
  });

  describe('selectIsOffline', () => {
    it('returns true when offline', () => {
      useNetworkStore.setState({ isOnline: false });
      expect(selectIsOffline(useNetworkStore.getState())).toBe(true);
    });

    it('returns false when online', () => {
      useNetworkStore.setState({ isOnline: true });
      expect(selectIsOffline(useNetworkStore.getState())).toBe(false);
    });
  });

  describe('NAS-4.15 selectors', () => {
    it('selectNetworkQuality returns quality', () => {
      useNetworkStore.setState({ quality: 'excellent' });
      expect(selectNetworkQuality(useNetworkStore.getState())).toBe('excellent');
    });

    it('selectLatency returns latency', () => {
      useNetworkStore.setState({ latencyMs: 150 });
      expect(selectLatency(useNetworkStore.getState())).toBe(150);
    });

    it('selectWasOffline returns wasOffline flag', () => {
      useNetworkStore.setState({ wasOffline: true });
      expect(selectWasOffline(useNetworkStore.getState())).toBe(true);
    });
  });
});
