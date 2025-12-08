/**
 * VPN queries barrel export
 * Includes hooks for all VPN protocols: WireGuard, OpenVPN, L2TP, PPTP, SSTP, IKEv2
 */

// Query keys
export * from './queryKeys';

// WireGuard
export * from './useWireGuardInterfaces';
export * from './useWireGuardPeers';

// OpenVPN
export * from './useOpenVPNServers';
export * from './useOpenVPNClients';

// L2TP
export * from './useL2TPServer';
export * from './useL2TPClients';
export * from './useL2TPInterfaces'; // Legacy

// PPTP
export * from './usePPTPServer';
export * from './usePPTPClients';
export * from './usePPTPInterfaces'; // Legacy

// SSTP
export * from './useSSTPServer';
export * from './useSSTPClients';
export * from './useSSTPInterfaces'; // Legacy

// IKEv2/IPsec
export * from './useIPsecPeers';
export * from './useIPsecPolicies';
export * from './useIPsecIdentities';
export * from './useIPsecActive';

// PPP (shared by L2TP, PPTP, SSTP, OpenVPN servers)
export * from './usePPPActive';
export * from './usePPPSecrets';

// Dashboard stats aggregation
export * from './useVPNStats';

// Mutations
export * from './mutations';
