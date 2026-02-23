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
export declare const wirelessSettingsSchema: z.ZodObject<{
    ssid: z.ZodString;
    password: z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>, string | undefined, string | undefined>;
    hideSsid: z.ZodOptional<z.ZodBoolean>;
    channel: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    channelWidth: z.ZodOptional<z.ZodEnum<["20MHz", "40MHz", "80MHz", "160MHz"]>>;
    txPower: z.ZodOptional<z.ZodNumber>;
    securityMode: z.ZodOptional<z.ZodEnum<["none", "wpa2-psk", "wpa3-psk", "wpa2-wpa3-psk"]>>;
    countryCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    ssid: string;
    password?: string | undefined;
    channel?: string | undefined;
    channelWidth?: "20MHz" | "40MHz" | "80MHz" | "160MHz" | undefined;
    txPower?: number | undefined;
    countryCode?: string | undefined;
    hideSsid?: boolean | undefined;
    securityMode?: "none" | "wpa2-psk" | "wpa3-psk" | "wpa2-wpa3-psk" | undefined;
}, {
    ssid: string;
    password?: string | undefined;
    channel?: string | undefined;
    channelWidth?: "20MHz" | "40MHz" | "80MHz" | "160MHz" | undefined;
    txPower?: number | undefined;
    countryCode?: string | undefined;
    hideSsid?: boolean | undefined;
    securityMode?: "none" | "wpa2-psk" | "wpa3-psk" | "wpa2-wpa3-psk" | undefined;
}>;
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
export declare const defaultWirelessSettings: WirelessSettingsFormData;
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
export declare const wirelessSettingsPartialSchema: z.ZodObject<{
    ssid: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>, string | undefined, string | undefined>>;
    hideSsid: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    channel: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>>;
    channelWidth: z.ZodOptional<z.ZodOptional<z.ZodEnum<["20MHz", "40MHz", "80MHz", "160MHz"]>>>;
    txPower: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    securityMode: z.ZodOptional<z.ZodOptional<z.ZodEnum<["none", "wpa2-psk", "wpa3-psk", "wpa2-wpa3-psk"]>>>;
    countryCode: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    password?: string | undefined;
    channel?: string | undefined;
    channelWidth?: "20MHz" | "40MHz" | "80MHz" | "160MHz" | undefined;
    ssid?: string | undefined;
    txPower?: number | undefined;
    countryCode?: string | undefined;
    hideSsid?: boolean | undefined;
    securityMode?: "none" | "wpa2-psk" | "wpa3-psk" | "wpa2-wpa3-psk" | undefined;
}, {
    password?: string | undefined;
    channel?: string | undefined;
    channelWidth?: "20MHz" | "40MHz" | "80MHz" | "160MHz" | undefined;
    ssid?: string | undefined;
    txPower?: number | undefined;
    countryCode?: string | undefined;
    hideSsid?: boolean | undefined;
    securityMode?: "none" | "wpa2-psk" | "wpa3-psk" | "wpa2-wpa3-psk" | undefined;
}>;
export type WirelessSettingsPartialData = z.infer<typeof wirelessSettingsPartialSchema>;
//# sourceMappingURL=wirelessSettings.schema.d.ts.map