import { SignalHigh } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Card, CardDescription, CardHeader, CardTitle, DataTable } from '@nasnet/ui';
import type { WirelessClient } from '../../api';
import { useFormat } from '../../utils/useFormat';
import styles from '../WirelessPage.module.scss';

interface Props {
  clients: WirelessClient[];
}

const signalTone = (dbm: number) => (dbm > -60 ? 'success' : dbm > -70 ? 'warning' : 'danger');

export function ClientsCard({ clients }: Props) {
  const { t } = useTranslation('wireless');
  const { number } = useFormat();
  // No grouping, so values keep the exact digits the router reports.
  const plain = (value: number) => number(value, { useGrouping: false });
  return (
    <Card>
      <CardHeader className={styles.cardHeaderRow}>
        <div>
          <CardTitle>{t('clients.title')}</CardTitle>
          <CardDescription>{t('clients.description')}</CardDescription>
        </div>
      </CardHeader>
      {clients.length > 0 ? (
        <DataTable
          columns={[
            {
              key: 'hostname',
              header: t('clients.hostname'),
              render: (c: WirelessClient) => <span dir="auto">{c.hostname}</span>,
            },
            {
              key: 'ip',
              header: t('clients.ip'),
              render: (c: WirelessClient) => <span dir="ltr">{c.ip}</span>,
            },
            {
              key: 'mac',
              header: t('clients.mac'),
              render: (c: WirelessClient) => <span dir="ltr">{c.mac}</span>,
            },
            {
              key: 'band',
              header: t('clients.band'),
              render: (c: WirelessClient) => <Badge tone="neutral">{c.band.toUpperCase()}</Badge>,
            },
            {
              key: 'signal',
              header: t('clients.signal'),
              render: (c: WirelessClient) => (
                <Badge tone={signalTone(c.signalDbm)}>
                  {t('stats.dbm', { value: plain(c.signalDbm) })}
                </Badge>
              ),
            },
            {
              key: 'throughput',
              header: t('clients.throughput'),
              render: (c: WirelessClient) =>
                t('clients.throughputValue', { tx: plain(c.txKbps), rx: plain(c.rxKbps) }),
            },
            {
              key: 'connectedFor',
              header: t('clients.uptime'),
              render: (c: WirelessClient) => c.connectedFor,
            },
          ]}
          rows={clients}
          rowKey={(c) => c.mac}
        />
      ) : (
        <div className={styles.emptyBlock}>
          <SignalHigh size={28} aria-hidden color="currentColor" />
          <span>{t('clients.empty')}</span>
        </div>
      )}
    </Card>
  );
}
