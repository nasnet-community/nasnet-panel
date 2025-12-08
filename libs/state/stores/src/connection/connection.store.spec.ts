import { describe, it, expect, beforeEach } from 'vitest';
import { useConnectionStore } from './connection.store';

describe('useConnectionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useConnectionStore.setState({
      state: 'disconnected',
      lastConnectedAt: null,
    });
  });

  describe('Initial State', () => {
    it('should initialize with disconnected state', () => {
      const { state, lastConnectedAt } = useConnectionStore.getState();
      expect(state).toBe('disconnected');
      expect(lastConnectedAt).toBeNull();
    });
  });

  describe('State Transitions', () => {
    it('should transition to connected state and set timestamp', () => {
      const beforeTimestamp = Date.now();

      useConnectionStore.getState().setConnected();

      const { state, lastConnectedAt } = useConnectionStore.getState();
      expect(state).toBe('connected');
      expect(lastConnectedAt).toBeInstanceOf(Date);
      expect(lastConnectedAt!.getTime()).toBeGreaterThanOrEqual(beforeTimestamp);
    });

    it('should transition to disconnected state', () => {
      // First connect
      useConnectionStore.getState().setConnected();
      expect(useConnectionStore.getState().state).toBe('connected');

      // Then disconnect
      useConnectionStore.getState().setDisconnected();

      const { state } = useConnectionStore.getState();
      expect(state).toBe('disconnected');
    });

    it('should transition to reconnecting state', () => {
      useConnectionStore.getState().setReconnecting();

      const { state } = useConnectionStore.getState();
      expect(state).toBe('reconnecting');
    });

    it('should preserve lastConnectedAt when transitioning to disconnected', () => {
      // Connect to set timestamp
      useConnectionStore.getState().setConnected();
      const connectedTimestamp = useConnectionStore.getState().lastConnectedAt;

      // Disconnect
      useConnectionStore.getState().setDisconnected();

      // lastConnectedAt should still be preserved
      const { lastConnectedAt } = useConnectionStore.getState();
      expect(lastConnectedAt).toBe(connectedTimestamp);
    });

    it('should preserve lastConnectedAt when transitioning to reconnecting', () => {
      // Connect to set timestamp
      useConnectionStore.getState().setConnected();
      const connectedTimestamp = useConnectionStore.getState().lastConnectedAt;

      // Reconnecting
      useConnectionStore.getState().setReconnecting();

      // lastConnectedAt should still be preserved
      const { lastConnectedAt } = useConnectionStore.getState();
      expect(lastConnectedAt).toBe(connectedTimestamp);
    });

    it('should update lastConnectedAt on reconnection', () => {
      // First connection
      useConnectionStore.getState().setConnected();
      const firstTimestamp = useConnectionStore.getState().lastConnectedAt;

      // Wait a tiny bit
      const waitPromise = new Promise(resolve => setTimeout(resolve, 5));

      waitPromise.then(() => {
        // Disconnect
        useConnectionStore.getState().setDisconnected();

        // Reconnect
        useConnectionStore.getState().setConnected();
        const secondTimestamp = useConnectionStore.getState().lastConnectedAt;

        // Second timestamp should be newer
        expect(secondTimestamp!.getTime()).toBeGreaterThanOrEqual(
          firstTimestamp!.getTime()
        );
      });
    });
  });

  describe('Connection Flow Scenarios', () => {
    it('should handle initial connection flow', () => {
      // Start disconnected
      expect(useConnectionStore.getState().state).toBe('disconnected');

      // Attempt connection (reconnecting)
      useConnectionStore.getState().setReconnecting();
      expect(useConnectionStore.getState().state).toBe('reconnecting');

      // Successful connection
      useConnectionStore.getState().setConnected();
      const { state, lastConnectedAt } = useConnectionStore.getState();
      expect(state).toBe('connected');
      expect(lastConnectedAt).toBeInstanceOf(Date);
    });

    it('should handle connection loss and recovery', () => {
      // Connect
      useConnectionStore.getState().setConnected();
      const originalTimestamp = useConnectionStore.getState().lastConnectedAt;
      expect(useConnectionStore.getState().state).toBe('connected');

      // Lose connection
      useConnectionStore.getState().setDisconnected();
      expect(useConnectionStore.getState().state).toBe('disconnected');

      // Attempt reconnection
      useConnectionStore.getState().setReconnecting();
      expect(useConnectionStore.getState().state).toBe('reconnecting');

      // Successful reconnection
      useConnectionStore.getState().setConnected();
      const { state, lastConnectedAt } = useConnectionStore.getState();
      expect(state).toBe('connected');
      expect(lastConnectedAt).toBeInstanceOf(Date);
      expect(lastConnectedAt!.getTime()).toBeGreaterThanOrEqual(
        originalTimestamp!.getTime()
      );
    });

    it('should handle multiple disconnection attempts', () => {
      // Connect
      useConnectionStore.getState().setConnected();

      // Multiple disconnections (should be idempotent)
      useConnectionStore.getState().setDisconnected();
      useConnectionStore.getState().setDisconnected();
      useConnectionStore.getState().setDisconnected();

      expect(useConnectionStore.getState().state).toBe('disconnected');
    });

    it('should handle multiple reconnection attempts', () => {
      // Multiple reconnecting calls (should be idempotent)
      useConnectionStore.getState().setReconnecting();
      useConnectionStore.getState().setReconnecting();
      useConnectionStore.getState().setReconnecting();

      expect(useConnectionStore.getState().state).toBe('reconnecting');
    });
  });

  describe('Type Safety', () => {
    it('should only allow valid connection states', () => {
      const { state } = useConnectionStore.getState();

      // TypeScript ensures state can only be one of these values
      const validStates: Array<typeof state> = [
        'connected',
        'disconnected',
        'reconnecting',
      ];

      expect(validStates).toContain(state);
    });
  });

  describe('Store Subscription', () => {
    it('should notify subscribers on state change', () => {
      let notificationCount = 0;

      const unsubscribe = useConnectionStore.subscribe(() => {
        notificationCount++;
      });

      useConnectionStore.getState().setConnected();
      expect(notificationCount).toBe(1);

      useConnectionStore.getState().setDisconnected();
      expect(notificationCount).toBe(2);

      useConnectionStore.getState().setReconnecting();
      expect(notificationCount).toBe(3);

      unsubscribe();
    });

    it('should allow selective subscription to state property', () => {
      let stateChanges = 0;

      const unsubscribe = useConnectionStore.subscribe(
        (state) => state.state,
        () => {
          stateChanges++;
        }
      );

      useConnectionStore.getState().setConnected();
      expect(stateChanges).toBe(1);

      useConnectionStore.getState().setDisconnected();
      expect(stateChanges).toBe(2);

      unsubscribe();
    });
  });
});
