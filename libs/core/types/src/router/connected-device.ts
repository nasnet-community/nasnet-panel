/**
 * Connected Device Type Definitions
 * For NasNetConnect Epic 5 - Story 5.4: DHCP Leases and Active Connections Display
 *
 * @module @nasnet/core/types/router/connected-device
 */

import type { LeaseDisplayRow, DHCPLease } from './dhcp';

/**
 * Device type classification for connected network devices
 * Used for icon selection and device categorization
 */
export enum DeviceType {
  SMARTPHONE = 'smartphone',
  TABLET = 'tablet',
  LAPTOP = 'laptop',
  DESKTOP = 'desktop',
  ROUTER = 'router',
  IOT = 'iot',
  PRINTER = 'printer',
  TV = 'tv',
  GAMING_CONSOLE = 'gaming_console',
  UNKNOWN = 'unknown',
}

/**
 * Enriched device information extending LeaseDisplayRow
 * with additional computed fields for connected device monitoring
 */
export interface ConnectedDeviceEnriched extends LeaseDisplayRow {
  /** Device manufacturer from OUI lookup */
  vendor: string | null;

  /** Inferred device type based on hostname and vendor */
  deviceType: DeviceType;

  /** True if connected in last 30 seconds (for "New" badge display) */
  isNew: boolean;

  /** Human-readable duration since first seen (e.g., "2h 15m") */
  connectionDuration: string;

  /** Timestamp when device was first detected this session */
  firstSeen: Date;

  /** Original lease data for detail view */
  _lease: DHCPLease;
}
