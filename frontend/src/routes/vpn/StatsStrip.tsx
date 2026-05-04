import { Layers, Monitor, Server, Shield } from 'lucide-react';
import { Badge, Inline, SectionGrid, Skeleton } from '@nasnet/ui';
import type { VPNClient, VPNPeer, VPNProtocol, VPNServer } from '../../api';
import styles from '../VPNPage.module.scss';
import { StatCard } from './StatCard';

interface Props {
  clients: VPNClient[];
  servers: VPNServer[];
  peers: VPNPeer[];
  protocols: VPNProtocol[];
  loading?: boolean;
}

export function StatsStrip({ clients, servers, peers, protocols, loading = false }: Props) {
  const activeTunnels = clients.filter((c) => c.enabled).length;
  const activeServers = servers.filter((s) => s.running).length;
  const activePeers = peers.filter((p) => p.enabled).length;

  return (
    <SectionGrid>
      <StatCard icon={<Shield size={14} />} tone="warning" label="Active Tunnels">
        {loading ? (
          <>
            <Skeleton width={32} height={28} radius={4} />
            <Skeleton width={120} height={14} radius={4} />
          </>
        ) : (
          <>
            <span className={styles.statValue}>{activeTunnels}</span>
            <span className={styles.statHint}>
              {clients.length
                ? `${activeTunnels} of ${clients.length} configured`
                : '0 of 0 configured'}
            </span>
          </>
        )}
      </StatCard>

      <StatCard icon={<Server size={14} />} tone="success" label="Servers">
        {loading ? (
          <>
            <Inline $gap="6px">
              <Skeleton width={32} height={28} radius={4} />
              <Skeleton width={20} height={18} radius={4} />
            </Inline>
            <Skeleton width={96} height={14} radius={4} />
          </>
        ) : (
          <>
            <Inline $gap="6px">
              <span className={styles.statValue}>{activeServers}</span>
              <span className={styles.statAside}>/ {servers.length}</span>
            </Inline>
            <span className={styles.statHint}>Active servers</span>
          </>
        )}
      </StatCard>

      <StatCard icon={<Monitor size={14} />} tone="info" label="Clients">
        {loading ? (
          <>
            <Inline $gap="6px">
              <Skeleton width={32} height={28} radius={4} />
              <Skeleton width={20} height={18} radius={4} />
            </Inline>
            <Skeleton width={96} height={14} radius={4} />
          </>
        ) : (
          <>
            <Inline $gap="6px">
              <span className={styles.statValue}>{activePeers}</span>
              <span className={styles.statAside}>/ {peers.length}</span>
            </Inline>
            <span className={styles.statHint}>Active clients</span>
          </>
        )}
      </StatCard>

      <StatCard icon={<Layers size={14} />} tone="primary" label="Protocols">
        {loading ? (
          <>
            <Skeleton width={32} height={28} radius={4} />
            <Inline $gap="6px">
              <Skeleton width={48} height={20} radius={999} />
              <Skeleton width={48} height={20} radius={999} />
              <Skeleton width={48} height={20} radius={999} />
            </Inline>
          </>
        ) : (
          <>
            <span className={styles.statValue}>{protocols.length}</span>
            <Inline $gap="6px">
              {protocols.map((p) => (
                <Badge key={p} tone="info">
                  {String(p).toUpperCase()}
                </Badge>
              ))}
            </Inline>
          </>
        )}
      </StatCard>
    </SectionGrid>
  );
}
