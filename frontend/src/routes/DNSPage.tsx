import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Globe, Pencil, PersonStanding, RefreshCw, RotateCcw, SearchX } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  Inline,
  Skeleton,
  Stack,
  Switch,
  useToast,
  type DataTableColumn,
} from '@nasnet/ui';
import styles from './DNSPage.module.scss';
import { DNSChangeDialog } from './DNSChangeDialog';
import {
  changeDns,
  fetchDnsForwarders,
  resetDns,
  setFamilyDns,
  type DnsCredentials,
  type DnsForwarderListItem,
} from '../api';
import { useSession } from '../state/SessionContext';
import { useRouter } from '../state/RouterStoreContext';

const TYPE_TONES: Record<string, 'info' | 'primary' | 'success'> = {
  Domestic: 'info',
  Foreign: 'primary',
  VPN: 'success',
};

const FAMILY_PROVIDER_PREFIX = 'Cloudflare Family';
const FAMILY_FOREIGN_IP = '1.1.1.3';
const FAMILY_VPN_IP = '1.0.0.3';
const PLAIN_FOREIGN_IP = '1.1.1.1';
const PLAIN_VPN_IP = '1.0.0.1';

function firstIp(ip: string): string {
  return ip.split(',')[0]?.trim() ?? '';
}

function isFamilyForwarder(
  forwarders: DnsForwarderListItem[],
  name: string,
  familyIp: string,
): boolean {
  const forwarder = forwarders.find((row) => row.name === name);
  if (!forwarder) return false;
  if (forwarder.description?.startsWith(FAMILY_PROVIDER_PREFIX)) return true;
  return firstIp(forwarder.ip) === familyIp;
}

export function DNSPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const { getCredentials } = useSession();
  const toast = useToast();

  const [forwarders, setForwarders] = useState<DnsForwarderListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<DnsForwarderListItem | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmingFamily, setConfirmingFamily] = useState<'enable' | 'disable' | null>(null);
  const [applyingFamily, setApplyingFamily] = useState(false);

  const familyEnabled =
    isFamilyForwarder(forwarders, 'Foreign', FAMILY_FOREIGN_IP) &&
    isFamilyForwarder(forwarders, 'VPN', FAMILY_VPN_IP);

  const creds = useMemo<DnsCredentials | null>(() => {
    if (!id) return null;
    const c = getCredentials(id);
    const host = router?.host;
    if (!c || !host) return null;
    return { host, username: c.username, password: c.password };
  }, [id, router?.host, getCredentials]);

  const reload = useCallback(async () => {
    if (!creds) {
      setLoading(false);
      setError('Missing router credentials for this session.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDnsForwarders(creds);
      setForwarders(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load DNS servers.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [creds]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const runReset = async () => {
    if (!creds) return;
    setConfirmingReset(false);
    setResetting(true);
    try {
      await resetDns(creds);
      toast.notify({ title: 'DNS settings reset to defaults', tone: 'success' });
      await reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset DNS settings.';
      toast.notify({ title: 'Failed to reset DNS', description: message, tone: 'danger' });
    } finally {
      setResetting(false);
    }
  };

  const runFamilyDns = async () => {
    if (!creds) return;
    setConfirmingFamily(null);
    setApplyingFamily(true);
    try {
      await setFamilyDns(creds);
      toast.notify({ title: 'Family DNS enabled', tone: 'success' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable Family DNS.';
      toast.notify({
        title: 'Failed to enable Family DNS',
        description: `${message} Some forwarders may already have been switched, so check the list before retrying.`,
        tone: 'danger',
      });
    } finally {
      setApplyingFamily(false);
      await reload();
    }
  };

  const stopFamilyDns = async () => {
    if (!creds) return;
    setConfirmingFamily(null);
    setApplyingFamily(true);
    try {
      await changeDns(creds, { oldIp: FAMILY_FOREIGN_IP, newIp: PLAIN_FOREIGN_IP });
      await changeDns(creds, { oldIp: FAMILY_VPN_IP, newIp: PLAIN_VPN_IP });
      toast.notify({ title: 'Family DNS disabled', tone: 'success' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable Family DNS.';
      toast.notify({
        title: 'Failed to disable Family DNS',
        description: `${message} Some forwarders may already have been switched, so check the list before retrying.`,
        tone: 'danger',
      });
    } finally {
      setApplyingFamily(false);
      await reload();
    }
  };

  const familyToggleLabel = familyEnabled ? 'Disabling…' : 'Enabling…';

  const columns: DataTableColumn<DnsForwarderListItem>[] = [
    {
      key: 'type',
      header: 'Type',
      width: '140px',
      render: (row) => <Badge tone={TYPE_TONES[row.name] ?? 'neutral'}>{row.name}</Badge>,
    },
    {
      key: 'ip',
      header: 'DNS servers',
      render: (row) => (
        <div className={styles.serverColumn}>
          {row.ip
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean)
            .map((ip) => (
              <span key={`${row.name}-${ip}`} className={styles.serverPill}>
                {ip}
              </span>
            ))}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Provider',
      render: (row) =>
        row.description ? <span>{row.description}</span> : <span className={styles.muted}>-</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '110px',
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setEditing(row)}
          disabled={!creds || resetting || applyingFamily}
          aria-label={`Edit ${row.name} DNS server`}
        >
          <Pencil size={14} aria-hidden /> Edit
        </Button>
      ),
    },
  ];

  return (
    <Stack>
      <div className={styles.layout}>
        <Card>
          <CardHeader className={styles.cardHeader}>
            <div>
              <CardTitle>
                <Inline>
                  <Globe size={16} aria-hidden /> DNS
                </Inline>
              </CardTitle>
              <CardDescription>
                DNS servers configured on this router, grouped by domestic, foreign and VPN traffic.
              </CardDescription>
            </div>
            <div className={styles.headerActions}>
              <Button
                size="sm"
                variant="secondary"
                onClick={reload}
                disabled={loading || resetting}
              >
                <RefreshCw size={14} aria-hidden /> Refresh
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setConfirmingReset(true)}
                disabled={loading || resetting || applyingFamily || !creds}
              >
                <RotateCcw size={14} aria-hidden /> {resetting ? 'Resetting…' : 'Reset'}
              </Button>
            </div>
          </CardHeader>

          {loading && forwarders.length === 0 ? (
            <div className={styles.skeletonGrid} data-testid="dns-skeleton">
              <Skeleton width={140} height={14} />
              <Skeleton height={36} />
              <Skeleton width={140} height={14} />
              <Skeleton height={36} />
              <Skeleton width={140} height={14} />
              <Skeleton height={36} />
            </div>
          ) : error ? (
            <div className={styles.errorNote}>
              <SearchX size={28} aria-hidden className={styles.errorIcon} />
              <p>{error}</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={forwarders}
              rowKey={(row) => row.name}
              emptyMessage="No DNS servers configured"
            />
          )}
        </Card>

        <aside className={styles.sidebar}>
          <Card data-testid="family-dns-card">
            <div className={styles.settingRow}>
              <span className={styles.settingTitle}>
                <PersonStanding size={16} aria-hidden /> Family DNS
              </span>
              <Switch
                aria-label="Family DNS"
                checked={familyEnabled}
                onChange={(e) =>
                  setConfirmingFamily(e.currentTarget.checked ? 'enable' : 'disable')
                }
                disabled={loading || resetting || applyingFamily || !creds}
              />
            </div>
            {applyingFamily ? <p className={styles.settingStatus}>{familyToggleLabel}</p> : null}
          </Card>
        </aside>
      </div>

      {editing && creds ? (
        <DNSChangeDialog
          open
          forwarder={editing}
          creds={creds}
          onClose={() => setEditing(null)}
          onChanged={() => {
            void reload();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={confirmingReset}
        title="Reset DNS settings?"
        description="Every DNS server, forwarder, failover route and netwatch probe returns to its default value. Custom DNS servers are discarded."
        confirmLabel="Reset"
        destructive
        onConfirm={runReset}
        onCancel={() => setConfirmingReset(false)}
      />

      <ConfirmDialog
        open={confirmingFamily === 'enable'}
        title="Enable Family DNS?"
        description="The Foreign and VPN forwarders switch to filtering servers."
        confirmLabel="Enable"
        confirmVariant="success"
        onConfirm={runFamilyDns}
        onCancel={() => setConfirmingFamily(null)}
      />

      <ConfirmDialog
        open={confirmingFamily === 'disable'}
        title="Disable Family DNS?"
        description="The Foreign and VPN forwarders go back to their standard servers, and filtering stops."
        confirmLabel="Disable"
        onConfirm={stopFamilyDns}
        onCancel={() => setConfirmingFamily(null)}
      />
    </Stack>
  );
}
