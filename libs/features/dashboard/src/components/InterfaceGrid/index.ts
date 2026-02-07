/**
 * InterfaceGrid - Public API
 *
 * This module provides components and utilities for displaying
 * a grid of network interface status cards with real-time updates.
 */

// Main component (default export)
export { InterfaceGrid, default } from './InterfaceGrid';

// Sub-components (for advanced use cases)
export { InterfaceStatusCard } from './InterfaceStatusCard';
export { InterfaceDetailSheet } from './InterfaceDetailSheet';

// Hooks
export { useInterfaces } from './useInterfaces';

// Types
export type {
  InterfaceGridData,
  InterfaceGridProps,
  InterfaceStatusCardProps,
  InterfaceDetailSheetProps,
  InterfaceType,
  InterfaceStatus,
} from './types';

// Utilities (for use in other components)
export {
  formatTrafficRate,
  formatLinkSpeed,
  sortInterfacesByPriority,
  INTERFACE_TYPE_PRIORITY,
} from './utils';
