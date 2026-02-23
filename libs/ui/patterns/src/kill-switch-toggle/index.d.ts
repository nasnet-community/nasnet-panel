/**
 * Kill Switch Toggle Pattern Component
 *
 * Adaptive component that renders platform-specific presenters.
 * Automatically detects screen size and renders the appropriate version.
 */
import type { KillSwitchToggleProps } from './types';
/**
 * Kill Switch Toggle Component
 *
 * Adaptive component following the Headless + Platform Presenter pattern.
 * Automatically renders the appropriate presenter based on screen size:
 * - Mobile (<640px): Mobile presenter with large touch targets
 * - Desktop/Tablet (>=640px): Desktop presenter with dense layout
 *
 * @example
 * ```tsx
 * <KillSwitchToggle
 *   routerId="router-1"
 *   deviceId="device-123"
 *   deviceName="iPhone 15"
 *   availableInterfaces={[
 *     { id: 'vif-backup', label: 'Backup Tor', instanceName: 'Tor Backup' },
 *   ]}
 *   onToggle={(enabled) => console.log('Kill switch:', enabled)}
 *   onChange={(mode, fallbackId) => console.log('Mode:', mode, 'Fallback:', fallbackId)}
 * />
 * ```
 */
declare const KillSwitchToggle: import("react").NamedExoticComponent<KillSwitchToggleProps>;
export type { KillSwitchToggleProps, KillSwitchMode, VirtualInterfaceOption } from './types';
export { KillSwitchToggle };
export { KillSwitchToggleDesktop } from './KillSwitchToggleDesktop';
export { KillSwitchToggleMobile } from './KillSwitchToggleMobile';
export { useKillSwitchToggle } from './useKillSwitchToggle';
export type { UseKillSwitchToggleReturn } from './types';
//# sourceMappingURL=index.d.ts.map