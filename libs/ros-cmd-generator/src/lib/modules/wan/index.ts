// Re-export RouterConfig type and utilities needed by submodules
export type { RouterConfig } from '../../generator';
export * from '../../utils';

// Re-export sub-modules
export * from "./DNS";
export * from "./MultiLink";
export * from "./VPNClient";
export * from "./WAN";
export * from "./WANCG";
