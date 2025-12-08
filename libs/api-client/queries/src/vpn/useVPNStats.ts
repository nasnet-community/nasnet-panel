/**
 * VPN Stats Aggregation Hook
 * Aggregates statistics from all VPN protocols for the dashboard
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { 
  VPNDashboardStats, 
  VPNProtocolStats,
  VPNIssue,
  VPNProtocol 
} from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

// Import individual hooks
import { useWireGuardInterfaces } from './useWireGuardInterfaces';
import { useWireGuardPeers } from './useWireGuardPeers';
import { useOpenVPNServers } from './useOpenVPNServers';
import { useOpenVPNClients } from './useOpenVPNClients';
import { useL2TPServer } from './useL2TPServer';
import { useL2TPClients } from './useL2TPClients';
import { usePPTPServer } from './usePPTPServer';
import { usePPTPClients } from './usePPTPClients';
import { useSSTPServer } from './useSSTPServer';
import { useSSTPClients } from './useSSTPClients';
import { useIPsecPeers } from './useIPsecPeers';
import { useIPsecActive } from './useIPsecActive';
import { usePPPActive } from './usePPPActive';

/**
 * Hook to aggregate VPN statistics from all protocols
 */
export function useVPNStats(routerIp: string): UseQueryResult<VPNDashboardStats, Error> {
  // Fetch data from all VPN protocols
  const wireguardQuery = useWireGuardInterfaces(routerIp);
  const wireguardPeersQuery = useWireGuardPeers(routerIp);
  const openvpnServersQuery = useOpenVPNServers(routerIp);
  const openvpnClientsQuery = useOpenVPNClients(routerIp);
  const l2tpServerQuery = useL2TPServer(routerIp);
  const l2tpClientsQuery = useL2TPClients(routerIp);
  const pptpServerQuery = usePPTPServer(routerIp);
  const pptpClientsQuery = usePPTPClients(routerIp);
  const sstpServerQuery = useSSTPServer(routerIp);
  const sstpClientsQuery = useSSTPClients(routerIp);
  const ipsecPeersQuery = useIPsecPeers(routerIp);
  const ipsecActiveQuery = useIPsecActive(routerIp);
  const pppActiveQuery = usePPPActive(routerIp);

  // Combine loading states
  const isLoading = 
    wireguardQuery.isLoading ||
    openvpnServersQuery.isLoading ||
    openvpnClientsQuery.isLoading ||
    l2tpServerQuery.isLoading ||
    l2tpClientsQuery.isLoading ||
    pptpServerQuery.isLoading ||
    pptpClientsQuery.isLoading ||
    sstpServerQuery.isLoading ||
    sstpClientsQuery.isLoading ||
    ipsecPeersQuery.isLoading;

  // Aggregate stats
  return useQuery({
    queryKey: vpnKeys.stats(routerIp),
    queryFn: async (): Promise<VPNDashboardStats> => {
      const wireguardInterfaces = wireguardQuery.data || [];
      const wireguardPeers = wireguardPeersQuery.data || [];
      const openvpnServers = openvpnServersQuery.data || [];
      const openvpnClients = openvpnClientsQuery.data || [];
      const l2tpServer = l2tpServerQuery.data;
      const l2tpClients = l2tpClientsQuery.data || [];
      const pptpServer = pptpServerQuery.data;
      const pptpClients = pptpClientsQuery.data || [];
      const sstpServer = sstpServerQuery.data;
      const sstpClients = sstpClientsQuery.data || [];
      const ipsecPeers = ipsecPeersQuery.data || [];
      const ipsecActive = ipsecActiveQuery.data || [];
      const pppActive = pppActiveQuery.data || [];

      // Calculate protocol stats
      const protocolStats: VPNProtocolStats[] = [];

      // WireGuard stats
      const wgActiveServers = wireguardInterfaces.filter(i => !i.disabled && i.running).length;
      const wgRx = wireguardInterfaces.reduce((sum, i) => sum + (i.rx || 0), 0);
      const wgTx = wireguardInterfaces.reduce((sum, i) => sum + (i.tx || 0), 0);
      protocolStats.push({
        protocol: 'wireguard',
        serverCount: wireguardInterfaces.length,
        clientCount: wireguardPeers.length,
        activeServerConnections: wgActiveServers,
        activeClientConnections: wireguardPeers.filter(p => !p.disabled).length,
        totalRx: wgRx,
        totalTx: wgTx,
      });

      // OpenVPN stats
      const ovpnActiveServers = openvpnServers.filter(s => !s.disabled && s.running).length;
      const ovpnActiveClients = openvpnClients.filter(c => !c.disabled && c.running).length;
      const ovpnServerConnections = pppActive.filter(p => p.service === 'ovpn').length;
      const ovpnRx = openvpnClients.reduce((sum, c) => sum + (c.rx || 0), 0);
      const ovpnTx = openvpnClients.reduce((sum, c) => sum + (c.tx || 0), 0);
      protocolStats.push({
        protocol: 'openvpn',
        serverCount: openvpnServers.length,
        clientCount: openvpnClients.length,
        activeServerConnections: ovpnServerConnections,
        activeClientConnections: ovpnActiveClients,
        totalRx: ovpnRx,
        totalTx: ovpnTx,
      });

      // L2TP stats
      const l2tpServerActive = l2tpServer?.running ? 1 : 0;
      const l2tpActiveClients = l2tpClients.filter(c => !c.disabled && c.running).length;
      const l2tpServerConnections = pppActive.filter(p => p.service === 'l2tp').length;
      const l2tpRx = l2tpClients.reduce((sum, c) => sum + (c.rx || 0), 0);
      const l2tpTx = l2tpClients.reduce((sum, c) => sum + (c.tx || 0), 0);
      protocolStats.push({
        protocol: 'l2tp',
        serverCount: l2tpServer ? 1 : 0,
        clientCount: l2tpClients.length,
        activeServerConnections: l2tpServerConnections,
        activeClientConnections: l2tpActiveClients,
        totalRx: l2tpRx,
        totalTx: l2tpTx,
      });

      // PPTP stats
      const pptpServerActive = pptpServer?.running ? 1 : 0;
      const pptpActiveClients = pptpClients.filter(c => !c.disabled && c.running).length;
      const pptpServerConnections = pppActive.filter(p => p.service === 'pptp').length;
      const pptpRx = pptpClients.reduce((sum, c) => sum + (c.rx || 0), 0);
      const pptpTx = pptpClients.reduce((sum, c) => sum + (c.tx || 0), 0);
      protocolStats.push({
        protocol: 'pptp',
        serverCount: pptpServer ? 1 : 0,
        clientCount: pptpClients.length,
        activeServerConnections: pptpServerConnections,
        activeClientConnections: pptpActiveClients,
        totalRx: pptpRx,
        totalTx: pptpTx,
      });

      // SSTP stats
      const sstpServerActive = sstpServer?.running ? 1 : 0;
      const sstpActiveClients = sstpClients.filter(c => !c.disabled && c.running).length;
      const sstpServerConnections = pppActive.filter(p => p.service === 'sstp').length;
      const sstpRx = sstpClients.reduce((sum, c) => sum + (c.rx || 0), 0);
      const sstpTx = sstpClients.reduce((sum, c) => sum + (c.tx || 0), 0);
      protocolStats.push({
        protocol: 'sstp',
        serverCount: sstpServer ? 1 : 0,
        clientCount: sstpClients.length,
        activeServerConnections: sstpServerConnections,
        activeClientConnections: sstpActiveClients,
        totalRx: sstpRx,
        totalTx: sstpTx,
      });

      // IKEv2/IPsec stats
      const ipsecServerPeers = ipsecPeers.filter(p => p.passive);
      const ipsecClientPeers = ipsecPeers.filter(p => !p.passive);
      const ipsecRx = ipsecActive.reduce((sum, a) => sum + (a.rx || 0), 0);
      const ipsecTx = ipsecActive.reduce((sum, a) => sum + (a.tx || 0), 0);
      protocolStats.push({
        protocol: 'ikev2',
        serverCount: ipsecServerPeers.length,
        clientCount: ipsecClientPeers.length,
        activeServerConnections: ipsecActive.filter(a => a.side === 'responder').length,
        activeClientConnections: ipsecActive.filter(a => a.side === 'initiator').length,
        totalRx: ipsecRx,
        totalTx: ipsecTx,
      });

      // Calculate totals
      const totalServers = protocolStats.reduce((sum, p) => sum + p.serverCount, 0);
      const totalClients = protocolStats.reduce((sum, p) => sum + p.clientCount, 0);
      const activeServers = protocolStats.reduce((sum, p) => 
        sum + (p.serverCount > 0 && p.activeServerConnections > 0 ? 1 : 0), 0);
      const activeClients = protocolStats.reduce((sum, p) => sum + p.activeClientConnections, 0);
      const totalServerConnections = protocolStats.reduce((sum, p) => sum + p.activeServerConnections, 0);
      const totalClientConnections = protocolStats.reduce((sum, p) => sum + p.activeClientConnections, 0);
      const totalRx = protocolStats.reduce((sum, p) => sum + p.totalRx, 0);
      const totalTx = protocolStats.reduce((sum, p) => sum + p.totalTx, 0);

      // Detect issues
      const issues: VPNIssue[] = [];

      // Check for disabled but configured clients
      openvpnClients.filter(c => c.disabled).forEach(c => {
        issues.push({
          id: `ovpn-client-disabled-${c.id}`,
          severity: 'warning',
          protocol: 'openvpn',
          entityType: 'client',
          entityName: c.name,
          message: 'OpenVPN client is disabled',
          timestamp: new Date(),
        });
      });

      l2tpClients.filter(c => c.disabled).forEach(c => {
        issues.push({
          id: `l2tp-client-disabled-${c.id}`,
          severity: 'warning',
          protocol: 'l2tp',
          entityType: 'client',
          entityName: c.name,
          message: 'L2TP client is disabled',
          timestamp: new Date(),
        });
      });

      // Check for not running but enabled clients
      openvpnClients.filter(c => !c.disabled && !c.running).forEach(c => {
        issues.push({
          id: `ovpn-client-notrunning-${c.id}`,
          severity: 'error',
          protocol: 'openvpn',
          entityType: 'client',
          entityName: c.name,
          message: 'OpenVPN client is not connected',
          timestamp: new Date(),
        });
      });

      // Determine overall health
      let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      const errorCount = issues.filter(i => i.severity === 'error').length;
      const warningCount = issues.filter(i => i.severity === 'warning').length;
      
      if (errorCount > 0) {
        overallHealth = 'critical';
      } else if (warningCount > 0) {
        overallHealth = 'warning';
      }

      return {
        totalServers,
        totalClients,
        activeServers,
        activeClients,
        totalServerConnections,
        totalClientConnections,
        totalRx,
        totalTx,
        protocolStats,
        overallHealth,
        issues,
        recentEvents: [], // TODO: Implement event tracking
        lastUpdated: new Date(),
      };
    },
    staleTime: 5000,
    refetchInterval: 5000,
    enabled: !!routerIp && !isLoading,
  });
}

