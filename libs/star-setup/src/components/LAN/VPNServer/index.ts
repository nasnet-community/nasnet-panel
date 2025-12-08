// Main component
export { VPNServer } from "./VPNServer";

// Hooks
export { useVPNServer } from "./useVPNServer";

// Components - export ActionFooter with alias to avoid conflicts
export { VPNServerHeader } from "./VPNServerHeader";
export { ActionFooter as VPNServerActionFooter } from "./ActionFooter";

// Re-export from subdirectories
export * from "./VPNServerAdvanced";
export * from "./VPNServerEasy";
