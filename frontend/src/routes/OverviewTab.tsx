import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  Cpu,
  Network as NetworkIcon,
  Pencil,
  Router as RouterIcon,
  Shield,
  Timer,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CircularProgress,
  ConfirmDialog,
  Dialog,
  Input,
  SectionGrid,
  SectionHeading,
  Select,
  Skeleton,
  Stack,
  StatusDot,
  TrafficChart,
  useToast,
} from '@nasnet/ui';
import {
  ApiError,
  fetchDHCPLeases,
  fetchDhcpClients,
  fetchDynamicOverview,
  fetchEthernetInterfaces,
  fetchInterfaceGraph,
  fetchInterfaces,
  fetchSystemOverview,
  fetchVPNClients,
  rebootSystem,
  setSystemIdentity,
  shutdownSystem,
  type DhcpClient,
  type DHCPLeaseResponse,
  type EthernetInterfaceResponse,
  type InterfaceGraphSample,
  type InterfaceResponse,
  type IpAddressResponse,
  type SystemOverview,
  type TrafficSample,
  type VPNActiveClient,
} from '../api';
import { useRouter, useRouterStore } from '../state/RouterStoreContext';
import { useSession } from '../state/SessionContext';
import { useThemeColors } from '../utils/theme-colors';
import { matchesWanCategory } from './wan/types';
import { RouterPortDiagramCard } from './overview-panel/RouterPortDiagramCard';
import { UplinkIpCard } from './overview-panel/UplinkIpCard';
import { resolveModelStrict } from './overview-panel/resolveModel';
import styles from './OverviewTab.module.scss';

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

const toneForPct = (pct: number): 'success' | 'warning' | 'danger' =>
  pct >= 85 ? 'danger' : pct >= 65 ? 'warning' : 'success';

const statusBadgeTone = (pct: number): 'success' | 'warning' | 'danger' => toneForPct(pct);

const statusBadgeLabel = (pct: number): string =>
  pct >= 85 ? 'Critical' : pct >= 65 ? 'High' : 'Normal';

const toneVar = (tone: 'success' | 'warning' | 'danger'): string =>
  tone === 'danger'
    ? 'var(--color-danger)'
    : tone === 'warning'
      ? 'var(--color-warning)'
      : 'var(--color-success)';

const miniBarStyle = (pct: number, tone: 'success' | 'warning' | 'danger'): React.CSSProperties =>
  ({
    ['--_pct' as string]: `${Math.max(0, Math.min(100, pct))}%`,
    ['--_tone' as string]: toneVar(tone),
  }) as React.CSSProperties;

const formatMbps = (kbps: number) => `${(kbps / 1000).toFixed(2)} Mb/s`;

const OVERVIEW_REFRESH_MS = 3000;
const GRAPH_REFRESH_MS = 10_000;
const DEFAULT_TRAFFIC_INTERFACE = 'ether1';

const toTrafficSamples = (data: InterfaceGraphSample[]): TrafficSample[] => {
  const samples: TrafficSample[] = [];
  for (let i = 1; i < data.length; i += 1) {
    const prev = data[i - 1];
    const curr = data[i];
    const t = new Date(curr.timestamp).getTime();
    const dtSec = (t - new Date(prev.timestamp).getTime()) / 1000;
    if (dtSec <= 0) continue;
    samples.push({
      t,
      rxKbps: Math.max(0, ((curr.rxBytes - prev.rxBytes) * 8) / dtSec / 1000),
      txKbps: Math.max(0, ((curr.txBytes - prev.txBytes) * 8) / dtSec / 1000),
    });
  }
  return samples;
};

export function OverviewTab() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const router = useRouter(id);
  const { getCredentials } = useSession();
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [traffic, setTraffic] = useState<TrafficSample[]>([]);
  const [vpnClients, setVpnClients] = useState<VPNActiveClient[]>([]);
  const [dhcpLeaseList, setDhcpLeaseList] = useState<DHCPLeaseResponse[]>([]);
  const [interfaces, setInterfaces] = useState<InterfaceResponse[]>([]);
  const [ethernetRates, setEthernetRates] = useState<Record<string, string>>({});
  const [dhcpClients, setDhcpClients] = useState<DhcpClient[]>([]);
  const [selectedIface, setSelectedIface] = useState<string>(DEFAULT_TRAFFIC_INTERFACE);
  const ifaceDefaultApplied = useRef(false);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [powerAction, setPowerAction] = useState<'reboot' | 'shutdown' | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [renaming, setRenaming] = useState(false);
  const colors = useThemeColors();
  const toast = useToast();
  const { upsertRouter } = useRouterStore();

  const openRename = () => {
    setRenameInput(router?.name ?? '');
    setRenameOpen(true);
  };

  const saveRename = async () => {
    if (!id || !router) return;
    const newName = renameInput.trim();
    if (!newName || newName === router.name) {
      setRenameOpen(false);
      return;
    }
    const creds = getCredentials(id);
    if (!creds) return;
    setRenaming(true);
    try {
      await setSystemIdentity({ host: router.host, ...creds }, newName);
      upsertRouter({ ...router, name: newName, hostname: newName });
      toast.notify({ title: 'Router renamed', tone: 'success' });
      setRenameOpen(false);
    } catch (err) {
      toast.notify({
        title: 'Rename failed',
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
    } finally {
      setRenaming(false);
    }
  };

  const runPowerAction = async (action: 'reboot' | 'shutdown') => {
    setPowerAction(null);
    if (!id) return;
    const creds = getCredentials(id);
    const host = router?.host;
    if (!creds || !host) return;
    try {
      if (action === 'reboot') {
        await rebootSystem({ host, ...creds });
        toast.notify({ title: 'Reboot initiated', tone: 'warning' });
      } else {
        await shutdownSystem({ host, ...creds });
        toast.notify({ title: 'Shutdown initiated', tone: 'warning' });
      }
      navigate('/');
    } catch (err) {
      toast.notify({
        title: `Failed to ${action} router`,
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
    }
  };

  useEffect(() => {
    if (!id) return;
    const creds = getCredentials(id);
    const host = router?.host;
    if (!creds || !host) return;
    let cancelled = false;

    const loadInitial = async () => {
      try {
        const [ov, list, clients, ethernets] = await Promise.all([
          fetchSystemOverview(id, { host, ...creds }),
          fetchInterfaces({ host, ...creds }).catch(() => [] as InterfaceResponse[]),
          fetchDhcpClients({ host, ...creds }).catch(() => [] as DhcpClient[]),
          fetchEthernetInterfaces({ host, ...creds }).catch(
            () => [] as EthernetInterfaceResponse[],
          ),
        ]);
        if (cancelled) return;
        setOverview(ov);
        setInterfaces(list);
        setDhcpClients(clients);
        setEthernetRates(
          Object.fromEntries(
            ethernets.flatMap((e) =>
              e.name && e.rate ? [[e.name.toLowerCase(), e.rate] as const] : [],
            ),
          ),
        );
        if (list.length > 0) {
          setSelectedIface((prev) => {
            if (!ifaceDefaultApplied.current) {
              ifaceDefaultApplied.current = true;
              const foreign = list.find((i) => matchesWanCategory(i.comment, 'foreign'));
              if (foreign) return foreign.name;
            }
            if (list.some((i) => i.name === prev)) return prev;
            const preferred = list.find((i) => i.running && i.type === 'ether') ?? list[0];
            return preferred.name;
          });
        }
      } catch {
        // keep loading state visible; errors surface via network tab
      }
    };

    const pollDynamic = async () => {
      try {
        const [dynamic, vpnList, leases] = await Promise.all([
          fetchDynamicOverview({ host, ...creds }),
          fetchVPNClients({ host, ...creds }).catch(() => [] as VPNActiveClient[]),
          fetchDHCPLeases({ host, ...creds }).catch(() => [] as DHCPLeaseResponse[]),
        ]);
        if (cancelled) return;
        setOverview((prev) => (prev ? { ...prev, ...dynamic } : prev));
        setDhcpLeaseList(leases.filter((l) => l.status === 'bound'));
        setVpnClients(vpnList);
      } catch {
        // keep previous values on transient failures
      }
    };

    void loadInitial().then(() => {
      if (cancelled) return;
      void pollDynamic();
    });
    const interval = window.setInterval(() => {
      void pollDynamic();
    }, OVERVIEW_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [id, router?.host, getCredentials]);

  useEffect(() => {
    setTraffic([]);
    setGraphError(null);
    if (!id || !selectedIface) return;
    const creds = getCredentials(id);
    const host = router?.host;
    if (!creds || !host) return;
    let cancelled = false;
    let timer: number | undefined;
    setGraphLoading(true);

    const poll = async () => {
      try {
        const res = await fetchInterfaceGraph({ host, ...creds }, selectedIface);
        if (cancelled) return;
        setTraffic(toTrafficSamples(res.trafficData ?? []));
        setGraphError(null);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setGraphError('No traffic data collected for this interface yet');
        } else {
          setGraphError(err instanceof Error ? err.message : 'Failed to load traffic data');
        }
      } finally {
        if (!cancelled) {
          setGraphLoading(false);
          timer = window.setTimeout(() => {
            void poll();
          }, GRAPH_REFRESH_MS);
        }
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [id, router?.host, getCredentials, selectedIface]);

  const ipAddresses = useMemo<IpAddressResponse[]>(
    () =>
      dhcpClients
        .filter((c) => c.address)
        .map((c) => ({
          id: c.id,
          address: c.address,
          interface: c.interface,
          dynamic: true,
          disabled: c.disabled,
        })),
    [dhcpClients],
  );

  const memoryPct = useMemo(() => {
    if (!overview || !overview.memoryTotalBytes) return 0;
    return Math.round((overview.memoryUsedBytes / overview.memoryTotalBytes) * 100);
  }, [overview]);

  const diskPct = useMemo(() => {
    if (!overview || !overview.hddTotalBytes) return 0;
    return Math.round((overview.hddUsedBytes / overview.hddTotalBytes) * 100);
  }, [overview]);

  const latest = traffic[traffic.length - 1];
  const downloadKbps = latest?.rxKbps ?? 0;
  const uploadKbps = latest?.txKbps ?? 0;
  const windowSec =
    traffic.length > 1 ? Math.round((traffic[traffic.length - 1].t - traffic[0].t) / 1000) : 0;
  const windowLabel =
    windowSec >= 60 ? `-${Math.round(windowSec / 60)}m` : windowSec > 0 ? `-${windowSec}s` : '';

  if (!id || !overview) {
    return <OverviewSkeleton />;
  }

  return (
    <Stack>
      <Card className={styles.bannerCard}>
        <div className={styles.bannerHeader}>
          <div className={styles.bannerLeft}>
            <h1 className={styles.routerTitleRow}>
              <RouterIcon size={18} aria-hidden />
              {router?.name ?? 'Router'}
              <Button
                variant="secondary"
                size="sm"
                onClick={openRename}
                aria-label="Rename router"
                data-testid="rename-router"
              >
                <Pencil size={14} aria-hidden />
              </Button>
            </h1>
            <span className={styles.bannerHost} data-testid="banner-model">
              <Cpu size={14} aria-hidden /> {resolveModelStrict(overview.model).displayName}
            </span>
            <span className={styles.bannerHost}>
              <NetworkIcon size={14} aria-hidden /> {router?.host}
            </span>
            <span className={styles.bannerStat}>
              <Timer size={14} aria-hidden />{' '}
              <span className={styles.statValue} data-testid="overview-uptime">
                {overview.uptime}
              </span>{' '}
              <span>uptime</span>
            </span>
          </div>
          <div className={styles.bannerRight}>
            <RouterPortDiagramCard
              model={overview.model}
              interfaces={interfaces}
              ifaceRates={ethernetRates}
              onPower={setPowerAction}
            />
          </div>
        </div>
      </Card>

      <Card className={cx(styles.networkCard, styles.trafficCard)}>
        <div className={styles.networkCardHeader}>
          <div className={styles.networkCardTitle}>
            <div className={styles.iconCircle} aria-hidden>
              <Activity size={16} />
            </div>
            Network Traffic
          </div>
          {interfaces.length > 0 ? (
            <Select
              className={styles.ifaceSelect}
              aria-label="Select interface for traffic"
              value={selectedIface}
              onChange={setSelectedIface}
              options={interfaces.map((i) => ({
                value: i.name,
                label: i.name,
              }))}
            />
          ) : null}
        </div>
        <div className={styles.trafficLine}>
          <div className={styles.trafficColumn}>
            <span className={styles.trafficLabel}>
              <span style={{ color: colors.success }}>↓</span> Download
            </span>
            <span className={styles.trafficValue}>{formatMbps(downloadKbps)}</span>
          </div>
          <div className={styles.trafficColumn}>
            <span className={styles.trafficLabel}>
              <span style={{ color: colors.warning }}>↑</span> Upload
            </span>
            <span className={styles.trafficValue}>{formatMbps(uploadKbps)}</span>
          </div>
        </div>
        <div className={styles.chartArea}>
          {traffic.length > 0 ? (
            <TrafficChart data={traffic} colors={colors} formatValue={formatMbps} />
          ) : (
            <div className={styles.networkEmpty}>
              <span>
                {graphLoading
                  ? 'Loading traffic data'
                  : (graphError ?? 'No traffic data collected for this interface yet')}
              </span>
            </div>
          )}
        </div>
        <div className={styles.chartAxis}>
          <span>{windowLabel}</span>
          <span>now</span>
        </div>
        <div className={styles.chartLegend}>
          <span className={styles.chartLegendItem}>
            <span className={styles.chartLegendSwatch} style={{ background: colors.success }} />
            Download
          </span>
          <span className={styles.chartLegendItem}>
            <span className={styles.chartLegendSwatch} style={{ background: colors.warning }} />
            Upload
          </span>
        </div>
      </Card>

      <div>
        <SectionHeading>Resources</SectionHeading>
        <SectionGrid>
          <Card className={styles.resourceCard}>
            <div className={styles.resourceHeader}>
              <h4 className={styles.resourceTitle}>CPU</h4>
              <Badge tone={statusBadgeTone(overview.cpuLoad)}>
                {statusBadgeLabel(overview.cpuLoad)}
              </Badge>
            </div>
            <div className={styles.resourceBody}>
              <CircularProgress
                value={overview.cpuLoad}
                size={96}
                strokeWidth={8}
                tone={toneForPct(overview.cpuLoad)}
                ariaLabel={`CPU ${overview.cpuLoad}%`}
              />
            </div>
            <div
              className={styles.miniBar}
              style={miniBarStyle(overview.cpuLoad, toneForPct(overview.cpuLoad))}
            />
            <div className={styles.resourceFooter} data-testid="overview-cpu">
              {overview.cpuCount} {overview.cpuCount === 1 ? 'core' : 'cores'}
            </div>
          </Card>

          <Card className={styles.resourceCard}>
            <div className={styles.resourceHeader}>
              <h4 className={styles.resourceTitle}>Memory</h4>
              <Badge tone={statusBadgeTone(memoryPct)}>{statusBadgeLabel(memoryPct)}</Badge>
            </div>
            <div className={styles.resourceBody}>
              <CircularProgress
                value={memoryPct}
                size={96}
                strokeWidth={8}
                tone={toneForPct(memoryPct)}
                ariaLabel={`Memory ${memoryPct}%`}
              />
            </div>
            <div
              className={styles.miniBar}
              style={miniBarStyle(memoryPct, toneForPct(memoryPct))}
            />
            <div className={styles.resourceFooter}>
              {overview.memoryUsedLabel} / {overview.memoryTotalLabel}
            </div>
          </Card>

          <Card className={styles.resourceCard}>
            <div className={styles.resourceHeader}>
              <h4 className={styles.resourceTitle}>Disk</h4>
              <Badge tone={statusBadgeTone(diskPct)}>{statusBadgeLabel(diskPct)}</Badge>
            </div>
            <div className={styles.resourceBody}>
              <CircularProgress
                value={diskPct}
                size={96}
                strokeWidth={8}
                tone={toneForPct(diskPct)}
                ariaLabel={`Disk ${diskPct}%`}
              />
            </div>
            <div className={styles.miniBar} style={miniBarStyle(diskPct, toneForPct(diskPct))} />
            <div className={styles.resourceFooter}>
              {overview.hddUsedLabel} / {overview.hddTotalLabel}
            </div>
          </Card>
        </SectionGrid>
      </div>

      <div>
        <SectionHeading>Network</SectionHeading>
        <SectionGrid>
          <Card className={styles.networkCard}>
            <div className={styles.networkCardHeader}>
              <div className={styles.networkCardTitle}>
                <div className={cx(styles.iconCircle, styles.iconCircleInfo)} aria-hidden>
                  <NetworkIcon size={16} />
                </div>
                Default DHCP Server
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/router/${id}/lan`)}>
                View
              </Button>
            </div>
            {dhcpLeaseList.length === 0 ? (
              <div className={styles.networkEmpty}>
                <div className={cx(styles.iconCircle, styles.iconCircleInfo)} aria-hidden>
                  <NetworkIcon size={16} />
                </div>
                <span>No active leases</span>
              </div>
            ) : (
              <div className={styles.vpnList}>
                {dhcpLeaseList.map((l) => (
                  <div key={l.id} className={styles.vpnRow}>
                    <StatusDot $status="online" className={styles.vpnDot} aria-hidden />
                    <span className={styles.vpnName} title={l.hostName || l.macAddress}>
                      {l.hostName || l.macAddress}
                    </span>
                    <Badge tone="neutral">{l.dynamic ? 'dynamic' : 'static'}</Badge>
                    <span className={styles.vpnAddress} title={l.address}>
                      {l.address}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <UplinkIpCard interfaces={interfaces} addresses={ipAddresses} />

          <Card className={styles.networkCard}>
            <div className={styles.networkCardHeader}>
              <div className={styles.networkCardTitle}>
                <div className={cx(styles.iconCircle, styles.iconCircleSuccess)} aria-hidden>
                  <Shield size={16} />
                </div>
                VPN Clients
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/router/${id}/vpn`)}>
                View
              </Button>
            </div>
            {vpnClients.length === 0 ? (
              <div className={styles.networkEmpty}>
                <div className={cx(styles.iconCircle, styles.iconCircleSuccess)} aria-hidden>
                  <Shield size={16} />
                </div>
                <span>No clients connected</span>
              </div>
            ) : (
              <div className={styles.vpnList}>
                {vpnClients.map((c) => (
                  <div key={`${c.protocol}-${c.id}`} className={styles.vpnRow}>
                    <StatusDot $status="online" className={styles.vpnDot} aria-hidden />
                    <span className={styles.vpnName} title={c.name}>
                      {c.name}
                    </span>
                    <Badge tone="neutral">{c.protocol}</Badge>
                    {c.address ? (
                      <span className={styles.vpnAddress} title={c.address}>
                        {c.address}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </SectionGrid>
      </div>

      <div>
        <SectionHeading>System</SectionHeading>
        <SectionGrid>
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Hostname</span>
              <span className={styles.infoVal} data-testid="overview-hostname">
                {router?.hostname ?? '—'}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Model</span>
              <span className={styles.infoVal} data-testid="overview-model">
                {overview.model}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>RouterOS</span>
              <span className={styles.infoVal}>{overview.version}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Build Time</span>
              <span className={styles.infoVal} data-testid="overview-build-time">
                {overview.buildTime || '—'}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Architecture</span>
              <span className={styles.infoVal}>arm64</span>
            </div>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Hardware Details</CardTitle>
            </CardHeader>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Identity</span>
              <span className={styles.infoVal}>{overview.identity || '—'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Board</span>
              <span className={styles.infoVal}>{overview.model}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Update Channel</span>
              <span className={styles.infoVal}>{overview.updateChannel || '—'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>License</span>
              <span className={styles.infoVal}>{overview.license || '—'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Serial</span>
              <span className={styles.infoVal}>{overview.serial || '—'}</span>
            </div>
          </Card>
        </SectionGrid>
      </div>

      <Dialog
        open={renameOpen}
        onClose={() => {
          if (!renaming) setRenameOpen(false);
        }}
        title="Rename router"
        description="Updates the router's system identity."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenameOpen(false)} disabled={renaming}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                void saveRename();
              }}
              disabled={renaming || !renameInput.trim()}
            >
              Save
            </Button>
          </>
        }
      >
        <Input
          value={renameInput}
          onChange={(e) => setRenameInput(e.target.value)}
          placeholder="Router name"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !renaming) {
              e.preventDefault();
              void saveRename();
            }
          }}
        />
      </Dialog>

      <ConfirmDialog
        open={powerAction !== null}
        title={powerAction === 'shutdown' ? 'Shutdown router?' : 'Reboot router?'}
        description={
          powerAction === 'shutdown'
            ? 'The router will power off. You will need physical access to turn it back on.'
            : 'The router will restart. Connectivity drops briefly.'
        }
        destructive
        confirmLabel={powerAction === 'shutdown' ? 'Shutdown' : 'Reboot'}
        onConfirm={() => {
          if (powerAction) {
            void runPowerAction(powerAction);
          }
        }}
        onCancel={() => setPowerAction(null)}
      />
    </Stack>
  );
}

function OverviewSkeleton() {
  return (
    <Stack aria-busy="true" aria-label="Loading overview">
      <Card className={styles.bannerCard}>
        <div className={styles.bannerHeader}>
          <div className={styles.bannerLeft}>
            <Skeleton width={180} height={22} />
            <Skeleton width={120} height={14} style={{ marginTop: 8 }} />
          </div>
          <div className={styles.bannerStats}>
            <Skeleton width={80} height={14} />
            <Skeleton width={80} height={14} />
            <Skeleton width={80} height={14} />
          </div>
        </div>
        <Skeleton width="100%" height={64} style={{ marginTop: 12 }} />
      </Card>

      <Card className={styles.networkCard}>
        <div className={styles.networkCardHeader}>
          <Skeleton width={160} height={16} />
        </div>
        <Skeleton width="70%" height={14} style={{ marginTop: 12 }} />
      </Card>

      <div>
        <SectionHeading>Resources</SectionHeading>
        <SectionGrid>
          {[0, 1, 2].map((i) => (
            <Card key={i} className={styles.resourceCard}>
              <div className={styles.resourceHeader}>
                <Skeleton width={60} height={16} />
                <Skeleton width={56} height={18} radius={999} />
              </div>
              <div className={styles.resourceBody}>
                <Skeleton width={96} height={96} radius="50%" />
              </div>
              <Skeleton width="100%" height={4} />
              <div className={styles.resourceFooter}>
                <Skeleton width={100} height={12} />
              </div>
            </Card>
          ))}
        </SectionGrid>
      </div>

      <div>
        <SectionHeading>Network</SectionHeading>
        <SectionGrid>
          <Card className={styles.networkCard}>
            <div className={styles.networkCardHeader}>
              <Skeleton width={160} height={16} />
              <Skeleton width={48} height={18} radius={999} />
            </div>
            <Skeleton width="60%" height={14} style={{ marginTop: 12 }} />
          </Card>
          <Card className={cx(styles.networkCard, styles.trafficCard)}>
            <div className={styles.networkCardHeader}>
              <Skeleton width={160} height={16} />
              <Skeleton width={140} height={28} />
            </div>
            <Skeleton width="100%" height={140} style={{ marginTop: 12 }} />
          </Card>
          <Card className={styles.networkCard}>
            <div className={styles.networkCardHeader}>
              <Skeleton width={120} height={16} />
              <Skeleton width={48} height={18} radius={999} />
            </div>
            <Skeleton width="50%" height={14} style={{ marginTop: 12 }} />
          </Card>
        </SectionGrid>
      </div>

      <div>
        <SectionHeading>System</SectionHeading>
        <SectionGrid>
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton width={160} height={18} />
              </CardHeader>
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className={styles.infoRow}>
                  <Skeleton width={90} height={14} />
                  <Skeleton width={120} height={14} />
                </div>
              ))}
            </Card>
          ))}
        </SectionGrid>
      </div>
    </Stack>
  );
}
