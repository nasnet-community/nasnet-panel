/**
 * useDeviceCard Hook
 *
 * Headless hook for device card logic.
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * All business logic is contained here - presenters only handle rendering.
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */
import type { UseDeviceCardConfig, UseDeviceCardReturn, DeviceType, ConnectionType } from './device-card.types';
import type { LucideIcon } from 'lucide-react';
/**
 * Confidence threshold for showing indicator
 * Show indicator when confidence is below this value
 */
declare const CONFIDENCE_THRESHOLD = 90;
/**
 * Device type to icon mapping
 */
declare const DEVICE_ICON_MAP: Record<DeviceType, LucideIcon>;
/**
 * Connection type to icon mapping
 */
declare const CONNECTION_ICON_MAP: Record<ConnectionType, LucideIcon>;
/**
 * Device type to human-readable label mapping
 */
declare const DEVICE_TYPE_LABELS: Record<DeviceType, string>;
/**
 * Connection type to human-readable label mapping
 */
declare const CONNECTION_TYPE_LABELS: Record<ConnectionType, string>;
/**
 * Format MAC address for display
 * Ensures consistent formatting with colons
 */
declare function formatMacAddress(mac: string): string;
/**
 * Headless hook for device card component.
 *
 * Encapsulates all logic for:
 * - Display name resolution (customName > hostname > MAC)
 * - Device type icon selection
 * - Status color determination
 * - Connection type handling
 * - Action handlers
 * - ARIA label generation
 *
 * @param config - Configuration options
 * @returns Computed state for presenters
 *
 * @example
 * ```tsx
 * const state = useDeviceCard({
 *   device: discoveredDevice,
 *   onConfigure: (device) => openConfigDialog(device),
 *   onBlock: (device) => blockDevice(device),
 *   onRename: (device, name) => renameDevice(device, name),
 * });
 *
 * // state.displayName === 'iPhone-John' (or hostname or MAC)
 * // state.deviceIcon === Smartphone
 * // state.isOnline === true
 * // state.statusColor === 'success'
 * ```
 */
export declare function useDeviceCard(config: UseDeviceCardConfig): UseDeviceCardReturn;
/**
 * Export constants for testing and documentation
 */
export { DEVICE_ICON_MAP, CONNECTION_ICON_MAP, DEVICE_TYPE_LABELS, CONNECTION_TYPE_LABELS, CONFIDENCE_THRESHOLD, formatMacAddress, };
//# sourceMappingURL=use-device-card.d.ts.map