// Main component
export { VPNClient } from "./VPNClient";
export { VPNSelector } from "./VPNSelector";

// Hooks
export { useVPNConfig } from "./useVPNConfig";
export { useVPNClientEnabled } from "./useVPNClientEnabled";
export { useVPNClientMode } from "./useVPNClientMode";

// Icons and utilities
export * from "./icons";

// Re-export components
export * from "./components";

// Sub-components - export ActionFooter with alias to avoid conflicts
export { ActionFooter as VPNClientActionFooter } from "./ActionFooter";
export { ConfigInput } from "./ConfigInput";
export { ErrorMessage } from "./ErrorMessage";
export { PromoL2TPBanner } from "./PromoL2TPBanner";
