/**
 * Kill Switch Toggle Pattern Component
 *
 * Adaptive component that renders platform-specific presenters.
 * Automatically detects screen size and renders the appropriate version.
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';

import { KillSwitchToggleDesktop } from './KillSwitchToggleDesktop';
import { KillSwitchToggleMobile } from './KillSwitchToggleMobile';

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
const KillSwitchToggle = memo(function KillSwitchToggleComponent(props: KillSwitchToggleProps) {
  const platform = usePlatform();

  if (platform === 'mobile') {
    return <KillSwitchToggleMobile {...props} />;
  }

  return <KillSwitchToggleDesktop {...props} />;
});

KillSwitchToggle.displayName = 'KillSwitchToggle';

// Re-export types
export type { KillSwitchToggleProps, KillSwitchMode, VirtualInterfaceOption } from './types';

// Re-export main component
export { KillSwitchToggle };

// Re-export presenters for direct use (testing, Storybook, etc.)
export { KillSwitchToggleDesktop } from './KillSwitchToggleDesktop';
export { KillSwitchToggleMobile } from './KillSwitchToggleMobile';

// Re-export hook for custom implementations
export { useKillSwitchToggle } from './useKillSwitchToggle';
export type { UseKillSwitchToggleReturn } from './types';
