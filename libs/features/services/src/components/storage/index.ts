/**
 * External Storage Management Components
 * NAS-8.20: USB/disk storage for service binaries
 *
 * @see Docs/architecture/adrs/017-three-layer-component-architecture.md
 */

// Main component (auto-detects platform)
export { StorageSettings } from './StorageSettings';
export type { StorageSettingsProps } from './StorageSettings';

// Platform presenters
export { StorageSettingsMobile } from './StorageSettingsMobile';
export type { StorageSettingsMobileProps } from './StorageSettingsMobile';

export { StorageSettingsDesktop } from './StorageSettingsDesktop';
export type { StorageSettingsDesktopProps } from './StorageSettingsDesktop';

// Visual components
export { StorageUsageBar } from './StorageUsageBar';
export type { StorageUsageBarProps } from './StorageUsageBar';

export { StorageDisconnectBanner } from './StorageDisconnectBanner';
export type { StorageDisconnectBannerProps } from './StorageDisconnectBanner';

// Headless hook
export { useStorageSettings } from './useStorageSettings';
export type { UseStorageSettingsReturn } from './useStorageSettings';
