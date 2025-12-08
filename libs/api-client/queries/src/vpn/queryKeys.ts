/**
 * Query keys for VPN queries
 * Follows TanStack Query best practices for hierarchical keys
 * Supports all 6 VPN protocols: WireGuard, OpenVPN, L2TP, PPTP, SSTP, IKEv2
 * Updated to include routerIp for proper cache key management
 */

export const vpnKeys = {
  all: ['vpn'] as const,

  // Dashboard stats
  stats: (routerIp: string) => [...vpnKeys.all, 'stats', routerIp] as const,
  trafficHistory: (routerIp: string, protocol?: string) => 
    [...vpnKeys.all, 'traffic', routerIp, protocol || 'all'] as const,

  // WireGuard keys
  wireguard: (routerIp: string) => [...vpnKeys.all, 'wireguard', routerIp] as const,
  wireguardInterfaces: (routerIp: string) => [...vpnKeys.wireguard(routerIp), 'interfaces'] as const,
  wireguardPeers: (routerIp: string, interfaceName?: string) => 
    [...vpnKeys.wireguard(routerIp), 'peers', interfaceName || 'all'] as const,

  // OpenVPN keys
  openvpn: (routerIp: string) => [...vpnKeys.all, 'openvpn', routerIp] as const,
  openvpnServers: (routerIp: string) => [...vpnKeys.openvpn(routerIp), 'servers'] as const,
  openvpnClients: (routerIp: string) => [...vpnKeys.openvpn(routerIp), 'clients'] as const,

  // L2TP keys
  l2tp: (routerIp: string) => [...vpnKeys.all, 'l2tp', routerIp] as const,
  l2tpServer: (routerIp: string) => [...vpnKeys.l2tp(routerIp), 'server'] as const,
  l2tpClients: (routerIp: string) => [...vpnKeys.l2tp(routerIp), 'clients'] as const,

  // PPTP keys
  pptp: (routerIp: string) => [...vpnKeys.all, 'pptp', routerIp] as const,
  pptpServer: (routerIp: string) => [...vpnKeys.pptp(routerIp), 'server'] as const,
  pptpClients: (routerIp: string) => [...vpnKeys.pptp(routerIp), 'clients'] as const,

  // SSTP keys
  sstp: (routerIp: string) => [...vpnKeys.all, 'sstp', routerIp] as const,
  sstpServer: (routerIp: string) => [...vpnKeys.sstp(routerIp), 'server'] as const,
  sstpClients: (routerIp: string) => [...vpnKeys.sstp(routerIp), 'clients'] as const,

  // IKEv2/IPsec keys
  ipsec: (routerIp: string) => [...vpnKeys.all, 'ipsec', routerIp] as const,
  ipsecPeers: (routerIp: string) => [...vpnKeys.ipsec(routerIp), 'peers'] as const,
  ipsecPolicies: (routerIp: string) => [...vpnKeys.ipsec(routerIp), 'policies'] as const,
  ipsecIdentities: (routerIp: string) => [...vpnKeys.ipsec(routerIp), 'identities'] as const,
  ipsecProfiles: (routerIp: string) => [...vpnKeys.ipsec(routerIp), 'profiles'] as const,
  ipsecActive: (routerIp: string) => [...vpnKeys.ipsec(routerIp), 'active'] as const,

  // PPP keys (shared by L2TP, PPTP, SSTP, OpenVPN)
  ppp: (routerIp: string) => [...vpnKeys.all, 'ppp', routerIp] as const,
  pppProfiles: (routerIp: string) => [...vpnKeys.ppp(routerIp), 'profiles'] as const,
  pppSecrets: (routerIp: string) => [...vpnKeys.ppp(routerIp), 'secrets'] as const,
  pppActive: (routerIp: string) => [...vpnKeys.ppp(routerIp), 'active'] as const,
};
