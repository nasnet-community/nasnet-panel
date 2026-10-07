import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cable, Inbox, Pin, Trash2 } from 'lucide-react';
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
  fetchEthernetInterfaces,
  fetchInterfaces,
  fetchSystemOverview,
  makeDhcpLeaseStatic,
  removeDhcpLease,
  type DhcpClient,
  type DhcpLease,
  type InterfaceResponse,
} from '../api';
import { useSession } from '../state/SessionContext';
import { useRouter } from '../state/RouterStoreContext';
import { RouterPortDiagramCard } from './overview-panel/RouterPortDiagramCard';
import type { IfaceLink } from './overview-panel/types';
import { BridgePortsCard } from './lan/BridgePortsCard';

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
  const { t } = useTranslation('network');

  const [leases, setLeases] = useState<SectionState<DhcpLease>>(initial<DhcpLease>());
  const [clients, setClients] = useState<SectionState<DhcpClient>>(initial<DhcpClient>());
  const [model, setModel] = useState<string | null>(null);
  const [interfaces, setInterfaces] = useState<InterfaceResponse[]>([]);
  const [ethernetRates, setEthernetRates] = useState<Record<string, IfaceLink>>({});
  const [busyMac, setBusyMac] = useState<string | null>(null);
  const [leaseToRemove, setLeaseToRemove] = useState<DhcpLease | null>(null);
  const [leaseToMakeStatic, setLeaseToMakeStatic] = useState<DhcpLease | null>(null);
  const [bridgeRequest, setBridgeRequest] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const bridgeCreds = useMemo(() => {
    const stored = id ? getCredentials(id) : undefined;
    return stored && router?.host ? { host: router.host, ...stored } : null;
  }, [id, router?.host, getCredentials]);

  const reload = useCallback(
    async (silent = false) => {
      if (!id) return;
      if (inFlightRef.current) return;
      const creds = getCredentials(id);
      const host = router?.host;
      if (!creds || !host) {
        const missing = t('common.missingCredentials');
        setLeases({ data: [], loading: false, error: missing });
        setClients({ data: [], loading: false, error: missing });
        return;
      }
      if (!silent) {
        setLeases((s) => ({ ...s, loading: true, error: null }));
        setClients((s) => ({ ...s, loading: true, error: null }));
      }

      inFlightRef.current = true;
      const full = { host, ...creds };
      const [lResult, cResult, oResult, iResult, eResult] = await Promise.allSettled([
        fetchDhcpLeases(full),
        fetchDhcpClients(full),
        fetchSystemOverview(id, full),
        fetchInterfaces(full),
        fetchEthernetInterfaces(full),
      ]);
      inFlightRef.current = false;

      if (oResult.status === 'fulfilled') setModel(oResult.value.model);
      if (iResult.status === 'fulfilled') setInterfaces(iResult.value);
      if (eResult.status === 'fulfilled') {
        setEthernetRates(
          Object.fromEntries(
            eResult.value.flatMap((e) =>
              e.name && e.rate
                ? [[e.name.toLowerCase(), { rate: e.rate, fullDuplex: e.fullDuplex }] as const]
                : [],
            ),
          ),
        );
      }

      setLeases(
        lResult.status === 'fulfilled'
          ? { data: lResult.value, loading: false, error: null }
          : {
              data: [],
              loading: false,
              error: errorMessage(lResult.reason, t('dhcp.loadLeasesFailed')),
            },
      );
      setClients(
        cResult.status === 'fulfilled'
          ? { data: cResult.value, loading: false, error: null }
          : {
              data: [],
              loading: false,
              error: errorMessage(cResult.reason, t('dhcp.loadClientsFailed')),
            },
      );
    },
    [id, router?.host, getCredentials, t],
  );

  useEffect(() => {
    void reload();
    const interval = window.setInterval(() => {
      void reload(true);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [reload]);

  const handleMakeStatic = useCallback(async () => {
    const lease = leaseToMakeStatic;
    if (!id || !lease) return;
    const creds = getCredentials(id);
    const host = router?.host;
    if (!creds || !host) return;
    setBusyMac(lease.macAddress);
    setLeaseToMakeStatic(null);
    try {
      await makeDhcpLeaseStatic({ host, ...creds }, lease.macAddress);
      toast.notify({
        title: t('dhcp.toasts.madeStatic'),
        description: `${lease.address} · ${lease.macAddress}`,
        tone: 'success',
      });
      await reload();
    } catch (err) {
      toast.notify({
        title: t('dhcp.toasts.makeStaticFailed'),
        description: errorMessage(err, t('common.unknownError')),
        tone: 'danger',
      });
    } finally {
      setBusyMac(null);
    }
  }, [id, router?.host, getCredentials, leaseToMakeStatic, reload, toast, t]);

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
        title: t('dhcp.toasts.removed'),
        description: `${lease.address} · ${lease.macAddress}`,
        tone: 'success',
      });
      await reload();
    } catch (err) {
      toast.notify({
        title: t('dhcp.toasts.removeFailed'),
        description: errorMessage(err, t('common.unknownError')),
        tone: 'danger',
      });
    } finally {
      setBusyMac(null);
    }
  }, [id, router?.host, getCredentials, leaseToRemove, reload, toast, t]);

  const clearBridgeRequest = useCallback(() => setBridgeRequest(null), []);

  const leaseColumns: DataTableColumn<DhcpLease>[] = [
    {
      key: 'address',
      header: t('dhcp.columns.address'),
      render: (r) => <span className={styles.mono}>{r.address}</span>,
    },
    {
      key: 'mac',
      header: t('dhcp.columns.mac'),
      render: (r) => <span className={styles.mono}>{r.macAddress}</span>,
    },
    {
      key: 'host',
      header: t('dhcp.columns.host'),
      render: (r) => r.hostName || <span className={styles.muted}>—</span>,
    },
    {
      key: 'server',
      header: t('dhcp.columns.server'),
      render: (r) => r.serverName || <span className={styles.muted}>—</span>,
    },
    {
      key: 'port',
      header: t('dhcp.columns.port'),
      render: (r) =>
        r.bridgePort ? (
          <span className={styles.mono}>{r.bridgePort}</span>
        ) : (
          <span className={styles.muted}>—</span>
        ),
    },
    {
      key: 'type',
      header: t('dhcp.columns.type'),
      render: (r) =>
        r.dynamic ? (
          <Badge tone="info">{t('dhcp.dynamic')}</Badge>
        ) : (
          <Badge tone="success">{t('dhcp.static')}</Badge>
        ),
    },
    {
      key: 'status',
      header: t('dhcp.columns.status'),
      render: (r) =>
        r.status ? (
          <Badge tone={leaseStatusTone(r.status)}>{r.status}</Badge>
        ) : (
          <span className={styles.muted}>—</span>
        ),
    },
    {
      key: 'expires',
      header: t('dhcp.columns.expires'),
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
              onClick={() => setLeaseToMakeStatic(r)}
              disabled={busyMac === r.macAddress}
              aria-label={t('dhcp.makeStaticAria', { mac: r.macAddress })}
              title={t('dhcp.makeStatic')}
            >
              <Pin size={14} aria-hidden />
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="danger"
            onClick={() => setLeaseToRemove(r)}
            disabled={busyMac === r.macAddress}
            aria-label={t('dhcp.removeLeaseAria', { mac: r.macAddress })}
            title={t('dhcp.remove')}
          >
            <Trash2 size={14} aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  const sharedSubnets = useMemo(() => {
    const byPrefix = new Map<string, string[]>();
    for (const c of clients.data) {
      const prefix = c.address.split('/')[0].split('.').slice(0, 3).join('.');
      if (!/^\d+\.\d+\.\d+$/.test(prefix)) continue;
      byPrefix.set(prefix, [...(byPrefix.get(prefix) ?? []), c.interface]);
    }
    return [...byPrefix].filter(([, ifaces]) => ifaces.length > 1);
  }, [clients.data]);

  const clientColumns: DataTableColumn<DhcpClient>[] = [
    {
      key: 'interface',
      header: t('dhcp.columns.interface'),
      render: (r) => <span className={styles.mono}>{r.interface}</span>,
    },
    {
      key: 'address',
      header: t('dhcp.columns.address'),
      render: (r) => <span className={styles.mono}>{r.address || '—'}</span>,
    },
    { key: 'status', header: t('dhcp.columns.status'), render: (r) => r.status || '—' },
    {
      key: 'gateway',
      header: t('dhcp.columns.gateway'),
      render: (r) =>
        r.gateway ? (
          <span className={styles.mono}>{r.gateway}</span>
        ) : (
          <span className={styles.muted}>—</span>
        ),
    },
    {
      key: 'dns',
      header: t('dhcp.columns.dns'),
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
      header: t('dhcp.columns.state'),
      render: (r) =>
        r.disabled ? (
          <Badge tone="warning">{t('common.disabled')}</Badge>
        ) : (
          <Badge tone="success">{t('common.enabled')}</Badge>
        ),
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
      <Card data-testid="lan-ports">
        <div className={styles.lanPortsRow}>
          <CardHeader>
            <CardTitle>{t('dhcp.lanPorts.title')}</CardTitle>
            <CardDescription>{t('dhcp.lanPorts.description')}</CardDescription>
          </CardHeader>
          <div className={styles.lanPortsDiagram}>
            {model ? (
              <RouterPortDiagramCard
                model={model}
                interfaces={interfaces}
                ifaceRates={ethernetRates}
                showPowerControls={false}
                onPortSelect={setBridgeRequest}
              />
            ) : (
              <Skeleton width="min(320px, 100%)" height={56} />
            )}
          </div>
        </div>
      </Card>

      <BridgePortsCard
        creds={bridgeCreds}
        openForInterface={bridgeRequest}
        onOpenHandled={clearBridgeRequest}
      />

      <Card data-testid="dhcp-clients">
        <CardHeader>
          <CardTitle>{t('dhcp.clients.title')}</CardTitle>
          <CardDescription>{t('dhcp.clients.description')}</CardDescription>
        </CardHeader>
        {clients.error ? <div className={styles.errorBanner}>{clients.error}</div> : null}
        {sharedSubnets.map(([prefix, ifaces]) => (
          <div key={prefix} role="status" className={styles.warningBanner}>
            {t('dhcp.clients.sharedSubnet', { interfaces: ifaces.join(', '), prefix })}
          </div>
        ))}
        {clients.loading ? (
          loadingRows(6)
        ) : clients.data.length === 0 ? (
          <div className={styles.empty}>
            <Cable size={22} aria-hidden className={styles.emptyIcon} />
            <p>{t('dhcp.clients.empty')}</p>
          </div>
        ) : (
          <DataTable columns={clientColumns} rows={clients.data} rowKey={(r) => r.id} />
        )}
      </Card>

      <Card data-testid="dhcp-leases">
        <CardHeader>
          <CardTitle>{t('dhcp.leases.title')}</CardTitle>
          <CardDescription>{t('dhcp.leases.description')}</CardDescription>
        </CardHeader>
        {leases.error ? <div className={styles.errorBanner}>{leases.error}</div> : null}
        {leases.loading ? (
          loadingRows(6)
        ) : leases.data.length === 0 ? (
          <div className={styles.empty}>
            <Inbox size={22} aria-hidden className={styles.emptyIcon} />
            <p>{t('dhcp.leases.empty')}</p>
          </div>
        ) : (
          <DataTable
            columns={leaseColumns}
            rows={leases.data}
            rowKey={(r) => r.id || r.macAddress}
          />
        )}
      </Card>

      <ConfirmDialog
        open={!!leaseToRemove}
        title={t('dhcp.confirmRemove.title')}
        description={
          leaseToRemove
            ? t('dhcp.confirmRemove.description', {
                address: leaseToRemove.address,
                mac: leaseToRemove.macAddress,
              })
            : undefined
        }
        confirmLabel={t('dhcp.remove')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={handleRemove}
        onCancel={() => setLeaseToRemove(null)}
      />

      <ConfirmDialog
        open={!!leaseToMakeStatic}
        title={t('dhcp.confirmStatic.title')}
        description={
          leaseToMakeStatic
            ? t('dhcp.confirmStatic.description', {
                address: leaseToMakeStatic.address,
                mac: leaseToMakeStatic.macAddress,
              })
            : undefined
        }
        confirmLabel={t('dhcp.makeStatic')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleMakeStatic}
        onCancel={() => setLeaseToMakeStatic(null)}
      />
    </Stack>
  );
}
