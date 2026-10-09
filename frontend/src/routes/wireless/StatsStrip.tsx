import { Radio, SignalHigh, Users as UsersIcon, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Inline, Progress, SectionGrid } from '@nasnet/ui';
import type { Interface, WirelessClient } from '../../api';
import { useFormat } from '../../utils/useFormat';
import styles from '../WirelessPage.module.scss';
import { StatCard } from './StatCard';

interface Props {
  clients: WirelessClient[];
  interfaces: Interface[];
}

export function StatsStrip({ clients, interfaces }: Props) {
  const { t } = useTranslation('wireless');
  const { number } = useFormat();
  const clientCount = clients.length;
  const running = interfaces.filter((i) => i.running).length;
  const total = interfaces.length;
  const avgSignal = clientCount
    ? Math.round(clients.reduce((sum, c) => sum + c.signalDbm, 0) / clientCount)
    : null;
  const bands = Array.from(
    new Set(interfaces.map((i) => i.band).filter((b): b is NonNullable<typeof b> => Boolean(b))),
  ).sort();

  return (
    <SectionGrid>
      <StatCard icon={<UsersIcon size={18} />} tone="info" label={t('stats.clients')}>
        <span className={styles.statValue}>{number(clientCount)}</span>
        <span className={styles.statHint}>{t('stats.connectedDevices')}</span>
      </StatCard>

      <StatCard icon={<Wifi size={18} />} tone="success" label={t('stats.active')}>
        <Inline $gap="6px">
          <span className={styles.statValue}>{number(running)}</span>
          <span className={styles.statAside}>
            {t('stats.activeTotal', { total: number(total) })}
          </span>
        </Inline>
        <Progress value={running} max={total || 1} tone="success" />
      </StatCard>

      <StatCard icon={<SignalHigh size={18} />} tone="warning" label={t('stats.signal')}>
        <span className={styles.statValue}>
          {avgSignal !== null ? (
            t('stats.dbm', { value: number(avgSignal, { useGrouping: false }) })
          ) : (
            <span className={styles.signalEmpty}>—</span>
          )}
        </span>
        <span className={styles.statHint}>
          {avgSignal !== null ? t('stats.averageRssi') : t('stats.noClients')}
        </span>
      </StatCard>

      <StatCard icon={<Radio size={18} />} tone="info" label={t('stats.bands')}>
        <span className={styles.statValue}>
          {bands.length > 0 ? (
            bands.map((b) => b.toUpperCase()).join(t('listSeparator'))
          ) : (
            <span className={styles.signalEmpty}>—</span>
          )}
        </span>
        <span className={styles.statHint}>
          {total > 0
            ? t('stats.interfaceCount', { count: total, value: number(total) })
            : t('stats.noInterfaces')}
        </span>
      </StatCard>
    </SectionGrid>
  );
}
