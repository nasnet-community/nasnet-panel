import { Layers, Monitor, Server, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Inline, SectionGrid, Skeleton } from '@nasnet/ui';
import type { VPNClient, VPNProtocol, VPNServer } from '../../api';
import styles from '../VPNPage.module.scss';
import { useFormat } from '../../utils/useFormat';
import { StatCard } from './StatCard';

interface Props {
  clients: VPNClient[];
  servers: VPNServer[];
  activeConnections: number | null;
  protocols: VPNProtocol[];
  loading?: boolean;
}

export function StatsStrip({
  clients,
  servers,
  activeConnections,
  protocols,
  loading = false,
}: Props) {
  const { t } = useTranslation('vpn');
  const format = useFormat();
  const activeTunnels = clients.filter((c) => c.enabled).length;
  const activeServers = servers.filter((s) => s.running).length;

  return (
    <SectionGrid>
      <StatCard icon={<Shield size={14} />} tone="warning" label={t('stats.activeTunnels')}>
        {loading ? (
          <>
            <Skeleton width={32} height={28} radius={4} />
            <Skeleton width={120} height={14} radius={4} />
          </>
        ) : (
          <>
            <span className={styles.statValue}>{format.number(activeTunnels)}</span>
            <span className={styles.statHint}>
              {t('stats.configured', {
                active: format.number(clients.length ? activeTunnels : 0),
                total: format.number(clients.length),
              })}
            </span>
          </>
        )}
      </StatCard>

      <StatCard icon={<Server size={14} />} tone="success" label={t('stats.servers')}>
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
              <span className={styles.statValue}>{format.number(activeServers)}</span>
              <span className={styles.statAside}>/ {format.number(servers.length)}</span>
            </Inline>
            <span className={styles.statHint}>{t('stats.activeServers')}</span>
          </>
        )}
      </StatCard>

      <StatCard icon={<Monitor size={14} />} tone="info" label={t('stats.clients')}>
        {activeConnections === null ? (
          <>
            <Skeleton width={32} height={28} radius={4} />
            <Skeleton width={96} height={14} radius={4} />
          </>
        ) : (
          <>
            <span className={styles.statValue}>{format.number(activeConnections)}</span>
            <span className={styles.statHint}>{t('stats.activeConnections')}</span>
          </>
        )}
      </StatCard>

      <StatCard icon={<Layers size={14} />} tone="primary" label={t('stats.protocols')}>
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
            <span className={styles.statValue}>{format.number(protocols.length)}</span>
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
