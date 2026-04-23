import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Cable, Inbox, Pin, Server, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  Skeleton,
  Stack,
  useToast,
} from '@nasnet/ui';
import styles from './DHCPPage.module.scss';
import {
  fetchDhcpClients,
  fetchDhcpLeases,
  fetchDhcpServers,
  makeDhcpLeaseStatic,
  removeDhcpLease,
  type DhcpClient,
  type DhcpLease,
  type DhcpServer,
} from '../api';
import { useSession } from '../state/SessionContext';
import { useRouter } from '../state/RouterStoreContext';

interface SectionState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

const initial = <T,>(): SectionState<T> => ({ data: [], loading: true, error: null });

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function leaseStatusTone(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const s = status.toLowerCase();
  if (s === 'bound') return 'success';
  if (s === 'waiting' || s === 'offered') return 'warning';
  if (s === 'busy') return 'danger';
  return 'info';
}

export function DHCPPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const { getCredentials } = useSession();
  const toast = useToast();

  const [servers, setServers] = useState<SectionState<DhcpServer>>(initial<DhcpServer>());
  const [leases, setLeases] = useState<SectionState<DhcpLease>>(initial<DhcpLease>());
  const [clients, setClients] = useState<SectionState<DhcpClient>>(initial<DhcpClient>());
  const [busyMac, setBusyMac] = useState<string | null>(null);
  const [leaseToRemove, setLeaseToRemove] = useState<DhcpLease | null>(null);
  const inFlightRef = useRef(false);

  const reload = useCallback(
    async (silent = false) => {
      if (!id) return;
      if (inFlightRef.current) return;
      const creds = getCredentials(id);
      const host = router?.host;
      if (!creds || !host) {
        const missing = 'Missing router credentials for this session.';
        setServers({ data: [], loading: false, error: missing });
        setLeases({ data: [], loading: false, error: missing });
        setClients({ data: [], loading: false, error: missing });
        return;
      }
      if (!silent) {
        setServers((s) => ({ ...s, loading: true, error: null }));
        setLeases((s) => ({ ...s, loading: true, error: null }));
        setClients((s) => ({ ...s, loading: true, error: null }));
      }

      inFlightRef.current = true;
      const full = { host, ...creds };
      const [sResult, lResult, cResult] = await Promise.allSettled([
        fetchDhcpServers(full),
        fetchDhcpLeases(full),
        fetchDhcpClients(full),
      ]);
      inFlightRef.current = false;

      setServers(
        sResult.status === 'fulfilled'
          ? { data: sResult.value, loading: false, error: null }
          : {
              data: [],
              loading: false,
              error: errorMessage(sResult.reason, 'Failed to load servers.'),
            },
      );
      setLeases(
        lResult.status === 'fulfilled'
          ? { data: lResult.value, loading: false, error: null }
          : {
              data: [],
              loading: false,
              error: errorMessage(lResult.reason, 'Failed to load leases.'),
            },
      );
      setClients(
        cResult.status === 'fulfilled'
          ? { data: cResult.value, loading: false, error: null }
          : {
              data: [],
              loading: false,
              error: errorMessage(cResult.reason, 'Failed to load clients.'),
            },
      );
    },
    [id, router?.host, getCredentials],
  );

  useEffect(() => {
    void reload();
    const interval = window.setInterval(() => {
      void reload(true);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [reload]);

  const handleMakeStatic = useCallback(
    async (lease: DhcpLease) => {
      if (!id) return;
      const creds = getCredentials(id);
      const host = router?.host;
      if (!creds || !host) return;
      setBusyMac(lease.macAddress);
      try {
        await makeDhcpLeaseStatic({ host, ...creds }, lease.macAddress);
        toast.notify({
          title: 'Lease made static',
          description: `${lease.address} · ${lease.macAddress}`,
          tone: 'success',
        });
        await reload();
      } catch (err) {
        toast.notify({
          title: 'Failed to make lease static',
          description: errorMessage(err, 'Unknown error'),
          tone: 'danger',
        });
      } finally {
        setBusyMac(null);
      }
    },
    [id, router?.host, getCredentials, reload, toast],
  );

  const handleRemove = useCallback(async () => {
    const lease = leaseToRemove;
    if (!id || !lease) return;
    const creds = getCredentials(id);
    const host = router?.host;
    if (!creds || !host) return;
    setBusyMac(lease.macAddress);
    setLeaseToRemove(null);
    try {
      await removeDhcpLease({ host, ...creds }, lease.macAddress);
      toast.notify({
        title: 'Lease removed',
        description: `${lease.address} · ${lease.macAddress}`,
        tone: 'success',
      });
      await reload();
    } catch (err) {
      toast.notify({
        title: 'Failed to remove lease',
        description: errorMessage(err, 'Unknown error'),
        tone: 'danger',
      });
    } finally {
      setBusyMac(null);
    }
  }, [id, router?.host, getCredentials, leaseToRemove, reload, toast]);

  const serverColumns: DataTableColumn<DhcpServer>[] = [
    { key: 'name', header: 'Name', render: (r) => r.name || '—' },
    {
      key: 'interface',
      header: 'Interface',
      render: (r) => <span className={styles.mono}>{r.interface}</span>,
    },
    { key: 'pool', header: 'Address pool', render: (r) => r.addressPool || '—' },
    {
      key: 'ranges',
      header: 'Ranges',
      render: (r) =>
        r.ranges.length > 0 ? (
          <span className={styles.mono}>{r.ranges.join(', ')}</span>
        ) : (
          <span className={styles.muted}>—</span>
        ),
    },
    {
      key: 'lease',
      header: 'Lease time',
      render: (r) => r.leaseTime || <span className={styles.muted}>—</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) =>
        r.disabled ? <Badge tone="warning">disabled</Badge> : <Badge tone="success">enabled</Badge>,
    },
  ];

  const leaseColumns: DataTableColumn<DhcpLease>[] = [
    {
      key: 'address',
      header: 'Address',
      render: (r) => <span className={styles.mono}>{r.address}</span>,
    },
    {
      key: 'mac',
      header: 'MAC',
      render: (r) => <span className={styles.mono}>{r.macAddress}</span>,
    },
    {
      key: 'host',
      header: 'Host',
      render: (r) => r.hostName || <span className={styles.muted}>—</span>,
    },
    {
      key: 'server',
      header: 'Server',
      render: (r) => r.serverName || <span className={styles.muted}>—</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) =>
        r.dynamic ? <Badge tone="info">dynamic</Badge> : <Badge tone="success">static</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) =>
        r.status ? (
          <Badge tone={leaseStatusTone(r.status)}>{r.status}</Badge>
        ) : (
          <span className={styles.muted}>—</span>
        ),
    },
    {
      key: 'expires',
      header: 'Expires',
      render: (r) => r.expiresAfter || <span className={styles.muted}>—</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '200px',
      render: (r) => (
        <div className={styles.rowActions}>
          {r.dynamic ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                handleMakeStatic(r);
              }}
              disabled={busyMac === r.macAddress}
              aria-label={`Make static ${r.macAddress}`}
              title="Make static"
            >
              <Pin size={14} aria-hidden />
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="danger"
            onClick={() => setLeaseToRemove(r)}
            disabled={busyMac === r.macAddress}
            aria-label={`Remove lease ${r.macAddress}`}
            title="Remove"
          >
            <Trash2 size={14} aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  const clientColumns: DataTableColumn<DhcpClient>[] = [
    {
      key: 'interface',
      header: 'Interface',
      render: (r) => <span className={styles.mono}>{r.interface}</span>,
    },
    {
      key: 'address',
      header: 'Address',
      render: (r) => <span className={styles.mono}>{r.address || '—'}</span>,
    },
    { key: 'status', header: 'Status', render: (r) => r.status || '—' },
    {
      key: 'gateway',
      header: 'Gateway',
      render: (r) =>
        r.gateway ? (
          <span className={styles.mono}>{r.gateway}</span>
        ) : (
          <span className={styles.muted}>—</span>
        ),
    },
    {
      key: 'dns',
      header: 'DNS',
      render: (r) => {
        const dns = [r.primaryDns, r.secondaryDns].filter(Boolean).join(', ');
        return dns ? (
          <span className={styles.mono}>{dns}</span>
        ) : (
          <span className={styles.muted}>—</span>
        );
      },
    },
    {
      key: 'state',
      header: 'State',
      render: (r) =>
        r.disabled ? <Badge tone="warning">disabled</Badge> : <Badge tone="success">enabled</Badge>,
    },
  ];

  const loadingRows = (cols: number) => {
    const cellKeys = Array.from({ length: cols }, (_, i) => `c${i}`);
    return (
      <div data-testid="dhcp-skeleton">
        {['a', 'b', 'c'].map((k) => (
          <div
            key={`skeleton-${k}`}
            className={styles.skeletonRow}
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {cellKeys.map((cellKey) => (
              <Skeleton key={`${k}-${cellKey}`} height={14} />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Stack>
      <Card data-testid="dhcp-servers">
        <CardHeader>
          <CardTitle>Servers</CardTitle>
          <CardDescription>DHCP server instances bound to router interfaces.</CardDescription>
        </CardHeader>
        {servers.error ? <div className={styles.errorBanner}>{servers.error}</div> : null}
        {servers.loading ? (
          loadingRows(6)
        ) : servers.data.length === 0 ? (
          <div className={styles.empty}>
            <Server size={22} aria-hidden className={styles.emptyIcon} />
            <p>No DHCP servers configured.</p>
          </div>
        ) : (
          <DataTable columns={serverColumns} rows={servers.data} rowKey={(r) => r.id} />
        )}
      </Card>

      <Card data-testid="dhcp-leases">
        <CardHeader>
          <CardTitle>Leases</CardTitle>
          <CardDescription>Active DHCP leases issued to clients on the LAN.</CardDescription>
        </CardHeader>
        {leases.error ? <div className={styles.errorBanner}>{leases.error}</div> : null}
        {leases.loading ? (
          loadingRows(6)
        ) : leases.data.length === 0 ? (
          <div className={styles.empty}>
            <Inbox size={22} aria-hidden className={styles.emptyIcon} />
            <p>No active leases.</p>
          </div>
        ) : (
          <DataTable
            columns={leaseColumns}
            rows={leases.data}
            rowKey={(r) => r.id || r.macAddress}
          />
        )}
      </Card>

      <Card data-testid="dhcp-clients">
        <CardHeader>
          <CardTitle>Clients</CardTitle>
          <CardDescription>
            Interfaces on which this router acts as a DHCP client (WAN).
          </CardDescription>
        </CardHeader>
        {clients.error ? <div className={styles.errorBanner}>{clients.error}</div> : null}
        {clients.loading ? (
          loadingRows(6)
        ) : clients.data.length === 0 ? (
          <div className={styles.empty}>
            <Cable size={22} aria-hidden className={styles.emptyIcon} />
            <p>This router is not a DHCP client on any interface.</p>
          </div>
        ) : (
          <DataTable columns={clientColumns} rows={clients.data} rowKey={(r) => r.id} />
        )}
      </Card>

      <ConfirmDialog
        open={!!leaseToRemove}
        title="Remove DHCP lease"
        description={
          leaseToRemove
            ? `Remove the lease for ${leaseToRemove.address} (${leaseToRemove.macAddress})? This cannot be undone.`
            : undefined
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleRemove}
        onCancel={() => setLeaseToRemove(null)}
      />
    </Stack>
  );
}
