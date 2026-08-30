import React, { useState } from 'react';
import { Globe } from 'lucide-react';
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

const LINKS: Array<{ type: Exclude<NetHostType, ''>; label: string }> = [
  { type: 'foreign', label: 'Foreign' },
  { type: 'domestic', label: 'Domestic' },
  { type: 'vpn', label: 'VPN' },
];

const PRESENTATION: Record<
  LinkState,
  {
    dot: 'online' | 'offline' | 'unknown';
    tone: 'success' | 'danger' | 'neutral';
    badge: string;
    health: string;
  }
> = {
  up: { dot: 'online', tone: 'success', badge: 'UP', health: 'Healthy' },
  down: { dot: 'offline', tone: 'danger', badge: 'DOWN', health: 'Warning' },
  unknown: { dot: 'unknown', tone: 'neutral', badge: 'UNKNOWN', health: 'No data' },
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
        aria-label="Connectivity"
        data-testid="connectivity-card"
      >
        <div className={styles.networkCardHeader}>
          <div className={styles.networkCardTitle}>
            <div className={styles.iconCircle} aria-hidden>
              <Globe size={16} />
            </div>
            Connectivity
          </div>
        </div>
        <div className={styles.vpnList} role="list" aria-label="Link reachability">
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
                <span className={styles.vpnName}>{label}</span>
                <Badge tone={view.tone}>{view.badge}</Badge>
                <span className={styles.connectivityHealth}>{view.health}</span>
              </div>
            );
          })}
        </div>
      </Card>
    );
  },
);
