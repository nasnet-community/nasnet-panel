/**
 * InterfaceSelector - Auto-Detecting Interface Selector Component
 *
 * Main component that automatically selects the appropriate presenter
 * based on the current platform (mobile vs desktop).
 *
 * @example
 * ```tsx
 * import { InterfaceSelector } from '@nasnet/ui/patterns';
 *
 * // Basic usage - auto-detects platform
 * <InterfaceSelector
 *   routerId="router-1"
 *   value={selectedInterface}
 *   onChange={setSelectedInterface}
 * />
 *
 * // Multi-select mode
 * <InterfaceSelector
 *   routerId="router-1"
 *   value={selectedInterfaces}
 *   onChange={setSelectedInterfaces}
 *   multiple
 * />
 *
 * // Filter by type
 * <InterfaceSelector
 *   routerId="router-1"
 *   types={['ethernet', 'bridge']}
 * />
 * ```
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { InterfaceSelectorDesktop } from './interface-selector-desktop';
import { InterfaceSelectorMobile } from './interface-selector-mobile';

import type { InterfaceSelectorProps } from './interface-selector.types';

/**
 * Auto-detecting interface selector component.
 *
 * Uses usePlatform() hook to detect the current platform and renders
 * the appropriate presenter:
 * - Mobile (<640px): Bottom sheet with 44px touch targets
 * - Desktop (>=640px): Popover dropdown with keyboard navigation
 *
 * @param props - InterfaceSelectorProps
 */
export const InterfaceSelector = memo(function InterfaceSelector(props: InterfaceSelectorProps) {
  const platform = usePlatform();

  // Use mobile presenter for mobile (touch devices)
  if (platform === 'mobile') {
    return <InterfaceSelectorMobile {...props} />;
  }

  // Desktop presenter for desktop and tablet
  return <InterfaceSelectorDesktop {...props} />;
});

InterfaceSelector.displayName = 'InterfaceSelector';

export default InterfaceSelector;
