/**
 * Wireless Settings Validation Schema
 * Zod schema for comprehensive wireless settings validation
 * Implements validation rules for FR0-18: Edit wireless settings
 *
 * @description
 * This module provides field-level and composite validation schemas for WiFi interface configuration.
 * All error messages are actionable and include specific constraints (e.g., min/max values).
 */

import { z } from 'zod';

// ============================================================================
// Constants: WiFi Standard Limits
// ============================================================================

/** WiFi SSID maximum length per 802.11 standard */
const SSID_MAX_LENGTH = 32;

/** WiFi SSID minimum length (non-zero) */
const SSID_MIN_LENGTH = 1;

/** WPA/WPA2/WPA3 password minimum length */
const PASSWORD_MIN_LENGTH = 8;

/** WPA/WPA2/WPA3 password maximum length per standard */
const PASSWORD_MAX_LENGTH = 63;

/** TX Power minimum value in dBm */
const TX_POWER_MIN_DBM = 1;

/** TX Power maximum value in dBm (typical router range) */
const TX_POWER_MAX_DBM = 30;

/** Country code fixed length (ISO 3166-1 alpha-2) */
const COUNTRY_CODE_LENGTH = 2;

// ============================================================================
// Field Schemas
// ============================================================================

/**
 * SSID validation schema
 *
 * @description
 * Network name field validation:
 * - Required field
 * - Length: 1-32 characters (WiFi 802.11 standard)
 * - Character set: printable ASCII only (spaces allowed, no special chars)
 * - Used by: WiFi devices to identify and connect to the network
 */
const ssidSchema = z
  .string()
  .min(SSID_MIN_LENGTH, `SSID must be at least ${SSID_MIN_LENGTH} character`)
  .max(SSID_MAX_LENGTH, `SSID must not exceed ${SSID_MAX_LENGTH} characters (WiFi standard limit)`)
  .regex(
    /^[\x20-\x7E]+$/,
    'SSID must contain only printable ASCII characters (no special symbols)'
  );

/**
 * Password validation schema
 *
 * @description
 * WiFi authentication passphrase validation:
 * - Optional field (blank = open network or keep current password)
 * - When provided: 8-63 characters (WPA/WPA2/WPA3 requirement)
 * - Supports all ASCII characters including symbols
 * - Error messages specify minimum length (8 chars for security) and maximum (63 chars per standard)
 */
const passwordSchema = z
  .string()
  .optional()
  .refine((val) => !val || val.length === 0 || val.length >= PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters (WPA/WPA2/WPA3 security requirement)`,
  })
  .refine((val) => !val || val.length <= PASSWORD_MAX_LENGTH, {
    message: `Password must not exceed ${PASSWORD_MAX_LENGTH} characters (WiFi standard limit)`,
  });

/**
 * Channel validation schema
 *
 * @description
 * Radio frequency channel selection:
 * - Optional field (defaults to auto-selection)
 * - Valid values: 'auto' keyword OR numeric channel number (1-14 for 2.4GHz, 36-165 for 5GHz)
 * - Auto-selection recommended for optimal performance (avoids interference)
 */
const channelSchema = z
  .string()
  .optional()
  .refine((val) => !val || val === 'auto' || /^\d+$/.test(val), {
    message:
      'Channel must be either "auto" (recommended) or a numeric channel number (e.g., 1, 6, 11 for 2.4GHz or 36+ for 5GHz)',
  });

/**
 * Channel width validation schema
 *
 * @description
 * Radio frequency bandwidth selection:
 * - Optional field (defaults to 20MHz for compatibility)
 * - Valid values: 20MHz, 40MHz, 80MHz, 160MHz
 * - Wider channels (80/160MHz) improve throughput but reduce compatibility with older devices
 * - 20MHz recommended for stable coverage
 */
const channelWidthSchema = z
  .enum(['20MHz', '40MHz', '80MHz', '160MHz'], {
    errorMap: () => ({
      message:
        'Channel width must be 20MHz (safe), 40MHz, 80MHz, or 160MHz (high performance only)',
    }),
  })
  .optional();

/**
 * TX Power validation schema
 *
 * @description
 * Transmit power control (radio signal strength):
 * - Optional field (defaults to 17 dBm typical)
 * - Range: 1-30 dBm
 * - Lower values: reduce interference, save power, shorter range
 * - Higher values: increase coverage but may exceed regulatory limits per country
 * - Cannot be set above regulatory limit for selected country code
 */
const txPowerSchema = z
  .number()
  .min(TX_POWER_MIN_DBM, `TX Power must be at least ${TX_POWER_MIN_DBM} dBm (reduces interference)`)
  .max(
    TX_POWER_MAX_DBM,
    `TX Power must not exceed ${TX_POWER_MAX_DBM} dBm (regulatory limit for most regions)`
  )
  .optional();

/**
 * Hide SSID validation schema
 *
 * @description
 * Network visibility control:
 * - Optional boolean field (defaults to false/visible)
 * - When true: SSID not broadcast in WiFi networks list
 * - Caution: Hiding SSID provides minimal security; devices must know network name to connect
 */
const hideSsidSchema = z.boolean().optional();

/**
 * Security mode validation schema
 *
 * @description
 * WiFi authentication and encryption standard selection:
 * - Optional field (defaults to WPA2-PSK for compatibility)
 * - none: Open network (no authentication or encryption)
 * - wpa2-psk: WPA2 with Pre-Shared Key (widely compatible, secure)
 * - wpa3-psk: WPA3 with Pre-Shared Key (newest standard, best security)
 * - wpa2-wpa3-psk: Mixed mode (supports both WPA2 and WPA3 devices simultaneously)
 * - Recommended: wpa3-psk or wpa2-wpa3-psk for security; wpa2-psk for compatibility with older devices
 */
const securityModeSchema = z
  .enum(['none', 'wpa2-psk', 'wpa3-psk', 'wpa2-wpa3-psk'], {
    errorMap: () => ({
      message:
        'Security mode must be "none" (open), "wpa2-psk" (compatible), "wpa3-psk" (newest), or "wpa2-wpa3-psk" (mixed)',
    }),
  })
  .optional();

/**
 * Country code validation schema
 *
 * @description
 * Regulatory domain selection (controls allowed channels and TX power limits):
 * - Optional field (defaults to router region if available)
 * - Format: 2-letter ISO 3166-1 alpha-2 country code (e.g., 'US', 'DE', 'GB', 'JP')
 * - Uppercase letters only (A-Z)
 * - Affects: available channels, maximum TX power, frequency bands
 * - Important: Setting correct country code ensures compliance with local regulations
 */
const countryCodeSchema = z
  .string()
  .length(
    COUNTRY_CODE_LENGTH,
    `Country code must be exactly ${COUNTRY_CODE_LENGTH} characters (ISO 3166-1 alpha-2 format)`
  )
  .regex(
    /^[A-Z]{2}$/,
    'Country code must be 2 uppercase letters (e.g., US, DE, GB, JP) following ISO 3166-1 standard'
  )
  .optional();

// ============================================================================
// Composite Schemas & Type Exports
// ============================================================================

/**
 * Complete wireless settings validation schema
 *
 * @description
 * Composite schema for full WiFi interface configuration validation.
 * Validates all fields together to catch cross-field issues (e.g., country code affecting channel availability).
 * Used for form validation before applying changes to router.
 *
 * @example
 * const result = wirelessSettingsSchema.safeParse(formData);
 * if (!result.success) {
 *   // Handle validation errors
 *   console.error(result.error.flatten());
 * }
 */
export const wirelessSettingsSchema = z.object({
  // Basic settings
  ssid: ssidSchema,
  password: passwordSchema,
  hideSsid: hideSsidSchema,

  // Radio settings
  channel: channelSchema,
  channelWidth: channelWidthSchema,
  txPower: txPowerSchema,

  // Security
  securityMode: securityModeSchema,

  // Regional
  countryCode: countryCodeSchema,
});

/**
 * TypeScript type inferred from complete schema
 * Use this type for form data throughout the application
 *
 * @description
 * Represents fully-validated wireless settings that are safe to apply to router.
 * All required fields are guaranteed present; optional fields may be undefined.
 */
export type WirelessSettingsFormData = z.infer<typeof wirelessSettingsSchema>;

/**
 * Default values for new wireless form
 *
 * @description
 * Safe defaults for blank WiFi configuration:
 * - SSID: empty (user must enter)
 * - Password: empty (will be required if security mode requires it)
 * - Hide SSID: false (network broadcasts name by default)
 * - Channel: auto (router selects best channel automatically)
 * - Channel Width: 20MHz (most compatible, stable)
 * - TX Power: 17 dBm (typical balanced value)
 * - Security Mode: WPA2-PSK (balance of security and compatibility)
 * - Country Code: undefined (use router's regional settings)
 */
export const defaultWirelessSettings: WirelessSettingsFormData = {
  ssid: '',
  password: '',
  hideSsid: false,
  channel: 'auto',
  channelWidth: '20MHz',
  txPower: TX_POWER_MIN_DBM + 16, // 17 dBm balanced default
  securityMode: 'wpa2-psk',
  countryCode: undefined,
};

/**
 * Partial schema for updating only specific fields
 *
 * @description
 * Used for PATCH-style updates where only some fields are provided.
 * All fields become optional. Useful for: form draft saves, bulk updates, field-specific mutations.
 *
 * @example
 * // User updates only SSID and password
 * const updateSchema = wirelessSettingsPartialSchema.parse({
 *   ssid: 'NewNetwork',
 *   password: 'SecurePass123',
 * });
 */
export const wirelessSettingsPartialSchema = wirelessSettingsSchema.partial();

export type WirelessSettingsPartialData = z.infer<typeof wirelessSettingsPartialSchema>;
