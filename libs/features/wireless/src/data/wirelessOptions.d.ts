/**
 * Wireless configuration options data
 * Static data for channel, country, security mode, and channel width selections
 */
import type { ChannelWidth, FrequencyBand, WirelessSecurityOption } from '@nasnet/core/types';
/**
 * Channel option for select dropdowns
 */
export interface ChannelOption {
    value: string;
    label: string;
    frequency?: number;
}
/**
 * Country option for regulatory compliance
 */
export interface CountryOption {
    code: string;
    name: string;
}
/**
 * Security mode option for select dropdowns
 */
export interface SecurityModeOption {
    value: WirelessSecurityOption;
    label: string;
    description: string;
}
/**
 * Channel width option for select dropdowns
 */
export interface ChannelWidthOption {
    value: ChannelWidth;
    label: string;
    supportedBands: FrequencyBand[];
}
/**
 * 2.4GHz channel options (channels 1-14)
 * Note: Channels 12-14 have regional restrictions
 */
export declare const CHANNELS_2_4GHZ: ChannelOption[];
/**
 * 5GHz channel options (UNII bands)
 * Common channels used worldwide
 */
export declare const CHANNELS_5GHZ: ChannelOption[];
/**
 * 6GHz channel options (WiFi 6E)
 * Simplified list of common channels
 */
export declare const CHANNELS_6GHZ: ChannelOption[];
/**
 * Get channel options by frequency band
 */
export declare function getChannelsByBand(band: FrequencyBand): ChannelOption[];
/**
 * Channel width options
 */
export declare const CHANNEL_WIDTH_OPTIONS: ChannelWidthOption[];
/**
 * Get channel width options available for a specific band
 */
export declare function getChannelWidthsByBand(band: FrequencyBand): ChannelWidthOption[];
/**
 * Security mode options for wireless networks
 */
export declare const SECURITY_MODE_OPTIONS: SecurityModeOption[];
/**
 * Common country/region codes for regulatory compliance
 * Sorted alphabetically by name
 */
export declare const COUNTRY_OPTIONS: CountryOption[];
/**
 * TX Power options (in dBm)
 * Common range for consumer routers
 */
export declare const TX_POWER_OPTIONS: {
    value: number;
    label: string;
}[];
/**
 * Get country name by code
 */
export declare function getCountryName(code: string): string;
//# sourceMappingURL=wirelessOptions.d.ts.map