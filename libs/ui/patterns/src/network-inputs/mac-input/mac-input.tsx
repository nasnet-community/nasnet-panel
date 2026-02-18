/**
 * MACInput - Auto-Detecting MAC Address Input Component
 *
 * Main component that automatically selects the appropriate presenter
 * based on the current platform (mobile vs desktop).
 *
 * @example
 * ```tsx
 * import { MACInput } from '@nasnet/ui/patterns';
 *
 * // Basic usage - auto-detects platform
 * <MACInput value={mac} onChange={setMac} />
 *
 * // With vendor lookup and custom format
 * <MACInput
 *   value={mac}
 *   onChange={setMac}
 *   format="dash"
 *   showVendor
 * />
 * ```
 *
 * @module @nasnet/ui/patterns/network-inputs/mac-input
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { MACInputDesktop } from './mac-input-desktop';
import { MACInputMobile } from './mac-input-mobile';

import type { MACInputProps } from './mac-input.types';

/**
 * Auto-detecting MAC address input component.
 *
 * Uses usePlatform() hook to detect the current platform and renders
 * the appropriate presenter:
 * - Mobile (<640px): Full-width input with 44px touch targets, vendor below
 * - Desktop (>=640px): Compact input with inline vendor display
 *
 * @param props - MACInputProps
 */
export const MACInput = memo(function MACInput(props: MACInputProps) {
  const platform = usePlatform();

  // Use mobile presenter for mobile and tablet (touch devices)
  if (platform === 'mobile') {
    return <MACInputMobile {...props} />;
  }

  // Desktop presenter for desktop
  return <MACInputDesktop {...props} />;
});

MACInput.displayName = 'MACInput';

export default MACInput;
