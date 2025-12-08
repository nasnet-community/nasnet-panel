// Main component
export { Wireless } from "./Wireless";

// Hooks
export { useWirelessForm, determineWirelessNetwork } from "./useWireless";

// Types
export type {
  NetworkConfig,
  NetworkKey,
  Networks,
  LoadingState,
  WirelessNetworkConfig,
  MultiModeConfig,
  ExtraWirelessInterface,
} from "./type";

// Constants
export { NETWORK_KEYS, NETWORK_DESCRIPTIONS } from "./constants";

// Utilities - export specific functions to avoid conflicts
export { getAvailableNetworks, getExtraNetworks } from "./networkUtils";

// Sub-components
export { ActionButtons } from "./ActionButtons";
export { CompactHeader } from "./CompactHeader";
export { CompactNetworkCard } from "./CompactNetworkCard";
export { ExtraWirelessCard } from "./ExtraWirelessCard";
export { MultiSSIDForm } from "./MultiSSIDForm";
export { NetworkCard } from "./NetworkCard";
export { SingleSSIDForm } from "./SingleSSIDForm";
export { SSIDModeSelector } from "./SSIDModeSelector";
export { WirelessHeader } from "./WirelessHeader";
