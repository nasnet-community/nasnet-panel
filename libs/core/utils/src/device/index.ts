/**
 * Device utility functions barrel export
 *
 * Provides device type detection and icon mapping utilities for DHCP leases and active connections.
 *
 * @example
 * ```ts
 * import { detectDeviceType, DEVICE_TYPE_LABELS } from '@nasnet/core/utils/device';
 *
 * const deviceType = detectDeviceType('iPhone-12', 'Apple Inc.');
 * console.log(DEVICE_TYPE_LABELS[deviceType]); // 'Smartphone'
 * ```
 *
 * @module @nasnet/core/utils/device
 */

export * from './deviceTypeDetection';
