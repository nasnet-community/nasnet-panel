/**
 * VPN Clients Page
 * Displays all VPN client configurations organized by protocol
 * Supports add, edit, delete, and toggle operations
 */

import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  VPNClientCard,
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
import { RefreshCw, Plus, Monitor } from 'lucide-react';
import { 
  useWireGuardPeers,
  useOpenVPNClients,
  useL2TPClients,
  usePPTPClients,
  useSSTPClients,
  useIPsecPeers,
  useIPsecActive,
  useToggleVPNInterface,
} from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import type { VPNProtocol } from '@nasnet/core/types';

const ALL_PROTOCOLS: VPNProtocol[] = ['wireguard', 'openvpn', 'l2tp', 'pptp', 'sstp', 'ikev2'];

/**
 * VPN Clients Page Component
 */
export function VPNClientsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialProtocol = searchParams.get('protocol') as VPNProtocol | null;
  const [activeTab, setActiveTab] = React.useState<VPNProtocol | 'all'>(initialProtocol || 'all');
  
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  // Fetch data for all protocols
  const wireguardPeersQuery = useWireGuardPeers(routerIp);
  const openvpnClientsQuery = useOpenVPNClients(routerIp);
  const l2tpClientsQuery = useL2TPClients(routerIp);
  const pptpClientsQuery = usePPTPClients(routerIp);
  const sstpClientsQuery = useSSTPClients(routerIp);
  const ipsecPeersQuery = useIPsecPeers(routerIp);
  const ipsecActiveQuery = useIPsecActive(routerIp);

  // Mutation hooks
  const toggleMutation = useToggleVPNInterface();

  // Combined loading state
  const isLoading = 
    wireguardPeersQuery.isLoading ||
    openvpnClientsQuery.isLoading ||
    l2tpClientsQuery.isLoading ||
    pptpClientsQuery.isLoading ||
    sstpClientsQuery.isLoading ||
    ipsecPeersQuery.isLoading;

  const isFetching = 
    wireguardPeersQuery.isFetching ||
    openvpnClientsQuery.isFetching ||
    l2tpClientsQuery.isFetching ||
    pptpClientsQuery.isFetching ||
    sstpClientsQuery.isFetching ||
    ipsecPeersQuery.isFetching;

  // Refetch all
  const refetchAll = () => {
    wireguardPeersQuery.refetch();
    openvpnClientsQuery.refetch();
    l2tpClientsQuery.refetch();
    pptpClientsQuery.refetch();
    sstpClientsQuery.refetch();
    ipsecPeersQuery.refetch();
    ipsecActiveQuery.refetch();
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

  // Get IPsec active connection for a peer
  const getIPsecActive = (peerId: string) => {
    return ipsecActiveQuery.data?.find(a => a.peer === peerId);
  };

  // WireGuard Peers (outgoing connections)
  const wireguardPeers = wireguardPeersQuery.data?.filter(p => p.endpoint) || [];
  
  // OpenVPN Clients
  const openvpnClients = openvpnClientsQuery.data || [];
  
  // L2TP Clients
  const l2tpClients = l2tpClientsQuery.data || [];
  
  // PPTP Clients
  const pptpClients = pptpClientsQuery.data || [];
  
  // SSTP Clients
  const sstpClients = sstpClientsQuery.data || [];
  
  // IPsec Peers (clients = non-passive mode)
  const ipsecClientPeers = ipsecPeersQuery.data?.filter(p => !p.passive) || [];

  // Render client section based on protocol
  const renderProtocolSection = (protocol: VPNProtocol) => {
    switch (protocol) {
      case 'wireguard':
        return (
          <VPNTypeSection
            type="WireGuard"
            count={wireguardPeers.length}
            defaultExpanded={activeTab === 'wireguard' || activeTab === 'all'}
          >
            {wireguardPeers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {wireguardPeers.map((peer) => (
                  <VPNClientCard
                    key={peer.id}
                    id={peer.id}
                    name={`${peer.interface}-peer`}
                    protocol="wireguard"
                    disabled={peer.disabled || false}
                    running={!!peer.lastHandshake}
                    connectTo={peer.endpoint || ''}
                    rx={peer.rx}
                    tx={peer.tx}
                    comment={peer.comment}
                    onToggle={(id, enabled) => handleToggle(id, peer.interface, 'wireguard', enabled)}
                    onEdit={() => navigate(`/vpn/clients/wireguard/${peer.id}/edit`)}
                    onDelete={() => {/* TODO: Delete confirmation */}}
                    isToggling={toggleMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState protocol="wireguard" onAdd={() => navigate('/vpn/clients/wireguard/add')} />
            )}
          </VPNTypeSection>
        );

      case 'openvpn':
        return (
          <VPNTypeSection
            type="OpenVPN"
            count={openvpnClients.length}
            defaultExpanded={activeTab === 'openvpn' || activeTab === 'all'}
          >
            {openvpnClients.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {openvpnClients.map((client) => (
                  <VPNClientCard
                    key={client.id}
                    id={client.id}
                    name={client.name}
                    protocol="openvpn"
                    disabled={client.disabled}
                    running={client.running}
                    connectTo={client.connectTo}
                    port={client.port}
                    user={client.user}
                    uptime={client.uptime}
                    rx={client.rx}
                    tx={client.tx}
                    comment={client.comment}
                    onToggle={(id, enabled) => handleToggle(id, client.name, 'openvpn', enabled)}
                    onEdit={() => navigate(`/vpn/clients/openvpn/${client.id}/edit`)}
                    onDelete={() => {/* TODO: Delete confirmation */}}
                    isToggling={toggleMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState protocol="openvpn" onAdd={() => navigate('/vpn/clients/openvpn/add')} />
            )}
          </VPNTypeSection>
        );

      case 'l2tp':
        return (
          <VPNTypeSection
            type="L2TP"
            count={l2tpClients.length}
            defaultExpanded={activeTab === 'l2tp' || activeTab === 'all'}
          >
            {l2tpClients.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {l2tpClients.map((client) => (
                  <VPNClientCard
                    key={client.id}
                    id={client.id}
                    name={client.name}
                    protocol="l2tp"
                    disabled={client.disabled}
                    running={client.running}
                    connectTo={client.connectTo}
                    user={client.user}
                    uptime={client.uptime}
                    rx={client.rx}
                    tx={client.tx}
                    localAddress={client.localAddress}
                    remoteAddress={client.remoteAddress}
                    comment={client.comment}
                    onToggle={(id, enabled) => handleToggle(id, client.name, 'l2tp', enabled)}
                    onEdit={() => navigate(`/vpn/clients/l2tp/${client.id}/edit`)}
                    onDelete={() => {/* TODO: Delete confirmation */}}
                    isToggling={toggleMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState protocol="l2tp" onAdd={() => navigate('/vpn/clients/l2tp/add')} />
            )}
          </VPNTypeSection>
        );

      case 'pptp':
        return (
          <VPNTypeSection
            type="PPTP"
            count={pptpClients.length}
            defaultExpanded={activeTab === 'pptp' || activeTab === 'all'}
          >
            {pptpClients.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {pptpClients.map((client) => (
                  <VPNClientCard
                    key={client.id}
                    id={client.id}
                    name={client.name}
                    protocol="pptp"
                    disabled={client.disabled}
                    running={client.running}
                    connectTo={client.connectTo}
                    user={client.user}
                    uptime={client.uptime}
                    rx={client.rx}
                    tx={client.tx}
                    localAddress={client.localAddress}
                    remoteAddress={client.remoteAddress}
                    comment={client.comment}
                    onToggle={(id, enabled) => handleToggle(id, client.name, 'pptp', enabled)}
                    onEdit={() => navigate(`/vpn/clients/pptp/${client.id}/edit`)}
                    onDelete={() => {/* TODO: Delete confirmation */}}
                    isToggling={toggleMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState protocol="pptp" onAdd={() => navigate('/vpn/clients/pptp/add')} />
            )}
          </VPNTypeSection>
        );

      case 'sstp':
        return (
          <VPNTypeSection
            type="SSTP"
            count={sstpClients.length}
            defaultExpanded={activeTab === 'sstp' || activeTab === 'all'}
          >
            {sstpClients.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {sstpClients.map((client) => (
                  <VPNClientCard
                    key={client.id}
                    id={client.id}
                    name={client.name}
                    protocol="sstp"
                    disabled={client.disabled}
                    running={client.running}
                    connectTo={client.connectTo}
                    port={client.port}
                    user={client.user}
                    uptime={client.uptime}
                    rx={client.rx}
                    tx={client.tx}
                    localAddress={client.localAddress}
                    remoteAddress={client.remoteAddress}
                    comment={client.comment}
                    onToggle={(id, enabled) => handleToggle(id, client.name, 'sstp', enabled)}
                    onEdit={() => navigate(`/vpn/clients/sstp/${client.id}/edit`)}
                    onDelete={() => {/* TODO: Delete confirmation */}}
                    isToggling={toggleMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState protocol="sstp" onAdd={() => navigate('/vpn/clients/sstp/add')} />
            )}
          </VPNTypeSection>
        );

      case 'ikev2':
        return (
          <VPNTypeSection
            type="IKEv2/IPsec"
            count={ipsecClientPeers.length}
            defaultExpanded={activeTab === 'ikev2' || activeTab === 'all'}
          >
            {ipsecClientPeers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {ipsecClientPeers.map((peer) => {
                  const activeConn = getIPsecActive(peer.id);
                  return (
                    <VPNClientCard
                      key={peer.id}
                      id={peer.id}
                      name={peer.name}
                      protocol="ikev2"
                      disabled={peer.disabled}
                      running={!!activeConn}
                      connectTo={peer.address}
                      port={peer.port}
                      uptime={activeConn?.uptime}
                      rx={activeConn?.rx}
                      tx={activeConn?.tx}
                      localAddress={activeConn?.localAddress}
                      remoteAddress={activeConn?.remoteAddress}
                      comment={peer.comment}
                      onToggle={(id, enabled) => handleToggle(id, peer.name, 'ikev2', enabled)}
                      onEdit={() => navigate(`/vpn/clients/ikev2/${peer.id}/edit`)}
                      onDelete={() => {/* TODO: Delete confirmation */}}
                      isToggling={toggleMutation.isPending}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState protocol="ikev2" onAdd={() => navigate('/vpn/clients/ikev2/add')} />
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
            <BackButton to="/vpn" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                VPN Clients
              </h1>
              <p className="text-sm text-muted-foreground">
                Configure and manage outgoing VPN connections
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
                <Monitor className="h-4 w-4 mr-2" />
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
        No {getProtocolLabel(protocol)} clients configured
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Get started by adding your first {getProtocolLabel(protocol)} client connection
      </p>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Add {getProtocolLabel(protocol)} Client
      </Button>
    </div>
  );
}

