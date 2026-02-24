/**
 * VPN Clients Page
 * Displays all VPN client configurations organized by protocol
 * Supports add, edit, delete, and toggle operations
 */

import * as React from 'react';

import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { RefreshCw, Plus, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
import type { VPNProtocol } from '@nasnet/core/types';
import { useConnectionStore } from '@nasnet/state/stores';
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

const ALL_PROTOCOLS: VPNProtocol[] = ['wireguard', 'openvpn', 'l2tp', 'pptp', 'sstp', 'ikev2'];

/**
 * VPN Clients Page Component
 */
export const VPNClientsPage = React.memo(function VPNClientsPage() {
  const { t } = useTranslation('vpn');
  const navigate = useNavigate();
  const { id: routerId } = useParams({ from: '/router/$id/vpn/clients' });
  const search = useSearch({ from: '/router/$id/vpn/clients' });
  const initialProtocol = (search as { protocol?: VPNProtocol }).protocol || null;
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
  const ipsecClientPeers = ipsecPeersQuery.data?.filter(p => !p.isPassive) || [];

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
              <div className="grid gap-component-md md:grid-cols-2">
                {wireguardPeers.map((peer) => (
                  <VPNClientCard
                    key={peer.id}
                    id={peer.id}
                    name={`${peer.interface}-peer`}
                    protocol="wireguard"
                    isDisabled={peer.isDisabled || false}
                    isRunning={!!peer.lastHandshake}
                    connectTo={peer.endpoint || ''}
                    rx={peer.rx}
                    tx={peer.tx}
                    comment={peer.comment}
                    onToggle={(id, enabled) => handleToggle(id, peer.interface, 'wireguard', enabled)}
                    onEdit={() => navigate({ to: `/vpn/clients/wireguard/${peer.id}/edit` as '/' })}
                    onDelete={() => {/* TODO: Delete confirmation */}}
                    isToggling={toggleMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState protocol="wireguard" onAdd={() => navigate({ to: '/vpn/clients/wireguard/add' as '/' })} />
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
              <div className="grid gap-component-md md:grid-cols-2">
                {openvpnClients.map((client) => (
                  <VPNClientCard
                    key={client.id}
                    id={client.id}
                    name={client.name}
                    protocol="openvpn"
                    isDisabled={client.isDisabled}
                    isRunning={client.isRunning}
                    connectTo={client.connectTo}
                    port={client.port}
                    user={client.user}
                    uptime={client.uptime}
                    rx={client.rx}
                    tx={client.tx}
                    comment={client.comment}
                    onToggle={(id, enabled) => handleToggle(id, client.name, 'openvpn', enabled)}
                    onEdit={() => navigate({ to: `/vpn/clients/openvpn/${client.id}/edit` as '/' })}
                    onDelete={() => {/* TODO: Delete confirmation */}}
                    isToggling={toggleMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState protocol="openvpn" onAdd={() => navigate({ to: '/vpn/clients/openvpn/add' as '/' })} />
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
              <div className="grid gap-component-md md:grid-cols-2">
                {l2tpClients.map((client) => (
                  <VPNClientCard
                    key={client.id}
                    id={client.id}
                    name={client.name}
                    protocol="l2tp"
                    isDisabled={client.isDisabled}
                    isRunning={client.isRunning}
                    connectTo={client.connectTo}
                    user={client.user}
                    uptime={client.uptime}
                    rx={client.rx}
                    tx={client.tx}
                    localAddress={client.localAddress}
                    remoteAddress={client.remoteAddress}
                    comment={client.comment}
                    onToggle={(id, enabled) => handleToggle(id, client.name, 'l2tp', enabled)}
                    onEdit={() => navigate({ to: `/vpn/clients/l2tp/${client.id}/edit` as '/' })}
                    onDelete={() => {/* TODO: Delete confirmation */}}
                    isToggling={toggleMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState protocol="l2tp" onAdd={() => navigate({ to: '/vpn/clients/l2tp/add' as '/' })} />
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
              <div className="grid gap-component-md md:grid-cols-2">
                {pptpClients.map((client) => (
                  <VPNClientCard
                    key={client.id}
                    id={client.id}
                    name={client.name}
                    protocol="pptp"
                    isDisabled={client.isDisabled}
                    isRunning={client.isRunning}
                    connectTo={client.connectTo}
                    user={client.user}
                    uptime={client.uptime}
                    rx={client.rx}
                    tx={client.tx}
                    localAddress={client.localAddress}
                    remoteAddress={client.remoteAddress}
                    comment={client.comment}
                    onToggle={(id, enabled) => handleToggle(id, client.name, 'pptp', enabled)}
                    onEdit={() => navigate({ to: `/vpn/clients/pptp/${client.id}/edit` as '/' })}
                    onDelete={() => {/* TODO: Delete confirmation */}}
                    isToggling={toggleMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState protocol="pptp" onAdd={() => navigate({ to: '/vpn/clients/pptp/add' as '/' })} />
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
              <div className="grid gap-component-md md:grid-cols-2">
                {sstpClients.map((client) => (
                  <VPNClientCard
                    key={client.id}
                    id={client.id}
                    name={client.name}
                    protocol="sstp"
                    isDisabled={client.isDisabled}
                    isRunning={client.isRunning}
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
                    onEdit={() => navigate({ to: `/vpn/clients/sstp/${client.id}/edit` as '/' })}
                    onDelete={() => {/* TODO: Delete confirmation */}}
                    isToggling={toggleMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState protocol="sstp" onAdd={() => navigate({ to: '/vpn/clients/sstp/add' as '/' })} />
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
              <div className="grid gap-component-md md:grid-cols-2">
                {ipsecClientPeers.map((peer) => {
                  const activeConn = getIPsecActive(peer.id);
                  return (
                    <VPNClientCard
                      key={peer.id}
                      id={peer.id}
                      name={peer.name}
                      protocol="ikev2"
                      isDisabled={peer.isDisabled}
                      isRunning={!!activeConn}
                      connectTo={peer.address}
                      port={peer.port}
                      uptime={activeConn?.uptime}
                      rx={activeConn?.rx}
                      tx={activeConn?.tx}
                      localAddress={activeConn?.localAddress}
                      remoteAddress={activeConn?.remoteAddress}
                      comment={peer.comment}
                      onToggle={(id, enabled) => handleToggle(id, peer.name, 'ikev2', enabled)}
                      onEdit={() => navigate({ to: `/vpn/clients/ikev2/${peer.id}/edit` as '/' })}
                      onDelete={() => {/* TODO: Delete confirmation */}}
                      isToggling={toggleMutation.isPending}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState protocol="ikev2" onAdd={() => navigate({ to: '/vpn/clients/ikev2/add' as '/' })} />
            )}
          </VPNTypeSection>
        );

      default:
        return null;
    }
  };

  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-component-lg">
      <div className="max-w-6xl mx-auto space-y-component-lg">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-component-md">
            <BackButton to={routerId ? `/router/${routerId}/vpn` : '/vpn'} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                {t('clients.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('clients.overview')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-component-sm">
            <Button
              variant="outline"
              size="sm"
              onClick={refetchAll}
              disabled={isLoading || isFetching}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('button.refresh', { ns: 'common' })}</span>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-component-md">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-card-sm" />
            ))}
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as VPNProtocol | 'all')}>
            {/* Protocol Tabs */}
            <TabsList className="w-full flex-wrap h-auto gap-component-sm bg-transparent p-0 mb-component-lg">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Monitor className="h-4 w-4 mr-2" />
                {t('button.all', { ns: 'common' })}
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
});

VPNClientsPage.displayName = 'VPNClientsPage';

/**
 * Empty State Component
 */
interface EmptyStateProps {
  protocol: VPNProtocol;
  onAdd: () => void;
}

function EmptyState({ protocol, onAdd }: EmptyStateProps) {
  const { t } = useTranslation('vpn');
  return (
    <div className="text-center py-component-lg bg-muted/30 rounded-card-sm">
      <ProtocolIconBadge protocol={protocol} variant="lg" className="mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {t('clients.noClientsConfigured', { protocol: getProtocolLabel(protocol) })}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {t('clients.getStartedAddFirst', { protocol: getProtocolLabel(protocol) })}
      </p>
      <Button onClick={onAdd} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]">
        <Plus className="h-4 w-4 mr-2" />
        {t('clients.addClient', { protocol: getProtocolLabel(protocol) })}
      </Button>
    </div>
  );
}

