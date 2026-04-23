import { SignalHigh } from 'lucide-react';
import { Badge, Card, CardDescription, CardHeader, CardTitle, DataTable } from '@nasnet/ui';
import type { WirelessClient } from '../../api';
import styles from '../WirelessPage.module.scss';

interface Props {
  clients: WirelessClient[];
}

const signalTone = (dbm: number) => (dbm > -60 ? 'success' : dbm > -70 ? 'warning' : 'danger');

export function ClientsCard({ clients }: Props) {
  return (
    <Card>
      <CardHeader className={styles.cardHeaderRow}>
        <div>
          <CardTitle>Connected Clients</CardTitle>
          <CardDescription>Devices associated to this router&apos;s wireless.</CardDescription>
        </div>
      </CardHeader>
      {clients.length > 0 ? (
        <DataTable
          columns={[
            { key: 'hostname', header: 'Hostname', render: (c: WirelessClient) => c.hostname },
            { key: 'ip', header: 'IP', render: (c: WirelessClient) => c.ip },
            { key: 'mac', header: 'MAC', render: (c: WirelessClient) => c.mac },
            {
              key: 'band',
              header: 'Band',
              render: (c: WirelessClient) => <Badge tone="neutral">{c.band.toUpperCase()}</Badge>,
            },
            {
              key: 'signal',
              header: 'Signal',
              render: (c: WirelessClient) => (
                <Badge tone={signalTone(c.signalDbm)}>{c.signalDbm} dBm</Badge>
              ),
            },
            {
              key: 'throughput',
              header: 'TX / RX',
              render: (c: WirelessClient) => `${c.txKbps} / ${c.rxKbps} kbps`,
            },
            {
              key: 'connectedFor',
              header: 'Uptime',
              render: (c: WirelessClient) => c.connectedFor,
            },
          ]}
          rows={clients}
          rowKey={(c) => c.mac}
        />
      ) : (
        <div className={styles.emptyBlock}>
          <SignalHigh size={28} aria-hidden color="currentColor" />
          <span>No clients connected</span>
        </div>
      )}
    </Card>
  );
}
