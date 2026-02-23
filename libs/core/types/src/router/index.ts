/**
 * Router state types barrel export
 * Exports all router-related types for network, hardware, status, and configuration
 */

export * from './discovery';
export * from './wan';
export * from './vpn';
export * from './lan';
export * from './status';
export * from './network';
export * from './wireless';
export * from './dhcp';
export * from './dns';
export * from './connected-device';
export * from './hardware';
export * from './logs';

// NOTE: Firewall types are now exported from firewall/index.ts
// This breaks a circular dependency: firewall-log.types.ts imports from router/logs.ts
// Do NOT re-export firewall types from here - import directly from firewall/index.ts instead
