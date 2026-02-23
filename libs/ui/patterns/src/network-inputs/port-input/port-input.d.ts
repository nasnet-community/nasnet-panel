/**
 * PortInput - Auto-Detecting Port Input Component
 *
 * Main component that automatically selects the appropriate presenter
 * based on the current platform (mobile vs desktop).
 *
 * @example
 * ```tsx
 * import { PortInput } from '@nasnet/ui/patterns';
 *
 * // Basic single port input
 * <PortInput value={port} onChange={setPort} />
 *
 * // Range mode with protocol badge
 * <PortInput
 *   mode="range"
 *   value={portRange}
 *   onChange={setPortRange}
 *   protocol="tcp"
 * />
 *
 * // Multi-port mode with suggestions
 * <PortInput
 *   mode="multi"
 *   value={ports}
 *   onChange={setPorts}
 *   showSuggestions
 * />
 * ```
 *
 * @module @nasnet/ui/patterns/network-inputs/port-input
 */
import type { PortInputProps } from './port-input.types';
/**
 * Auto-detecting port input component.
 *
 * Uses usePlatform() hook to detect the current platform and renders
 * the appropriate presenter:
 * - Mobile (<640px): Touch-optimized with 44px targets, stacked range inputs
 * - Desktop (>=640px): Compact layout with side-by-side range inputs
 *
 * @param props - PortInputProps
 */
export declare const PortInput: import("react").NamedExoticComponent<PortInputProps>;
export default PortInput;
//# sourceMappingURL=port-input.d.ts.map