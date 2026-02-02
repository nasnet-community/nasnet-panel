/**
 * IP Address Input Component
 *
 * A specialized input component for entering IPv4/IPv6 addresses with:
 * - Segmented input with auto-advance (desktop)
 * - Smart parsing single input (mobile)
 * - Visual validation feedback
 * - IP type classification (Private, Public, Loopback, etc.)
 * - CIDR suffix support
 * - Full keyboard navigation
 * - WCAG AAA accessibility compliance
 *
 * @example
 * ```tsx
 * import { IPInput } from '@nasnet/ui/patterns';
 *
 * // Basic usage
 * <IPInput value={ip} onChange={setIp} />
 *
 * // With type badge and CIDR support
 * <IPInput
 *   value={ip}
 *   onChange={setIp}
 *   showType
 *   allowCIDR
 * />
 *
 * // IPv6 mode
 * <IPInput version="v6" />
 * ```
 *
 * @module @nasnet/ui/patterns/network-inputs/ip-input
 */

// Main component (auto-detecting wrapper)
export { IPInput } from './ip-input';

// Platform-specific presenters
export { IPInputDesktop } from './ip-input-desktop';
export { IPInputMobile } from './ip-input-mobile';

// Headless hook
export { useIPInput, classifyIP, isValidOctet, isValidIPv4 } from './use-ip-input';

// Types
export type {
  IPInputProps,
  IPInputDesktopProps,
  IPInputMobileProps,
  UseIPInputConfig,
  UseIPInputReturn,
  IPType,
  IPVersion,
} from './ip-input.types';
