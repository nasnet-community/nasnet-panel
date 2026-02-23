/**
 * IPInput - Auto-Detecting IP Address Input Component
 *
 * Main component that automatically selects the appropriate presenter
 * based on the current platform (mobile vs desktop).
 *
 * @example
 * ```tsx
 * import { IPInput } from '@nasnet/ui/patterns';
 *
 * // Basic usage - auto-detects platform
 * <IPInput value={ip} onChange={setIp} />
 *
 * // With IP type badge and CIDR support
 * <IPInput
 *   value={ip}
 *   onChange={setIp}
 *   showType
 *   allowCIDR
 * />
 * ```
 *
 * @module @nasnet/ui/patterns/network-inputs/ip-input
 */
import type { IPInputProps } from './ip-input.types';
/**
 * Auto-detecting IP address input component.
 *
 * Uses usePlatform() hook to detect the current platform and renders
 * the appropriate presenter:
 * - Mobile (<640px): Single input with smart parsing, 44px touch targets
 * - Desktop (>=640px): 4-segment input with auto-advance
 *
 * @param props - IPInputProps
 */
export declare const IPInput: import("react").NamedExoticComponent<IPInputProps>;
export default IPInput;
//# sourceMappingURL=ip-input.d.ts.map