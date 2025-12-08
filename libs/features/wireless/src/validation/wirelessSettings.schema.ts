/**
 * Wireless Settings Validation Schema
 * Zod schema for comprehensive wireless settings validation
 * Implements validation rules for FR0-18: Edit wireless settings
 */

import { z } from 'zod';

/**
 * SSID validation schema
 * - Required field
 * - Min 1 character
 * - Max 32 characters (RouterOS/WiFi standard limit)
 * - Valid characters: printable ASCII
 */
const ssidSchema = z
  .string()
  .min(1, 'SSID is required')
  .max(32, 'SSID must be 32 characters or less')
  .regex(
    /^[\x20-\x7E]+$/,
    'SSID must contain only printable ASCII characters'
  );

/**
 * Password validation schema
 * - Optional (blank to keep current, or for open networks)
 * - Min 8 characters when provided (WPA/WPA2/WPA3 requirement)
 * - Max 63 characters (WPA standard limit)
 */
const passwordSchema = z
  .string()
  .optional()
  .refine((val) => !val || val.length === 0 || val.length >= 8, {
    message: 'Password must be at least 8 characters for WPA2/WPA3',
  })
  .refine((val) => !val || val.length <= 63, {
    message: 'Password must be 63 characters or less',
  });

/**
 * Channel validation schema
 * - Accepts 'auto' or numeric channel string
 */
const channelSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || val === 'auto' || /^\d+$/.test(val),
    { message: 'Channel must be "auto" or a valid channel number' }
  );

/**
 * Channel width validation schema
 * - Valid values: 20MHz, 40MHz, 80MHz, 160MHz
 */
const channelWidthSchema = z
  .enum(['20MHz', '40MHz', '80MHz', '160MHz'])
  .optional();

/**
 * TX Power validation schema
 * - Range: 1-30 dBm (typical router range)
 */
const txPowerSchema = z
  .number()
  .min(1, 'TX Power must be at least 1 dBm')
  .max(30, 'TX Power cannot exceed 30 dBm')
  .optional();

/**
 * Hide SSID validation schema
 * - Boolean flag
 */
const hideSsidSchema = z.boolean().optional();

/**
 * Security mode validation schema
 * - Valid security mode options
 */
const securityModeSchema = z
  .enum(['none', 'wpa2-psk', 'wpa3-psk', 'wpa2-wpa3-psk'])
  .optional();

/**
 * Country code validation schema
 * - 2-letter ISO country code
 */
const countryCodeSchema = z
  .string()
  .length(2, 'Country code must be 2 characters')
  .regex(/^[A-Z]{2}$/, 'Country code must be uppercase letters')
  .optional();

/**
 * Wireless settings form schema
 * Complete validation for all wireless configuration fields
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
 * TypeScript type inferred from schema
 * Use this for form data typing
 */
export type WirelessSettingsFormData = z.infer<typeof wirelessSettingsSchema>;

/**
 * Default values for new form
 */
export const defaultWirelessSettings: WirelessSettingsFormData = {
  ssid: '',
  password: '',
  hideSsid: false,
  channel: 'auto',
  channelWidth: '20MHz',
  txPower: 17,
  securityMode: 'wpa2-psk',
  countryCode: undefined,
};

/**
 * Partial schema for updating only specific fields
 * All fields are optional for partial updates
 */
export const wirelessSettingsPartialSchema = wirelessSettingsSchema.partial();

export type WirelessSettingsPartialData = z.infer<
  typeof wirelessSettingsPartialSchema
>;
