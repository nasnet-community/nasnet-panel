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
export const CHANNELS_2_4GHZ: ChannelOption[] = [
  { value: 'auto', label: 'Auto' },
  { value: '1', label: 'Channel 1 (2412 MHz)', frequency: 2412 },
  { value: '2', label: 'Channel 2 (2417 MHz)', frequency: 2417 },
  { value: '3', label: 'Channel 3 (2422 MHz)', frequency: 2422 },
  { value: '4', label: 'Channel 4 (2427 MHz)', frequency: 2427 },
  { value: '5', label: 'Channel 5 (2432 MHz)', frequency: 2432 },
  { value: '6', label: 'Channel 6 (2437 MHz)', frequency: 2437 },
  { value: '7', label: 'Channel 7 (2442 MHz)', frequency: 2442 },
  { value: '8', label: 'Channel 8 (2447 MHz)', frequency: 2447 },
  { value: '9', label: 'Channel 9 (2452 MHz)', frequency: 2452 },
  { value: '10', label: 'Channel 10 (2457 MHz)', frequency: 2457 },
  { value: '11', label: 'Channel 11 (2462 MHz)', frequency: 2462 },
  { value: '12', label: 'Channel 12 (2467 MHz)', frequency: 2467 },
  { value: '13', label: 'Channel 13 (2472 MHz)', frequency: 2472 },
];

/**
 * 5GHz channel options (UNII bands)
 * Common channels used worldwide
 */
export const CHANNELS_5GHZ: ChannelOption[] = [
  { value: 'auto', label: 'Auto' },
  // UNII-1 (Indoor)
  { value: '36', label: 'Channel 36 (5180 MHz)', frequency: 5180 },
  { value: '40', label: 'Channel 40 (5200 MHz)', frequency: 5200 },
  { value: '44', label: 'Channel 44 (5220 MHz)', frequency: 5220 },
  { value: '48', label: 'Channel 48 (5240 MHz)', frequency: 5240 },
  // UNII-2A
  { value: '52', label: 'Channel 52 (5260 MHz)', frequency: 5260 },
  { value: '56', label: 'Channel 56 (5280 MHz)', frequency: 5280 },
  { value: '60', label: 'Channel 60 (5300 MHz)', frequency: 5300 },
  { value: '64', label: 'Channel 64 (5320 MHz)', frequency: 5320 },
  // UNII-2C
  { value: '100', label: 'Channel 100 (5500 MHz)', frequency: 5500 },
  { value: '104', label: 'Channel 104 (5520 MHz)', frequency: 5520 },
  { value: '108', label: 'Channel 108 (5540 MHz)', frequency: 5540 },
  { value: '112', label: 'Channel 112 (5560 MHz)', frequency: 5560 },
  { value: '116', label: 'Channel 116 (5580 MHz)', frequency: 5580 },
  { value: '120', label: 'Channel 120 (5600 MHz)', frequency: 5600 },
  { value: '124', label: 'Channel 124 (5620 MHz)', frequency: 5620 },
  { value: '128', label: 'Channel 128 (5640 MHz)', frequency: 5640 },
  { value: '132', label: 'Channel 132 (5660 MHz)', frequency: 5660 },
  { value: '136', label: 'Channel 136 (5680 MHz)', frequency: 5680 },
  { value: '140', label: 'Channel 140 (5700 MHz)', frequency: 5700 },
  { value: '144', label: 'Channel 144 (5720 MHz)', frequency: 5720 },
  // UNII-3
  { value: '149', label: 'Channel 149 (5745 MHz)', frequency: 5745 },
  { value: '153', label: 'Channel 153 (5765 MHz)', frequency: 5765 },
  { value: '157', label: 'Channel 157 (5785 MHz)', frequency: 5785 },
  { value: '161', label: 'Channel 161 (5805 MHz)', frequency: 5805 },
  { value: '165', label: 'Channel 165 (5825 MHz)', frequency: 5825 },
];

/**
 * 6GHz channel options (WiFi 6E)
 * Simplified list of common channels
 */
export const CHANNELS_6GHZ: ChannelOption[] = [
  { value: 'auto', label: 'Auto' },
  { value: '1', label: 'Channel 1 (5955 MHz)', frequency: 5955 },
  { value: '5', label: 'Channel 5 (5975 MHz)', frequency: 5975 },
  { value: '9', label: 'Channel 9 (5995 MHz)', frequency: 5995 },
  { value: '13', label: 'Channel 13 (6015 MHz)', frequency: 6015 },
  { value: '17', label: 'Channel 17 (6035 MHz)', frequency: 6035 },
  { value: '21', label: 'Channel 21 (6055 MHz)', frequency: 6055 },
  { value: '25', label: 'Channel 25 (6075 MHz)', frequency: 6075 },
  { value: '29', label: 'Channel 29 (6095 MHz)', frequency: 6095 },
  { value: '33', label: 'Channel 33 (6115 MHz)', frequency: 6115 },
];

/**
 * Get channel options by frequency band
 */
export function getChannelsByBand(band: FrequencyBand): ChannelOption[] {
  switch (band) {
    case '2.4GHz':
      return CHANNELS_2_4GHZ;
    case '5GHz':
      return CHANNELS_5GHZ;
    case '6GHz':
      return CHANNELS_6GHZ;
    default:
      return [{ value: 'auto', label: 'Auto' }];
  }
}

/**
 * Channel width options
 */
export const CHANNEL_WIDTH_OPTIONS: ChannelWidthOption[] = [
  {
    value: '20MHz',
    label: '20 MHz',
    supportedBands: ['2.4GHz', '5GHz', '6GHz'],
  },
  {
    value: '40MHz',
    label: '40 MHz',
    supportedBands: ['2.4GHz', '5GHz', '6GHz'],
  },
  {
    value: '80MHz',
    label: '80 MHz',
    supportedBands: ['5GHz', '6GHz'],
  },
  {
    value: '160MHz',
    label: '160 MHz',
    supportedBands: ['5GHz', '6GHz'],
  },
];

/**
 * Get channel width options available for a specific band
 */
export function getChannelWidthsByBand(band: FrequencyBand): ChannelWidthOption[] {
  return CHANNEL_WIDTH_OPTIONS.filter((option) =>
    option.supportedBands.includes(band)
  );
}

/**
 * Security mode options for wireless networks
 */
export const SECURITY_MODE_OPTIONS: SecurityModeOption[] = [
  {
    value: 'wpa2-psk',
    label: 'WPA2-Personal',
    description: 'Recommended for most networks. Compatible with all modern devices.',
  },
  {
    value: 'wpa3-psk',
    label: 'WPA3-Personal',
    description: 'Enhanced security. Requires WPA3-capable devices.',
  },
  {
    value: 'wpa2-wpa3-psk',
    label: 'WPA2/WPA3 Transitional',
    description: 'Best compatibility. Supports both WPA2 and WPA3 devices.',
  },
  {
    value: 'none',
    label: 'Open (No Security)',
    description: 'Not recommended. Anyone can connect without a password.',
  },
];

/**
 * Common country/region codes for regulatory compliance
 * Sorted alphabetically by name
 */
export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CN', name: 'China' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'Korea, Republic of' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NO', name: 'Norway' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'VN', name: 'Vietnam' },
];

/**
 * TX Power options (in dBm)
 * Common range for consumer routers
 */
export const TX_POWER_OPTIONS = [
  { value: 1, label: '1 dBm (Low)' },
  { value: 5, label: '5 dBm' },
  { value: 10, label: '10 dBm' },
  { value: 15, label: '15 dBm' },
  { value: 17, label: '17 dBm (Default)' },
  { value: 20, label: '20 dBm' },
  { value: 23, label: '23 dBm (High)' },
  { value: 27, label: '27 dBm (Max)' },
];

/**
 * Get country name by code
 */
export function getCountryName(code: string): string {
  const country = COUNTRY_OPTIONS.find((c) => c.code === code);
  return country?.name || code;
}























