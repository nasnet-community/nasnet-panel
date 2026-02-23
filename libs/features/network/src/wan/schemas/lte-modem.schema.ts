/**
 * LTE Modem Configuration Schema
 *
 * Zod validation schema for LTE/4G modem configuration.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 7: LTE Support)
 */

import { z } from 'zod';

/**
 * APN (Access Point Name) validation regex
 * @description Alphanumeric, dots, hyphens allowed for carrier APN names
 */
const APN_VALIDATION_REGEX = /^[a-zA-Z0-9.-]+$/;

/**
 * SIM PIN validation regex
 * @description Validates 4-8 digit PIN format (optional per carrier)
 */
const PIN_VALIDATION_REGEX = /^\d{4,8}$/;

/**
 * LTE Modem Configuration Schema
 */
export const lteModemSchema = z.object({
  /**
   * LTE interface name (e.g., 'lte1', 'lte2')
   */
  interface: z.string().min(1, 'Interface is required'),

  /**
   * Access Point Name (APN) provided by carrier
   */
  apn: z
    .string()
    .min(1, 'APN is required')
    .max(100, 'APN must be less than 100 characters')
    .regex(APN_VALIDATION_REGEX, 'APN can only contain letters, numbers, dots, and hyphens'),

  /**
   * SIM PIN (optional)
   * - Leave empty if SIM has no PIN
   * - 4-8 digits
   */
  pin: z
    .string()
    .optional()
    .refine(
      (val) => !val || PIN_VALIDATION_REGEX.test(val),
      'PIN must be 4-8 digits'
    ),

  /**
   * Username for APN authentication (optional)
   */
  username: z.string().optional(),

  /**
   * Password for APN authentication (optional)
   */
  password: z.string().optional(),

  /**
   * Authentication protocol
   */
  authProtocol: z.enum(['none', 'pap', 'chap']).default('none'),

  /**
   * Set as default route
   */
  isDefaultRoute: z.boolean().default(true),

  /**
   * Enable/disable interface
   */
  enabled: z.boolean().default(true),

  /**
   * MTU (Maximum Transmission Unit)
   * - Default: 1500
   * - Range: 576-1500
   */
  mtu: z
    .number()
    .int()
    .min(576, 'MTU must be at least 576')
    .max(1500, 'MTU cannot exceed 1500')
    .default(1500),

  /**
   * APN profile number (1-10)
   * - Some modems support multiple profiles
   */
  profileNumber: z
    .number()
    .int()
    .min(1, 'Profile number must be 1-10')
    .max(10, 'Profile number must be 1-10')
    .default(1),
});

/**
 * TypeScript type inferred from schema
 */
export type LteModemFormValues = z.infer<typeof lteModemSchema>;

/**
 * Default form values
 */
export const LTE_MODEM_DEFAULT_VALUES: Partial<LteModemFormValues> = {
  apn: '',
  pin: '',
  username: '',
  password: '',
  authProtocol: 'none',
  isDefaultRoute: true,
  enabled: true,
  mtu: 1500,
  profileNumber: 1,
};

/**
 * Common APN presets for popular carriers
 */
export const APN_PRESETS = {
  // United States
  'T-Mobile (US)': { apn: 'fast.t-mobile.com', authProtocol: 'none' as const },
  'AT&T (US)': { apn: 'broadband', authProtocol: 'none' as const },
  'Verizon (US)': { apn: 'vzwinternet', authProtocol: 'none' as const },

  // Europe
  'Vodafone (EU)': { apn: 'internet.vodafone.net', authProtocol: 'none' as const },
  'Orange (EU)': { apn: 'internet', authProtocol: 'none' as const },
  'O2 (UK)': { apn: 'mobile.o2.co.uk', authProtocol: 'none' as const },

  // Asia
  'China Mobile': { apn: 'cmnet', authProtocol: 'none' as const },
  'NTT DoCoMo (JP)': { apn: 'mopera.net', authProtocol: 'pap' as const },

  // Custom (user-defined)
  Custom: { apn: '', authProtocol: 'none' as const },
} as const;

/**
 * Signal strength interpretation
 * @description RSSI (Received Signal Strength Indicator) ranges in dBm with semantic color tokens
 */
export const SIGNAL_STRENGTH_RANGES = {
  EXCELLENT: { min: -70, max: 0, label: 'Excellent', color: 'success' },
  GOOD: { min: -85, max: -70, label: 'Good', color: 'success' },
  FAIR: { min: -100, max: -85, label: 'Fair', color: 'warning' },
  POOR: { min: -120, max: -100, label: 'Poor', color: 'destructive' },
  NO_SIGNAL: { min: -Infinity, max: -120, label: 'No Signal', color: 'destructive' },
} as const;

/**
 * Determine signal strength category from RSSI value (dBm)
 */
export function getSignalStrength(rssi: number) {
  if (rssi >= SIGNAL_STRENGTH_RANGES.EXCELLENT.min) {
    return SIGNAL_STRENGTH_RANGES.EXCELLENT;
  }
  if (rssi >= SIGNAL_STRENGTH_RANGES.GOOD.min) {
    return SIGNAL_STRENGTH_RANGES.GOOD;
  }
  if (rssi >= SIGNAL_STRENGTH_RANGES.FAIR.min) {
    return SIGNAL_STRENGTH_RANGES.FAIR;
  }
  if (rssi >= SIGNAL_STRENGTH_RANGES.POOR.min) {
    return SIGNAL_STRENGTH_RANGES.POOR;
  }
  return SIGNAL_STRENGTH_RANGES.NO_SIGNAL;
}

/**
 * LTE Network Modes
 * @description Available network mode options for LTE modem configuration
 */
export const LTE_NETWORK_MODES = [
  { value: 'auto', label: 'Auto (4G/3G/2G)' },
  { value: 'lte', label: '4G LTE Only' },
  { value: '3g', label: '3G Only' },
  { value: 'gsm', label: '2G GSM Only' },
] as const;

/**
 * Validate APN format
 * @description Client-side helper for APN validation before submission
 * @returns true if APN is valid, false otherwise
 */
export function validateAPN(apn: string): boolean {
  if (!apn || apn.length === 0) return false;
  if (apn.length > 100) return false;
  return APN_VALIDATION_REGEX.test(apn);
}

/**
 * Validate PIN format
 * @description Client-side helper for PIN validation (optional field)
 * @returns true if PIN is empty or valid, false otherwise
 */
export function validatePIN(pin: string): boolean {
  if (!pin || pin.length === 0) return true; // PIN is optional
  return PIN_VALIDATION_REGEX.test(pin);
}
