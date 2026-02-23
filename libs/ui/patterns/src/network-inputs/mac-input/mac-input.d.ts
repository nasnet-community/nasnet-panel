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
export declare const MACInput: import("react").NamedExoticComponent<MACInputProps>;
export default MACInput;
//# sourceMappingURL=mac-input.d.ts.map