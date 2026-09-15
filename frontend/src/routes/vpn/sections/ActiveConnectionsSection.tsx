import { useCallback, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, ConfirmDialog, DataTable, Select, Stack, useToast } from '@nasnet/ui';
import { Activity, Unplug } from 'lucide-react';
import {
  ApiError,
  disconnectActiveVPNSession,
  listActiveVPNConnections,
  type ActiveVPNConnectionsResponse,
  type VPNCredentials,
  type VPNServer,
} from '../../../api';
import { usePolling } from '../../../utils/usePolling';
import { PaginationControls } from '../PaginationControls';
import { usePagedFilter } from '../hooks/usePagedFilter';
import { PAGE_SIZE } from '../utils';
import styles from '../../VPNPage.module.scss';
import { SectionHeader } from './SectionHeader';

interface ActiveConnection {
  key: string;
  id: string;
  kind: 'ppp' | 'wireguard';
  name: string;
  service: string;
  interfaceName?: string;
  address: string;
  callerId: string;
  uptime: string;
  details: string;
}

const SERVICE_LABELS: Record<string, string> = {
  ovpn: 'OpenVPN',
  wireguard: 'WireGuard',
};

const serviceLabel = (service: string) => SERVICE_LABELS[service] ?? service.toUpperCase();

const PROTOCOL_TO_SERVICE: Partial<Record<VPNServer['protocol'], string>> = {
  openvpn: 'ovpn',
  pptp: 'pptp',
  l2tp: 'l2tp',
  sstp: 'sstp',
};

function toRows(data: ActiveVPNConnectionsResponse): ActiveConnection[] {
  const ppp = data.pppSessions.map<ActiveConnection>((s) => ({
    key: `ppp:${s.id}`,
    id: s.id,
    kind: 'ppp',
    name: s.name,
    service: s.service,
    address: s.address ?? '',
    callerId: s.callerID ?? '',
    uptime: s.uptime,
    details: s.encoding ?? '',
  }));
  const wg = data.wireguardPeers.map<ActiveConnection>((p) => ({
    key: `wg:${p.id}`,
    id: p.id,
    kind: 'wireguard',
    name: p.name || p.publicKey,
    service: 'wireguard',
    interfaceName: p.interfaceName,
    address: p.clientAddress || p.allowedAddresses,
    callerId: '',
    uptime: p.lastHandshake ? `handshake ${p.lastHandshake} ago` : '',
    details: `${p.interfaceName} rx ${p.rx} tx ${p.tx}`,
  }));
  return [...ppp, ...wg];
}

function matchesServer(row: ActiveConnection, server: VPNServer) {
  if (server.protocol === 'wireguard') {
    return row.kind === 'wireguard' && row.interfaceName === server.name;
  }
  return row.kind === 'ppp' && row.service === PROTOCOL_TO_SERVICE[server.protocol];
}

const matches = (r: ActiveConnection, q: string) =>
  r.name.toLowerCase().includes(q) ||
  r.service.toLowerCase().includes(q) ||
  r.address.toLowerCase().includes(q) ||
  r.callerId.toLowerCase().includes(q);

interface Props {
  creds: VPNCredentials | null;
  server?: VPNServer;
}

export function ActiveConnectionsSection({ creds, server }: Props) {
  const toast = useToast();
  const [rows, setRows] = useState<ActiveConnection[]>([]);
  const [pendingDisconnect, setPendingDisconnect] = useState<ActiveConnection | null>(null);
  const [disconnectSubmitting, setDisconnectSubmitting] = useState(false);
  const [service, setService] = useState('all');
  const disconnected = useRef(new Set<string>());

  const load = useCallback(async () => {
    if (!creds) return;
    const data = await listActiveVPNConnections(creds).catch(() => null);
    if (!data) return;
    const next = toRows(data);
    const present = new Set(next.map((r) => r.key));
    disconnected.current.forEach((k) => {
      if (!present.has(k)) disconnected.current.delete(k);
    });
    setRows(next.filter((r) => !disconnected.current.has(r.key)));
  }, [creds]);

  usePolling(load, 5000, !!creds);

  const visible = useMemo(
    () =>
      rows.filter((r) =>
        server ? matchesServer(r, server) : service === 'all' || r.service === service,
      ),
    [rows, server, service],
  );
  const serviceOptions = useMemo(() => {
    const services = new Set(rows.map((r) => r.service));
    if (service !== 'all') services.add(service);
    return [
      { value: 'all', label: 'All services' },
      ...[...services].sort().map((s) => ({ value: s, label: serviceLabel(s) })),
    ];
  }, [rows, service]);
  const paged = usePagedFilter(visible, matches);

  const onConfirmDisconnect = async () => {
    if (!creds || !pendingDisconnect) return;
    const target = pendingDisconnect;
    setDisconnectSubmitting(true);
    try {
      await disconnectActiveVPNSession(creds, target.id);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to disconnect session.';
      toast.notify({ title: 'Failed to disconnect', description: message, tone: 'danger' });
      setDisconnectSubmitting(false);
      return;
    }
    disconnected.current.add(target.key);
    setRows((prev) => prev.filter((r) => r.key !== target.key));
    setDisconnectSubmitting(false);
    setPendingDisconnect(null);
    toast.notify({ title: `"${target.name}" disconnected`, tone: 'info' });
  };

  const table = (
    <>
      <div className={styles.connectionsScroll}>
        <DataTable
          columns={[
            { key: 'name', header: 'Name', render: (r: ActiveConnection) => r.name },
            ...(server
              ? []
              : [
                  {
                    key: 'service',
                    header: 'Service',
                    render: (r: ActiveConnection) => (
                      <Badge tone="info">{serviceLabel(r.service)}</Badge>
                    ),
                  },
                ]),
            {
              key: 'address',
              header: 'Address',
              render: (r: ActiveConnection) => r.address || '–',
            },
            {
              key: 'callerId',
              header: 'Caller ID',
              render: (r: ActiveConnection) => r.callerId || '–',
            },
            { key: 'uptime', header: 'Uptime', render: (r: ActiveConnection) => r.uptime || '–' },
            {
              key: 'details',
              header: 'Session',
              render: (r: ActiveConnection) => r.details || '–',
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (r: ActiveConnection) =>
                r.kind === 'ppp' ? (
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={!creds}
                    title={`Disconnect ${r.name}`}
                    aria-label={`Disconnect ${r.name}`}
                    onClick={() => setPendingDisconnect(r)}
                  >
                    <Unplug size={14} aria-hidden />
                  </Button>
                ) : null,
              width: '100px',
            },
          ]}
          rows={paged.pagedRows}
          rowKey={(r) => r.key}
          emptyMessage={
            visible.length || service !== 'all'
              ? 'No connections match the current filters.'
              : 'No active connections.'
          }
          emptyIcon={<Activity size={32} aria-hidden />}
        />
      </div>
      <PaginationControls
        page={paged.page}
        totalPages={paged.totalPages}
        total={paged.filteredCount}
        pageSize={PAGE_SIZE}
        onPrev={paged.onPrev}
        onNext={paged.onNext}
      />
    </>
  );

  const confirm = (
    <ConfirmDialog
      open={!!pendingDisconnect}
      title="Disconnect session"
      description={
        pendingDisconnect
          ? `Disconnect "${pendingDisconnect.name}" now? The user account is kept and can reconnect.`
          : undefined
      }
      confirmLabel={disconnectSubmitting ? 'Disconnecting…' : 'Disconnect'}
      destructive
      onConfirm={onConfirmDisconnect}
      onCancel={() => (disconnectSubmitting ? undefined : setPendingDisconnect(null))}
    />
  );

  if (server) {
    return (
      <section aria-label="Active connections" style={{ marginTop: 16 }}>
        <strong>
          Active connections <Badge tone="info">{visible.length}</Badge>
        </strong>
        <div style={{ marginTop: 8 }}>{table}</div>
        {confirm}
      </section>
    );
  }

  return (
    <Stack>
      <Card>
        <SectionHeader
          title="Active Connections"
          count={visible.length}
          description="Clients currently connected to your VPN servers."
          filters={
            <Select
              className={styles.headerFilter}
              aria-label="Service filter"
              value={service}
              onChange={setService}
              options={serviceOptions}
            />
          }
          search={{
            value: paged.search,
            placeholder: 'Search connections…',
            ariaLabel: 'Search connections',
            onChange: paged.setSearch,
          }}
        />
        <div style={{ marginTop: 16 }}>{table}</div>
      </Card>
      {confirm}
    </Stack>
  );
}
