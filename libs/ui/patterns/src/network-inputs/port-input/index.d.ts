/**
 * Port Input Component
 *
 * A specialized input component for entering port numbers with:
 * - Single port validation (1-65535)
 * - Port range support (e.g., 8080-8090)
 * - Multi-port mode with tag-style chips
 * - Service name lookup from well-known ports database
 * - Common port suggestions with category grouping
 * - Platform-responsive design (desktop/mobile)
 * - WCAG AAA accessibility compliance
 *
 * @example
 * ```tsx
 * import { PortInput } from '@nasnet/ui/patterns';
 *
 * // Basic single port input
 * <PortInput value={port} onChange={setPort} />
 *
 * // With service lookup and suggestions
 * <PortInput
 *   value={port}
 *   onChange={setPort}
 *   showService
 *   showSuggestions
 * />
 *
 * // Range mode for firewall rules
 * <PortInput
 *   mode="range"
 *   value="8080-8090"
 *   onChange={setRange}
 *   protocol="tcp"
 * />
 *
 * // Multi-port mode for service definitions
 * <PortInput
 *   mode="multi"
 *   value="80,443,8080"
 *   onChange={setPorts}
 *   showSuggestions
 * />
 * ```
 *
 * @module @nasnet/ui/patterns/network-inputs/port-input
 */
export { PortInput } from './port-input';
export { PortInputDesktop } from './port-input-desktop';
export { PortInputMobile } from './port-input-mobile';
export { usePortInput, isValidPort, parseSinglePort, parsePortRange, parseMultiPorts, getPortValidationError, formatPortDisplay, } from './use-port-input';
export type { PortInputProps, PortInputDesktopProps, PortInputMobileProps, UsePortInputConfig, UsePortInputReturn, PortMode, PortProtocol, PortRange as PortInputRange, PortSuggestion, } from './port-input.types';
//# sourceMappingURL=index.d.ts.map