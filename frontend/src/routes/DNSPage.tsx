import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Globe,
  Pencil,
  RefreshCw,
  RotateCcw,
  SearchX,
  ShieldBan,
  TriangleAlert,
} from 'lucide-react';
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
  ApiError,
  fetchDnsForwarders,
  resetDns,
  setDnsAdBlock,
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

const ADBLOCK_STORAGE_PREFIX = 'nasnet-panel.dns-adblock.';

function readStoredAdBlock(routerId: string | undefined): boolean {
  if (!routerId || typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(`${ADBLOCK_STORAGE_PREFIX}${routerId}`) === 'on';
  } catch {
    return false;
  }
}

function storeAdBlock(routerId: string | undefined, enabled: boolean): void {
  if (!routerId || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${ADBLOCK_STORAGE_PREFIX}${routerId}`, enabled ? 'on' : 'off');
  } catch {
    /* ignore */
  }
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
  const [adBlockEnabled, setAdBlockEnabled] = useState(false);
  const [adBlockBusy, setAdBlockBusy] = useState(false);

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

  useEffect(() => {
    setAdBlockEnabled(readStoredAdBlock(id));
  }, [id]);

  const toggleAdBlock = async (next: boolean) => {
    if (!creds) return;
    setAdBlockBusy(true);
    try {
      await setDnsAdBlock(creds, next);
      setAdBlockEnabled(next);
      storeAdBlock(id, next);
      toast.notify({
        title: next ? 'Ad-block enabled' : 'Ad-block disabled',
        tone: 'success',
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setAdBlockEnabled(next);
        storeAdBlock(id, next);
        toast.notify({
          title: next ? 'Ad-block was already on' : 'Ad-block was already off',
          tone: 'info',
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to update ad-block.';
      toast.notify({ title: 'Failed to update ad-block', description: message, tone: 'danger' });
    } finally {
      setAdBlockBusy(false);
    }
  };

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
      key: 'actions',
      header: '',
      width: '110px',
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setEditing(row)}
          disabled={!creds || resetting}
          aria-label={`Edit ${row.name} DNS server`}
        >
          <Pencil size={14} aria-hidden /> Edit
        </Button>
      ),
    },
  ];

  return (
    <Stack>
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
            <Button size="sm" variant="secondary" onClick={reload} disabled={loading || resetting}>
              <RefreshCw size={14} aria-hidden /> Refresh
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setConfirmingReset(true)}
              disabled={loading || resetting || !creds}
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

      <Card data-testid="dns-adblock">
        <CardHeader className={styles.cardHeader}>
          <div>
            <CardTitle>
              <Inline>
                <ShieldBan size={16} aria-hidden /> Ad-block
              </Inline>
            </CardTitle>
            <CardDescription>
              Filters known advertising and tracking domains at the router, so ads are blocked on
              every device on the network without installing anything on them.
            </CardDescription>
          </div>
          <div className={styles.headerActions}>
            <Switch
              label="Enable ad-block"
              checked={adBlockEnabled}
              onChange={(e) => {
                void toggleAdBlock(e.target.checked);
              }}
              disabled={!creds || adBlockBusy}
              aria-describedby="dns-adblock-warning"
            />
          </div>
        </CardHeader>
        <div className={styles.warning} id="dns-adblock-warning" role="note">
          <TriangleAlert size={16} aria-hidden className={styles.warningIcon} />
          <p>
            Some websites stop working while an ad-blocker is active and ask visitors to turn it off
            before they show their content. Turn ad-block off again if a site you need breaks.
          </p>
        </div>
      </Card>

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
    </Stack>
  );
}
