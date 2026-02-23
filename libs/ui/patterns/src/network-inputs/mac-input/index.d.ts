/**
 * MAC Address Input Component
 *
 * A specialized input component for entering MAC addresses with:
 * - Multi-format parsing (colon, dash, dot, no separator)
 * - Auto-formatting with uppercase conversion
 * - OUI vendor lookup from embedded database
 * - Visual validation feedback
 * - Platform-responsive design (mobile/desktop)
 * - WCAG AAA accessibility compliance
 *
 * @example
 * ```tsx
 * import { MACInput } from '@nasnet/ui/patterns';
 *
 * // Basic usage
 * <MACInput value={mac} onChange={setMac} />
 *
 * // With vendor lookup and custom format
 * <MACInput
 *   value={mac}
 *   onChange={setMac}
 *   format="dash"
 *   showVendor
 * />
 *
 * // Cisco dot notation
 * <MACInput format="dot" />
 * ```
 *
 * @module @nasnet/ui/patterns/network-inputs/mac-input
 */
export { MACInput } from './mac-input';
export { MACInputDesktop } from './mac-input-desktop';
export { MACInputMobile } from './mac-input-mobile';
export { useMACInput, isValidMAC, normalizeMAC, extractOUI, lookupVendor, } from './use-mac-input';
export type { MACInputProps, MACInputDesktopProps, MACInputMobileProps, UseMACInputConfig, UseMACInputReturn, MACFormat, } from './mac-input.types';
//# sourceMappingURL=index.d.ts.map