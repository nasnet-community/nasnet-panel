/**
 * Wireless feature library barrel export
 * Exports all wireless-related components, hooks, utilities, and data
 */

// Components
export { WirelessInterfaceCard } from './components/WirelessInterfaceCard';
export type { WirelessInterfaceCardProps } from './components/WirelessInterfaceCard';

export { WirelessInterfaceList } from './components/WirelessInterfaceList';

export { WirelessInterfaceDetail } from './components/WirelessInterfaceDetail';
export type { WirelessInterfaceDetailProps } from './components/WirelessInterfaceDetail';

export { SecurityProfileSection } from './components/SecurityProfileSection';
export type { SecurityProfileSectionProps } from './components/SecurityProfileSection';

export { PasswordField } from './components/PasswordField';
export type { PasswordFieldProps } from './components/PasswordField';

export { SecurityLevelBadge } from './components/SecurityLevelBadge';
export type { SecurityLevelBadgeProps } from './components/SecurityLevelBadge';

export { InterfaceToggle } from './components/InterfaceToggle';
export type { InterfaceToggleProps } from './components/InterfaceToggle';

export { WirelessSettingsForm } from './components/WirelessSettingsForm';
export type { WirelessSettingsFormProps } from './components/WirelessSettingsForm';

export { WirelessSettingsModal } from './components/WirelessSettingsModal';
export type { WirelessSettingsModalProps } from './components/WirelessSettingsModal';

// Validation schemas and types
export {
  wirelessSettingsSchema,
  wirelessSettingsPartialSchema,
  defaultWirelessSettings,
} from './validation/wirelessSettings.schema';
export type {
  WirelessSettingsFormData,
  WirelessSettingsPartialData,
} from './validation/wirelessSettings.schema';

// Static data and options
export {
  CHANNELS_2_4GHZ,
  CHANNELS_5GHZ,
  CHANNELS_6GHZ,
  CHANNEL_WIDTH_OPTIONS,
  SECURITY_MODE_OPTIONS,
  COUNTRY_OPTIONS,
  TX_POWER_OPTIONS,
  getChannelsByBand,
  getChannelWidthsByBand,
  getCountryName,
} from './data/wirelessOptions';
export type {
  ChannelOption,
  CountryOption,
  SecurityModeOption,
  ChannelWidthOption,
} from './data/wirelessOptions';
