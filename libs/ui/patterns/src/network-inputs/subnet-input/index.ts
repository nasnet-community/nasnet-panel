/**
 * SubnetInput Component
 * A subnet/CIDR input with network calculations and overlap detection
 *
 * @module @nasnet/ui/patterns/network-inputs/subnet-input
 */

// Main component (auto-detects platform)
export { SubnetInput, SubnetInputWithRef } from './subnet-input';

// Platform-specific presenters (for advanced use cases)
export { SubnetInputDesktop } from './subnet-input-desktop';
export { SubnetInputMobile } from './subnet-input-mobile';

// Sub-components
export { SubnetCalculations } from './subnet-calculations';
export { PrefixSelector } from './prefix-selector';
export { OverlapWarning, OverlapBadge } from './overlap-warning';

// Headless hook (for custom implementations)
export { useSubnetInput, COMMON_PREFIX_OPTIONS } from './use-subnet-input';

// Types
export type {
  SubnetInputProps,
  SubnetInfo,
  OverlapResult,
  PrefixOption,
  UseSubnetInputReturn,
  SubnetCalculationsProps,
  PrefixSelectorProps,
  OverlapWarningProps,
  SubnetInputPresenterProps,
} from './subnet-input.types';
