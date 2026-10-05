import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useFormat } from '../../../utils/useFormat';
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
  // WireGuard rows: shown through translated templates at render time.
  handshake?: string;
  rx?: string;
  tx?: string;
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
    uptime: '',
    details: '',
    handshake: p.lastHandshake || undefined,
    rx: p.rx,
    tx: p.tx,
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
  onCountChange?: (count: number) => void;
}

export function ActiveConnectionsSection({ creds, server, onCountChange }: Props) {
  const toast = useToast();
  const { t } = useTranslation('vpn');
  const format = useFormat();
  const [rows, setRows] = useState<ActiveConnection[]>([]);
  const [pendingDisconnect, setPendingDisconnect] = useState<ActiveConnection | null>(null);
  const [disconnectSubmitting, setDisconnectSubmitting] = useState(false);
  const [service, setService] = useState('all');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const disconnected = useRef(new Set<string>());

  const load = useCallback(async () => {
    if (!creds) return;
    let data: ActiveVPNConnectionsResponse;
    try {
      data = await listActiveVPNConnections(creds);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : t('active.loadFailedDescription'));
      return;
    }
    setLoadError(null);
    const next = toRows(data);
    const present = new Set(next.map((r) => r.key));
    disconnected.current.forEach((k) => {
      if (!present.has(k)) disconnected.current.delete(k);
    });
    setRows(next.filter((r) => !disconnected.current.has(r.key)));
    setLoaded(true);
  }, [creds, t]);

  usePolling(load, 5000, !!creds);

  useEffect(() => {
    if (loaded) onCountChange?.(rows.length);
  }, [loaded, rows.length, onCountChange]);

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
      { value: 'all', label: t('active.allServices') },
      ...[...services].sort().map((s) => ({ value: s, label: serviceLabel(s) })),
    ];
  }, [rows, service, t]);
  const paged = usePagedFilter(visible, matches);

  const onConfirmDisconnect = async () => {
    if (disconnectSubmitting || !creds || !pendingDisconnect) return;
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
            : t('active.toast.disconnectFailedDescription');
      toast.notify({
        title: t('active.toast.disconnectFailed'),
        description: message,
        tone: 'danger',
      });
      setDisconnectSubmitting(false);
      return;
    }
    disconnected.current.add(target.key);
    setRows((prev) => prev.filter((r) => r.key !== target.key));
    setDisconnectSubmitting(false);
    setPendingDisconnect(null);
    toast.notify({ title: t('active.toast.disconnected', { name: target.name }), tone: 'info' });
  };

  const table = (
    <>
      <div className={styles.connectionsScroll}>
        <DataTable
          columns={[
            { key: 'name', header: t('shared.name'), render: (r: ActiveConnection) => r.name },
            ...(server
              ? []
              : [
                  {
                    key: 'service',
                    header: t('active.table.service'),
                    render: (r: ActiveConnection) => (
                      <Badge tone="info">{serviceLabel(r.service)}</Badge>
                    ),
                  },
                ]),
            {
              key: 'address',
              header: t('active.table.address'),
              render: (r: ActiveConnection) =>
                r.address ? <span dir="ltr">{r.address}</span> : '–',
            },
            {
              key: 'callerId',
              header: t('active.table.callerId'),
              render: (r: ActiveConnection) =>
                r.callerId ? <span dir="ltr">{r.callerId}</span> : '–',
            },
            {
              key: 'uptime',
              header: t('active.table.uptime'),
              render: (r: ActiveConnection) =>
                r.kind === 'wireguard'
                  ? r.handshake
                    ? t('active.table.handshake', { time: r.handshake })
                    : '–'
                  : r.uptime || '–',
            },
            {
              key: 'details',
              header: t('active.table.session'),
              render: (r: ActiveConnection) =>
                r.kind === 'wireguard'
                  ? t('active.table.wgDetails', {
                      iface: r.interfaceName ?? '',
                      rx: r.rx ?? '',
                      tx: r.tx ?? '',
                    })
                  : r.details || '–',
            },
            {
              key: 'actions',
              header: t('shared.actions'),
              render: (r: ActiveConnection) =>
                r.kind === 'ppp' ? (
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={!creds}
                    title={t('active.disconnectNamed', { name: r.name })}
                    aria-label={t('active.disconnectNamed', { name: r.name })}
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
            loadError && !rows.length
              ? t('active.table.loadFailed', { error: loadError })
              : visible.length || service !== 'all'
                ? t('active.table.noMatch')
                : t('active.table.empty')
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
      title={t('active.confirm.title')}
      description={
        pendingDisconnect
          ? t('active.confirm.description', { name: pendingDisconnect.name })
          : undefined
      }
      confirmLabel={
        disconnectSubmitting ? t('active.confirm.disconnecting') : t('active.confirm.disconnect')
      }
      destructive
      onConfirm={onConfirmDisconnect}
      onCancel={() => (disconnectSubmitting ? undefined : setPendingDisconnect(null))}
    />
  );

  if (server) {
    return (
      <section aria-label={t('stats.activeConnections')} style={{ marginTop: 16 }}>
        <strong>
          {t('stats.activeConnections')} <Badge tone="info">{format.number(visible.length)}</Badge>
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
          title={t('active.title')}
          count={visible.length}
          description={t('active.description')}
          filters={
            <Select
              className={styles.headerFilter}
              aria-label={t('active.serviceFilter')}
              value={service}
              onChange={setService}
              options={serviceOptions}
            />
          }
          search={{
            value: paged.search,
            placeholder: t('active.searchPlaceholder'),
            ariaLabel: t('active.searchLabel'),
            onChange: paged.setSearch,
          }}
        />
        <div style={{ marginTop: 16 }}>{table}</div>
      </Card>
      {confirm}
    </Stack>
  );
}
