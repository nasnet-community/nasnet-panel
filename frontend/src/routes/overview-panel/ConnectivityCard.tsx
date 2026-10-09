import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Card, StatusDot } from '@nasnet/ui';
import {
  fetchNetStatus,
  type NetHostType,
  type NetStatusEntry,
  type SystemCredentials,
} from '../../api';
import { usePolling } from '../../utils/usePolling';
import styles from '../OverviewTab.module.scss';

const CONNECTIVITY_REFRESH_MS = 10_000;

type LinkState = 'up' | 'down' | 'unknown';

const LINKS = [
  { type: 'foreign', label: 'connectivity.foreign' },
  { type: 'domestic', label: 'connectivity.domestic' },
  { type: 'vpn', label: 'connectivity.vpn' },
] as const satisfies ReadonlyArray<{ type: Exclude<NetHostType, ''>; label: string }>;

const PRESENTATION: Record<
  LinkState,
  {
    dot: 'online' | 'offline' | 'unknown';
    tone: 'success' | 'danger' | 'neutral';
    badge: 'connectivity.badgeUp' | 'connectivity.badgeDown' | 'connectivity.badgeUnknown';
    health: 'connectivity.healthy' | 'connectivity.warning' | 'connectivity.noData';
  }
> = {
  up: {
    dot: 'online',
    tone: 'success',
    badge: 'connectivity.badgeUp',
    health: 'connectivity.healthy',
  },
  down: {
    dot: 'offline',
    tone: 'danger',
    badge: 'connectivity.badgeDown',
    health: 'connectivity.warning',
  },
  unknown: {
    dot: 'unknown',
    tone: 'neutral',
    badge: 'connectivity.badgeUnknown',
    health: 'connectivity.noData',
  },
};

function resolveState(entries: NetStatusEntry[], type: NetHostType): LinkState {
  const matching = entries.filter((e) => e.type === type);
  if (matching.length === 0) return 'unknown';
  if (matching.some((e) => e.status === 'down')) return 'down';
  if (matching.some((e) => e.status === 'up')) return 'up';
  return 'unknown';
}

export interface ConnectivityCardProps {
  creds: SystemCredentials | null;
}

export const ConnectivityCard: React.FC<ConnectivityCardProps> = React.memo(
  function ConnectivityCardInner({ creds }) {
    const { t } = useTranslation('overview');
    const [entries, setEntries] = useState<NetStatusEntry[]>([]);

    usePolling(
      async () => {
        if (!creds) return;
        const next = await fetchNetStatus(creds).catch((): NetStatusEntry[] => []);
        setEntries(next);
      },
      CONNECTIVITY_REFRESH_MS,
      Boolean(creds),
    );

    return (
      <Card
        className={styles.networkCard}
        aria-label={t('connectivity.title')}
        data-testid="connectivity-card"
      >
        <div className={styles.networkCardHeader}>
          <div className={styles.networkCardTitle}>
            <div className={styles.iconCircle} aria-hidden>
              <Globe size={16} />
            </div>
            {t('connectivity.title')}
          </div>
        </div>
        <div className={styles.vpnList} role="list" aria-label={t('connectivity.listAria')}>
          {LINKS.map(({ type, label }) => {
            const view = PRESENTATION[resolveState(entries, type)];
            return (
              <div
                key={type}
                className={styles.vpnRow}
                role="listitem"
                data-testid={`connectivity-${type}`}
              >
                <StatusDot $status={view.dot} className={styles.connectivityDot} aria-hidden />
                <span className={styles.vpnName}>{t(label)}</span>
                <Badge tone={view.tone}>{t(view.badge)}</Badge>
                <span className={styles.connectivityHealth}>{t(view.health)}</span>
              </div>
            );
          })}
        </div>
      </Card>
    );
  },
);
