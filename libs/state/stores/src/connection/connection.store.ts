import { create } from 'zustand';

/**
 * Connection state type
 * - 'connected': Router is connected and responsive
 * - 'disconnected': Connection lost, not attempting reconnect
 * - 'reconnecting': Attempting to reconnect to router
 */
export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';

/**
 * Connection store state interface
 */
export interface ConnectionStore {
  /**
   * Current connection state
   */
  state: ConnectionState;

  /**
   * Timestamp of last successful connection
   * Null if never connected
   */
  lastConnectedAt: Date | null;

  /**
   * Current router ID (if connected)
   * Null if no router selected
   */
  currentRouterId: string | null;

  /**
   * Current router IP address (if connected)
   * Used to configure API client baseURL
   * Null if no router selected
   */
  currentRouterIp: string | null;

  /**
   * Set connection state to connected
   * Updates lastConnectedAt timestamp
   */
  setConnected: () => void;

  /**
   * Set connection state to disconnected
   * Connection lost, not reconnecting
   */
  setDisconnected: () => void;

  /**
   * Set connection state to reconnecting
   * Attempting to restore connection
   */
  setReconnecting: () => void;

  /**
   * Set the current router (on successful connection)
   * Also sets state to connected
   */
  setCurrentRouter: (id: string, ip: string) => void;

  /**
   * Clear current router (on disconnect or logout)
   * Also sets state to disconnected
   */
  clearCurrentRouter: () => void;
}

/**
 * Zustand store for router connection state
 *
 * Tracks real-time connection status for UI feedback.
 * Does not persist to localStorage - resets on page reload.
 *
 * Usage:
 * ```tsx
 * const { state, setConnected, setDisconnected, setReconnecting } = useConnectionStore();
 *
 * // On connection established
 * setConnected();
 *
 * // On connection lost
 * setDisconnected();
 *
 * // When reconnecting
 * setReconnecting();
 * ```
 *
 * Integration:
 * - Router connection service (Epic 0.1) updates this store
 * - UI components (banner, indicator) consume state
 * - Toast notifications triggered on state transitions
 */
export const useConnectionStore = create<ConnectionStore>((set) => ({
  state: 'disconnected',
  lastConnectedAt: null,
  currentRouterId: null,
  currentRouterIp: null,
  setConnected: () => set({ state: 'connected', lastConnectedAt: new Date() }),
  setDisconnected: () => set({ state: 'disconnected' }),
  setReconnecting: () => set({ state: 'reconnecting' }),
  setCurrentRouter: (id, ip) =>
    set({
      currentRouterId: id,
      currentRouterIp: ip,
      state: 'connected',
      lastConnectedAt: new Date(),
    }),
  clearCurrentRouter: () =>
    set({
      currentRouterId: null,
      currentRouterIp: null,
      state: 'disconnected',
    }),
}));
