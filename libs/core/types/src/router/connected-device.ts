/**
 * Connected Device Type Definitions
 * For NasNetConnect Epic 5 - Story 5.4: DHCP Leases and Active Connections Display
 *
 * Provides device classification and enriched DHCP lease information for tracking
 * connected devices on the network.
 *
 * @module @nasnet/core/types/router/connected-device
 */

import type { LeaseDisplayRow, DHCPLease } from './dhcp';

/**
 * Device type classification for connected network devices
 *
 * @remarks
 * Used for icon selection and device categorization in the UI
 * Inferred from MAC address OUI lookup, hostname analysis, and DHCP fingerprinting
 *
 * @example
 * ```typescript
 * const type: DeviceType = DeviceType.SMARTPHONE;
 * if (type === DeviceType.SMARTPHONE) { // show mobile icon }
 * ```
 */
export enum DeviceType {
  /** Mobile phone (iOS/Android) */
  SMARTPHONE = 'smartphone',

  /** Tablet device (iPad, Android tablet) */
  TABLET = 'tablet',

  /** Laptop or notebook computer */
  LAPTOP = 'laptop',

  /** Desktop computer */
  DESKTOP = 'desktop',

  /** Network router or gateway device */
  ROUTER = 'router',

  /** Internet of Things device (smart home, sensors, etc.) */
  IOT = 'iot',

  /** Network printer or multifunction device */
  PRINTER = 'printer',

  /** Television or streaming device */
  TV = 'tv',

  /** Gaming console (PlayStation, Xbox, Nintendo) */
  GAMING_CONSOLE = 'gaming_console',

  /** Device type could not be determined */
  UNKNOWN = 'unknown',
}

/**
 * Enriched device information extending LeaseDisplayRow
 * with additional computed fields for connected device monitoring
 *
 * @remarks
 * Combines DHCP lease data with device classification and connection tracking.
 * This interface is returned by the dashboard's connected devices API and includes
 * enriched metadata computed from the raw DHCP lease.
 *
 * @example
 * ```typescript
 * const device: ConnectedDeviceEnriched = {
 *   // ... LeaseDisplayRow fields ...
 *   vendor: 'Apple Inc.',
 *   deviceType: DeviceType.SMARTPHONE,
 *   isNew: true,
 *   connectionDuration: '5m 30s',
 *   firstSeen: new Date('2025-02-21T10:15:00Z'),
 *   _lease: { ...rawDHCPLease }
 * };
 * ```
 */
export interface ConnectedDeviceEnriched extends LeaseDisplayRow {
  /** Device manufacturer/vendor from OUI (Organizationally Unique Identifier) lookup */
  vendor: string | null;

  /** Inferred device type based on hostname pattern matching and vendor analysis */
  deviceType: DeviceType;

  /** Whether this device connected within the last 30 seconds (for "New" badge display) */
  isNew: boolean;

  /** Human-readable duration since first detection (e.g., "2h 15m", "5s") */
  connectionDuration: string;

  /** Timestamp when device was first detected in this monitoring session */
  firstSeen: Date;

  /** Original DHCP lease data for detail view and debugging purposes */
  _lease: DHCPLease;
}
