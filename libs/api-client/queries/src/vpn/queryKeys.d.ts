/**
 * Query keys for VPN queries
 * Follows TanStack Query best practices for hierarchical keys
 * Supports all 6 VPN protocols: WireGuard, OpenVPN, L2TP, PPTP, SSTP, IKEv2
 * Updated to include routerIp for proper cache key management
 */
export declare const vpnKeys: {
  all: readonly ['vpn'];
  stats: (routerIp: string) => readonly ['vpn', 'stats', string];
  trafficHistory: (
    routerIp: string,
    protocol?: string
  ) => readonly ['vpn', 'traffic', string, string];
  wireguard: (routerIp: string) => readonly ['vpn', 'wireguard', string];
  wireguardInterfaces: (routerIp: string) => readonly ['vpn', 'wireguard', string, 'interfaces'];
  wireguardPeers: (
    routerIp: string,
    interfaceName?: string
  ) => readonly ['vpn', 'wireguard', string, 'peers', string];
  openvpn: (routerIp: string) => readonly ['vpn', 'openvpn', string];
  openvpnServers: (routerIp: string) => readonly ['vpn', 'openvpn', string, 'servers'];
  openvpnClients: (routerIp: string) => readonly ['vpn', 'openvpn', string, 'clients'];
  l2tp: (routerIp: string) => readonly ['vpn', 'l2tp', string];
  l2tpServer: (routerIp: string) => readonly ['vpn', 'l2tp', string, 'server'];
  l2tpClients: (routerIp: string) => readonly ['vpn', 'l2tp', string, 'clients'];
  pptp: (routerIp: string) => readonly ['vpn', 'pptp', string];
  pptpServer: (routerIp: string) => readonly ['vpn', 'pptp', string, 'server'];
  pptpClients: (routerIp: string) => readonly ['vpn', 'pptp', string, 'clients'];
  sstp: (routerIp: string) => readonly ['vpn', 'sstp', string];
  sstpServer: (routerIp: string) => readonly ['vpn', 'sstp', string, 'server'];
  sstpClients: (routerIp: string) => readonly ['vpn', 'sstp', string, 'clients'];
  ipsec: (routerIp: string) => readonly ['vpn', 'ipsec', string];
  ipsecPeers: (routerIp: string) => readonly ['vpn', 'ipsec', string, 'peers'];
  ipsecPolicies: (routerIp: string) => readonly ['vpn', 'ipsec', string, 'policies'];
  ipsecIdentities: (routerIp: string) => readonly ['vpn', 'ipsec', string, 'identities'];
  ipsecProfiles: (routerIp: string) => readonly ['vpn', 'ipsec', string, 'profiles'];
  ipsecActive: (routerIp: string) => readonly ['vpn', 'ipsec', string, 'active'];
  ppp: (routerIp: string) => readonly ['vpn', 'ppp', string];
  pppProfiles: (routerIp: string) => readonly ['vpn', 'ppp', string, 'profiles'];
  pppSecrets: (routerIp: string) => readonly ['vpn', 'ppp', string, 'secrets'];
  pppActive: (routerIp: string) => readonly ['vpn', 'ppp', string, 'active'];
};
//# sourceMappingURL=queryKeys.d.ts.map
