/**
 * Device Card Pattern Component
 *
 * Displays discovered network devices with type detection, online status,
 * vendor lookup, and interactive actions.
 *
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */
export { DeviceCard } from './device-card';
export { DeviceCardDesktop } from './device-card-desktop';
export { DeviceCardMobile } from './device-card-mobile';
export { DeviceCardCompact } from './device-card-compact';
export { DeviceCardBase, statusDotVariants, statusBadgeVariants, connectionBadgeVariants, cardVariants, } from './device-card-base';
export { useDeviceCard, DEVICE_ICON_MAP, CONNECTION_ICON_MAP, DEVICE_TYPE_LABELS, CONNECTION_TYPE_LABELS, CONFIDENCE_THRESHOLD, formatMacAddress, } from './use-device-card';
export { useDeviceStatusSubscription, withDeviceStatusSubscription, DEVICE_STATUS_SUBSCRIPTION, } from './use-device-status-subscription';
export type { DeviceType, ConnectionType, DeviceStatus, DiscoveredDevice, DeviceCardProps, UseDeviceCardConfig, UseDeviceCardReturn, DeviceCardPresenterProps, DeviceCardBaseProps, } from './device-card.types';
export type { DeviceStatusUpdate, UseDeviceStatusSubscriptionConfig, UseDeviceStatusSubscriptionReturn, } from './use-device-status-subscription';
//# sourceMappingURL=index.d.ts.map