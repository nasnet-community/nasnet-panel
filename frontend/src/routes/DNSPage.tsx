import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Pencil, RefreshCw, RotateCcw, SearchX } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  Divider,
  Inline,
  Skeleton,
  Stack,
  Switch,
  useToast,
  type DataTableColumn,
} from '@nasnet/ui';
import styles from './DNSPage.module.scss';
import { DNSChangeDialog, dnsTypeLabel } from './DNSChangeDialog';
import {
  ApiError,
  changeDns,
  fetchDnsForwarders,
  flushDnsCache,
  resetDns,
  setDnsAdBlock,
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

const FAMILY_PROVIDER_PREFIX = 'Cloudflare Family';
const FAMILY_FOREIGN_IP = '1.1.1.3';
const FAMILY_VPN_IP = '1.0.0.3';
const PLAIN_FOREIGN_IP = '1.1.1.1';
const PLAIN_VPN_IP = '1.0.0.1';
const FLUSH_MIN_DURATION_MS = 1000;

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
  const { t } = useTranslation('network');

  const [forwarders, setForwarders] = useState<DnsForwarderListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<DnsForwarderListItem | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [adBlockEnabled, setAdBlockEnabled] = useState(false);
  const [adBlockBusy, setAdBlockBusy] = useState(false);
  const activeRouterRef = useRef(id);
  const [flushing, setFlushing] = useState(false);
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
      setError(t('common.missingCredentials'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDnsForwarders(creds);
      setForwarders(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('dns.loadFailed');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [creds, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    activeRouterRef.current = id;
    setAdBlockEnabled(readStoredAdBlock(id));
    setAdBlockBusy(false);
  }, [id]);

  const toggleAdBlock = async (next: boolean) => {
    if (!creds) return;
    const requestId = id;
    setAdBlockBusy(true);
    try {
      await setDnsAdBlock(creds, next);
      storeAdBlock(requestId, next);
      if (activeRouterRef.current !== requestId) return;
      setAdBlockEnabled(next);
      toast.notify({
        title: next ? t('dns.toasts.adBlockEnabled') : t('dns.toasts.adBlockDisabled'),
        tone: 'success',
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        storeAdBlock(requestId, next);
        if (activeRouterRef.current !== requestId) return;
        setAdBlockEnabled(next);
        toast.notify({
          title: next ? t('dns.toasts.adBlockAlreadyOn') : t('dns.toasts.adBlockAlreadyOff'),
          tone: 'info',
        });
        return;
      }
      if (activeRouterRef.current !== requestId) return;
      const message = err instanceof Error ? err.message : t('dns.toasts.adBlockFailedDetail');
      toast.notify({ title: t('dns.toasts.adBlockFailed'), description: message, tone: 'danger' });
    } finally {
      if (activeRouterRef.current === requestId) {
        setAdBlockBusy(false);
      }
    }
  };

  const runReset = async () => {
    if (!creds) return;
    setConfirmingReset(false);
    setResetting(true);
    try {
      await resetDns(creds);
      toast.notify({ title: t('dns.toasts.resetDone'), tone: 'success' });
      await reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('dns.toasts.resetFailedDetail');
      toast.notify({ title: t('dns.toasts.resetFailed'), description: message, tone: 'danger' });
    } finally {
      setResetting(false);
    }
  };

  const runFlushCache = async () => {
    if (!creds) return;
    setFlushing(true);
    const startedAt = Date.now();
    let result: Parameters<typeof toast.notify>[0];
    try {
      await flushDnsCache(creds);
      result = { title: t('dns.toasts.cacheCleared'), tone: 'success' };
    } catch (err) {
      const message = err instanceof Error ? err.message : t('dns.toasts.cacheFailedDetail');
      result = { title: t('dns.toasts.cacheFailed'), description: message, tone: 'danger' };
    }
    const elapsed = Date.now() - startedAt;
    if (elapsed < FLUSH_MIN_DURATION_MS) {
      await new Promise((resolve) => setTimeout(resolve, FLUSH_MIN_DURATION_MS - elapsed));
    }
    setFlushing(false);
    toast.notify(result);
  };

  const runFamilyDns = async () => {
    if (!creds) return;
    setConfirmingFamily(null);
    setApplyingFamily(true);
    try {
      await setFamilyDns(creds);
      toast.notify({ title: t('dns.toasts.familyEnabled'), tone: 'success' });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('dns.toasts.familyEnableFailedDetail');
      toast.notify({
        title: t('dns.toasts.familyEnableFailed'),
        description: t('dns.toasts.familyPartial', { message }),
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
      toast.notify({ title: t('dns.toasts.familyDisabled'), tone: 'success' });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('dns.toasts.familyDisableFailedDetail');
      toast.notify({
        title: t('dns.toasts.familyDisableFailed'),
        description: t('dns.toasts.familyPartial', { message }),
        tone: 'danger',
      });
    } finally {
      setApplyingFamily(false);
      await reload();
    }
  };

  const familyToggleLabel = familyEnabled ? t('dns.disabling') : t('dns.enabling');

  const columns: DataTableColumn<DnsForwarderListItem>[] = [
    {
      key: 'type',
      header: t('dns.columns.type'),
      width: '140px',
      render: (row) => (
        <Badge tone={TYPE_TONES[row.name] ?? 'neutral'}>{dnsTypeLabel(t, row.name)}</Badge>
      ),
    },
    {
      key: 'ip',
      header: t('dns.columns.servers'),
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
      header: t('dns.columns.provider'),
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
          disabled={!creds || resetting || flushing || applyingFamily}
          aria-label={t('dns.editAria', { name: dnsTypeLabel(t, row.name) })}
        >
          <Pencil size={14} aria-hidden /> {t('dns.edit')}
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
              <CardDescription>{t('dns.description')}</CardDescription>
            </div>
            <div className={styles.headerActions}>
              <Button
                size="sm"
                variant="secondary"
                onClick={reload}
                disabled={loading || resetting || flushing}
              >
                <RefreshCw size={14} aria-hidden /> {t('dns.refresh')}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setConfirmingReset(true)}
                disabled={loading || resetting || flushing || applyingFamily || !creds}
              >
                <RotateCcw size={14} aria-hidden />{' '}
                {resetting ? t('dns.resetting') : t('dns.reset')}
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
              emptyMessage={t('dns.empty')}
            />
          )}
        </Card>

        <aside className={styles.sidebar}>
          <Card data-testid="family-dns-card">
            <div className={styles.settingRow}>
              <span className={styles.settingTitle}>{t('dns.cache')}</span>
              <Button
                size="sm"
                variant="secondary"
                className={styles.purgeButton}
                onClick={runFlushCache}
                loading={flushing}
                disabled={loading || resetting || applyingFamily || !creds}
                aria-label={t('dns.purgeAria')}
                data-testid="dns-flush-cache"
              >
                {flushing ? t('dns.purging') : t('dns.purge')}
              </Button>
            </div>

            <Divider className={styles.settingDivider} />

            <div className={styles.settingRow}>
              <span className={styles.settingTitle}>{t('dns.family')}</span>
              <Switch
                aria-label={t('dns.family')}
                checked={familyEnabled}
                onChange={(e) =>
                  setConfirmingFamily(e.currentTarget.checked ? 'enable' : 'disable')
                }
                disabled={loading || resetting || flushing || applyingFamily || !creds}
              />
            </div>
            {applyingFamily ? <p className={styles.settingStatus}>{familyToggleLabel}</p> : null}

            <div
              className={`${styles.settingRow} ${styles.settingRowSpaced}`}
              data-testid="dns-adblock"
            >
              <span className={styles.settingTitle}>
                <span className={styles.hint}>
                  <button
                    type="button"
                    className={styles.hintTrigger}
                    aria-describedby="dns-adblock-details"
                  >
                    {t('dns.adBlock')}
                  </button>
                  <span className={styles.hintPopover} id="dns-adblock-details" role="note">
                    <span>{t('dns.adBlockHint')}</span>
                    <span className={styles.hintWarning}>{t('dns.adBlockWarning')}</span>
                  </span>
                </span>
              </span>
              <Switch
                aria-label={t('dns.adBlock')}
                checked={adBlockEnabled}
                onChange={(e) => {
                  void toggleAdBlock(e.target.checked);
                }}
                disabled={!creds || adBlockBusy}
                aria-describedby="dns-adblock-details"
              />
            </div>
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
        title={t('dns.confirmReset.title')}
        description={t('dns.confirmReset.description')}
        confirmLabel={t('dns.reset')}
        destructive
        onConfirm={runReset}
        onCancel={() => setConfirmingReset(false)}
      />

      <ConfirmDialog
        open={confirmingFamily === 'enable'}
        title={t('dns.confirmEnableFamily.title')}
        description={t('dns.confirmEnableFamily.description')}
        confirmLabel={t('dns.confirmEnableFamily.confirm')}
        confirmVariant="success"
        onConfirm={runFamilyDns}
        onCancel={() => setConfirmingFamily(null)}
      />

      <ConfirmDialog
        open={confirmingFamily === 'disable'}
        title={t('dns.confirmDisableFamily.title')}
        description={t('dns.confirmDisableFamily.description')}
        confirmLabel={t('dns.confirmDisableFamily.confirm')}
        onConfirm={stopFamilyDns}
        onCancel={() => setConfirmingFamily(null)}
      />
    </Stack>
  );
}
