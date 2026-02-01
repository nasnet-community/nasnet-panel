/**
 * VPN Servers Page
 * Displays all VPN server configurations organized by protocol
 * Supports add, edit, delete, and toggle operations
 */

import * as React from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Route } from '@/routes/router/$id/vpn/servers';
import { 
  VPNServerCard,
  VPNTypeSection,
  BackButton,
  ProtocolIconBadge,
  getProtocolLabel,
} from '@nasnet/ui/patterns';
import { 
  Button, 
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@nasnet/ui/primitives';
import { RefreshCw, Plus, Server } from 'lucide-react';
import { 
  useWireGuardInterfaces,
  useOpenVPNServers,
  useL2TPServer,
  usePPTPServer,
  useSSTPServer,
  useIPsecPeers,
  usePPPActive,
  useToggleVPNInterface,
} from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import type { VPNProtocol } from '@nasnet/core/types';

const ALL_PROTOCOLS: VPNProtocol[] = ['wireguard', 'openvpn', 'l2tp', 'pptp', 'sstp', 'ikev2'];

/**
 * VPN Servers Page Component
 */
export function VPNServersPage() {
  const navigate = useNavigate();
  const { id: routerId } = Route.useParams();
  const search = useSearch({ from: '/router/$id/vpn/servers' });
  const initialProtocol = (search as { protocol?: VPNProtocol }).protocol || null;
  const [activeTab, setActiveTab] = React.useState<VPNProtocol | 'all'>(initialProtocol || 'all');
  
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  // Fetch data for all protocols
  const wireguardQuery = useWireGuardInterfaces(routerIp);
  const openvpnServersQuery = useOpenVPNServers(routerIp);
  const l2tpServerQuery = useL2TPServer(routerIp);
  const pptpServerQuery = usePPTPServer(routerIp);
  const sstpServerQuery = useSSTPServer(routerIp);
  const ipsecPeersQuery = useIPsecPeers(routerIp);
  const pppActiveQuery = usePPPActive(routerIp);

  // Mutation hooks
  const toggleMutation = useToggleVPNInterface();

  // Combined loading state
  const isLoading = 
    wireguardQuery.isLoading ||
    openvpnServersQuery.isLoading ||
    l2tpServerQuery.isLoading ||
    pptpServerQuery.isLoading ||
    sstpServerQuery.isLoading ||
    ipsecPeersQuery.isLoading;

  const isFetching = 
    wireguardQuery.isFetching ||
    openvpnServersQuery.isFetching ||
    l2tpServerQuery.isFetching ||
    pptpServerQuery.isFetching ||
    sstpServerQuery.isFetching ||
    ipsecPeersQuery.isFetching;

  // Refetch all
  const refetchAll = () => {
    wireguardQuery.refetch();
    openvpnServersQuery.refetch();
    l2tpServerQuery.refetch();
    pptpServerQuery.refetch();
    sstpServerQuery.refetch();
    ipsecPeersQuery.refetch();
    pppActiveQuery.refetch();
  };

  // Handle toggle
  const handleToggle = (id: string, name: string, protocol: VPNProtocol, enabled: boolean) => {
    toggleMutation.mutate({
      routerIp,
      id,
      name,
      protocol,
      disabled: !enabled,
    });
  };

  // Get connected count from PPP active
  const getPPPConnectedCount = (service: string) => {
    return pppActiveQuery.data?.filter(c => c.service === service).length || 0;
  };

  // WireGuard Servers
  const wireguardServers = wireguardQuery.data || [];
  
  // OpenVPN Servers
  const openvpnServers = openvpnServersQuery.data || [];
  
  // L2TP Server (single)
  const l2tpServer = l2tpServerQuery.data;
  
  // PPTP Server (single)
  const pptpServer = pptpServerQuery.data;
  
  // SSTP Server (single)
  const sstpServer = sstpServerQuery.data;
  
  // IPsec Peers (servers = passive mode)
  const ipsecServerPeers = ipsecPeersQuery.data?.filter(p => p.passive) || [];

  // Render server section based on protocol
  const renderProtocolSection = (protocol: VPNProtocol) => {
    switch (protocol) {
      case 'wireguard':
        return (
          <VPNTypeSection
            type="WireGuard"
            count={wireguardServers.length}
            defaultExpanded={activeTab === 'wireguard' || activeTab === 'all'}
          >
            {wireguardServers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {wireguardServers.map((server) => (
                  <VPNServerCard
                    key={server.id}
                    id={server.id}
                    name={server.name}
                    protocol="wireguard"
                    disabled={server.disabled}
                    running={server.running}
                    port={server.listenPort}
                    rx={server.rx}
                    tx={server.tx}
                    onToggle={(id, enabled) => handleToggle(id, server.name, 'wireguard', enabled)}
                    onEdit={() => navigate({ to: `/vpn/servers/wireguard/${server.id}/edit` as '/' })}
                    onDelete={() => {/* TODO: Delete confirmation */}}
                    onViewDetails={() => navigate({ to: `/vpn/servers/wireguard/${server.id}` as '/' })}
                    isToggling={toggleMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState protocol="wireguard" onAdd={() => navigate({ to: '/vpn/servers/wireguard/add' as '/' })} />
            )}
          </VPNTypeSection>
        );

      case 'openvpn':
        return (
          <VPNTypeSection
            type="OpenVPN"
            count={openvpnServers.length}
            defaultExpanded={activeTab === 'openvpn' || activeTab === 'all'}
          >
            {openvpnServers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {openvpnServers.map((server) => (
                  <VPNServerCard
                    key={server.id}
                    id={server.id}
                    name={server.name}
                    protocol="openvpn"
                    disabled={server.disabled}
                    running={server.running}
                    port={server.port}
                    connectedClients={getPPPConnectedCount('ovpn')}
                    comment={server.comment}
                    onToggle={(id, enabled) => handleToggle(id, server.name, 'openvpn', enabled)}
                    onEdit={() => navigate({ to: `/vpn/servers/openvpn/${server.id}/edit` as '/' })}
                    onDelete={() => {/* TODO: Delete confirmation */}}
                    isToggling={toggleMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState protocol="openvpn" onAdd={() => navigate({ to: '/vpn/servers/openvpn/add' as '/' })} />
            )}
          </VPNTypeSection>
        );

      case 'l2tp':
        return (
          <VPNTypeSection
            type="L2TP"
            count={l2tpServer ? 1 : 0}
            defaultExpanded={activeTab === 'l2tp' || activeTab === 'all'}
          >
            {l2tpServer ? (
              <VPNServerCard
                id={l2tpServer.id}
                name={l2tpServer.name}
                protocol="l2tp"
                disabled={l2tpServer.disabled}
                running={l2tpServer.running}
                connectedClients={getPPPConnectedCount('l2tp')}
                comment={l2tpServer.comment}
                onToggle={(id, enabled) => handleToggle(id, l2tpServer.name, 'l2tp', enabled)}
                onEdit={() => navigate({ to: '/vpn/servers/l2tp/edit' as '/' })}
                isToggling={toggleMutation.isPending}
              />
            ) : (
              <EmptyState protocol="l2tp" onAdd={() => navigate({ to: '/vpn/servers/l2tp/enable' as '/' })} />
            )}
          </VPNTypeSection>
        );

      case 'pptp':
        return (
          <VPNTypeSection
            type="PPTP"
            count={pptpServer ? 1 : 0}
            defaultExpanded={activeTab === 'pptp' || activeTab === 'all'}
          >
            {pptpServer ? (
              <VPNServerCard
                id={pptpServer.id}
                name={pptpServer.name}
                protocol="pptp"
                disabled={pptpServer.disabled}
                running={pptpServer.running}
                connectedClients={getPPPConnectedCount('pptp')}
                comment={pptpServer.comment}
                onToggle={(id, enabled) => handleToggle(id, pptpServer.name, 'pptp', enabled)}
                onEdit={() => navigate({ to: '/vpn/servers/pptp/edit' as '/' })}
                isToggling={toggleMutation.isPending}
              />
            ) : (
              <EmptyState protocol="pptp" onAdd={() => navigate({ to: '/vpn/servers/pptp/enable' as '/' })} />
            )}
          </VPNTypeSection>
        );

      case 'sstp':
        return (
          <VPNTypeSection
            type="SSTP"
            count={sstpServer ? 1 : 0}
            defaultExpanded={activeTab === 'sstp' || activeTab === 'all'}
          >
            {sstpServer ? (
              <VPNServerCard
                id={sstpServer.id}
                name={sstpServer.name}
                protocol="sstp"
                disabled={sstpServer.disabled}
                running={sstpServer.running}
                port={sstpServer.port}
                connectedClients={getPPPConnectedCount('sstp')}
                comment={sstpServer.comment}
                onToggle={(id, enabled) => handleToggle(id, sstpServer.name, 'sstp', enabled)}
                onEdit={() => navigate({ to: '/vpn/servers/sstp/edit' as '/' })}
                isToggling={toggleMutation.isPending}
              />
            ) : (
              <EmptyState protocol="sstp" onAdd={() => navigate({ to: '/vpn/servers/sstp/enable' as '/' })} />
            )}
          </VPNTypeSection>
        );

      case 'ikev2':
        return (
          <VPNTypeSection
            type="IKEv2/IPsec"
            count={ipsecServerPeers.length}
            defaultExpanded={activeTab === 'ikev2' || activeTab === 'all'}
          >
            {ipsecServerPeers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {ipsecServerPeers.map((peer) => (
                  <VPNServerCard
                    key={peer.id}
                    id={peer.id}
                    name={peer.name}
                    protocol="ikev2"
                    disabled={peer.disabled}
                    running={!peer.disabled}
                    port={peer.port}
                    comment={peer.comment}
                    onToggle={(id, enabled) => handleToggle(id, peer.name, 'ikev2', enabled)}
                    onEdit={() => navigate({ to: `/vpn/servers/ikev2/${peer.id}/edit` as '/' })}
                    onDelete={() => {/* TODO: Delete confirmation */}}
                    isToggling={toggleMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState protocol="ikev2" onAdd={() => navigate({ to: '/vpn/servers/ikev2/add' as '/' })} />
            )}
          </VPNTypeSection>
        );

      default:
        return null;
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <BackButton to={routerId ? `/router/${routerId}/vpn` : '/vpn'} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                VPN Servers
              </h1>
              <p className="text-sm text-muted-foreground">
                Configure and manage your VPN server infrastructure
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refetchAll}
              disabled={isLoading || isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as VPNProtocol | 'all')}>
            {/* Protocol Tabs */}
            <TabsList className="w-full flex-wrap h-auto gap-2 bg-transparent p-0 mb-6">
              <TabsTrigger 
                value="all"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Server className="h-4 w-4 mr-2" />
                All
              </TabsTrigger>
              {ALL_PROTOCOLS.map((protocol) => (
                <TabsTrigger 
                  key={protocol} 
                  value={protocol}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <ProtocolIconBadge protocol={protocol} variant="sm" className="mr-2" />
                  {getProtocolLabel(protocol)}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* All Protocols Tab */}
            <TabsContent value="all" className="space-y-6 mt-0">
              {ALL_PROTOCOLS.map((protocol) => (
                <div key={protocol}>
                  {renderProtocolSection(protocol)}
                </div>
              ))}
            </TabsContent>

            {/* Individual Protocol Tabs */}
            {ALL_PROTOCOLS.map((protocol) => (
              <TabsContent key={protocol} value={protocol} className="mt-0">
                {renderProtocolSection(protocol)}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}

/**
 * Empty State Component
 */
interface EmptyStateProps {
  protocol: VPNProtocol;
  onAdd: () => void;
}

function EmptyState({ protocol, onAdd }: EmptyStateProps) {
  return (
    <div className="text-center py-8 bg-muted/30 rounded-xl">
      <ProtocolIconBadge protocol={protocol} variant="lg" className="mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No {getProtocolLabel(protocol)} servers configured
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Get started by adding your first {getProtocolLabel(protocol)} server
      </p>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Add {getProtocolLabel(protocol)} Server
      </Button>
    </div>
  );
}

