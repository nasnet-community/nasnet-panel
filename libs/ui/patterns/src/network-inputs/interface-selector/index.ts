/**
 * Interface Selector Component
 *
 * A specialized selector for router network interfaces with:
 * - Real-time status indicators (up/down/disabled)
 * - Type filtering (Ethernet, Bridge, VLAN, Wireless, VPN, etc.)
 * - Usage warnings for already-assigned interfaces
 * - Multi-select mode with chips
 * - Search/quick filter functionality
 * - Platform-responsive design (mobile bottom sheet, desktop popover)
 * - Full keyboard navigation
 * - WCAG AAA accessibility compliance
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
 *
 * // Hide already-used interfaces
 * <InterfaceSelector
 *   routerId="router-1"
 *   excludeUsed
 * />
 * ```
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */

// Main component (auto-detecting wrapper)
export { InterfaceSelector } from './interface-selector';
export { default } from './interface-selector';

// Platform-specific presenters
export { InterfaceSelectorDesktop } from './interface-selector-desktop';
export { InterfaceSelectorMobile } from './interface-selector-mobile';

// Headless hook
export { useInterfaceSelector } from './use-interface-selector';

// Sub-components (for composition)
export { InterfaceItem, InterfaceItemMobile } from './interface-item';
export { InterfaceTypeIcon, getInterfaceTypeLabel } from './interface-type-icon';
export { InterfaceTypeFilter } from './interface-type-filter';

// Types
export type {
  InterfaceType,
  InterfaceStatus,
  RouterInterface,
  InterfaceSelectorProps,
  InterfaceSelectorDesktopProps,
  InterfaceSelectorMobileProps,
  UseInterfaceSelectorReturn,
  InterfaceItemProps,
  InterfaceTypeIconProps,
  InterfaceTypeFilterProps,
} from './interface-selector.types';
