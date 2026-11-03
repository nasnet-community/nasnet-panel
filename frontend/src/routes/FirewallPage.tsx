import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flame, ShieldOff } from 'lucide-react';
import {
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  type DataTableColumn,
  Inline,
  Label,
  Select,
  Skeleton,
  Stack,
} from '@nasnet/ui';
import styles from './FirewallPage.module.scss';
import {
  fetchFirewallRules,
  type DomesticAddressListInfo,
  type FirewallCredentials,
  type FirewallRule,
} from '../api';
import { useSession } from '../state/SessionContext';
import { useRouter } from '../state/RouterStoreContext';
import { useFormat } from '../utils/useFormat';
import { DomesticAddressCard } from './firewall/DomesticAddressCard';
import { DomesticBlockCard } from './firewall/DomesticBlockCard';

// Chain names are RouterOS values and stay untranslated.
const CHAINS = ['input', 'forward', 'output'] as const;

function actionTone(action: string): 'success' | 'danger' | 'warning' | 'info' {
  const a = action.toLowerCase();
  if (a === 'accept') return 'success';
  if (a === 'drop' || a === 'reject') return 'danger';
  if (a === 'log') return 'warning';
  return 'info';
}

function addrWithPort(address?: string, port?: string): string {
  if (address && port) return `${address}:${port}`;
  return address || port || '';
}

export function FirewallPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const { getCredentials } = useSession();
  const { t } = useTranslation('network');
  const format = useFormat();

  const chainOptions = useMemo(
    () => [
      { value: '', label: t('firewall.allChains') },
      ...CHAINS.map((c) => ({ value: c, label: c })),
    ],
    [t],
  );

  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chain, setChain] = useState<string>('');
  const [domesticInfo, setDomesticInfo] = useState<DomesticAddressListInfo | null>(null);
  // Drop the previous router's summary as soon as the router changes.
  const [domesticRouter, setDomesticRouter] = useState(id);
  if (domesticRouter !== id) {
    setDomesticRouter(id);
    setDomesticInfo(null);
  }
  const inFlightRef = useRef(false);

  const creds = useMemo<FirewallCredentials | null>(() => {
    if (!id) return null;
    const c = getCredentials(id);
    const host = router?.host;
    if (!c || !host) return null;
    return { host, username: c.username, password: c.password };
  }, [id, router?.host, getCredentials]);

  const reload = useCallback(
    async (silent = false) => {
      if (!creds) {
        setLoading(false);
        setError(t('common.missingCredentials'));
        return;
      }
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await fetchFirewallRules(creds);
        setRules(data);
        if (silent) setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : t('firewall.loadFailed');
        setError(message);
        if (!silent) setRules([]);
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [creds, t],
  );

  const visibleRules = useMemo(
    () => (chain ? rules.filter((r) => r.chain === chain) : rules),
    [rules, chain],
  );

  useEffect(() => {
    void reload();
    const interval = window.setInterval(() => {
      void reload(true);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [reload]);

  const columns: DataTableColumn<FirewallRule>[] = [
    {
      key: 'chain',
      header: t('firewall.columns.chain'),
      render: (r) => <Badge tone="info">{r.chain}</Badge>,
    },
    {
      key: 'action',
      header: t('firewall.columns.action'),
      render: (r) => <Badge tone={actionTone(r.action)}>{r.action}</Badge>,
    },
    {
      key: 'protocol',
      header: t('firewall.columns.proto'),
      render: (r) => r.protocol || <span className={styles.muted}>{t('firewall.any')}</span>,
    },
    {
      key: 'src',
      header: t('firewall.columns.source'),
      render: (r) => {
        const v = addrWithPort(r.srcAddress, r.srcPort);
        return v ? (
          <span className={styles.mono}>{v}</span>
        ) : (
          <span className={styles.muted}>{t('firewall.any')}</span>
        );
      },
      sortValue: (r) => addrWithPort(r.srcAddress, r.srcPort),
    },
    {
      key: 'dst',
      header: t('firewall.columns.destination'),
      render: (r) => {
        const v = addrWithPort(r.dstAddress, r.dstPort);
        return v ? (
          <span className={styles.mono}>{v}</span>
        ) : (
          <span className={styles.muted}>{t('firewall.any')}</span>
        );
      },
      sortValue: (r) => addrWithPort(r.dstAddress, r.dstPort),
    },
    {
      key: 'in',
      header: t('firewall.columns.in'),
      render: (r) =>
        r.inInterface ? (
          <span className={styles.mono}>{r.inInterface}</span>
        ) : (
          <span className={styles.muted}>—</span>
        ),
      sortValue: (r) => r.inInterface,
    },
    {
      key: 'out',
      header: t('firewall.columns.out'),
      render: (r) =>
        r.outInterface ? (
          <span className={styles.mono}>{r.outInterface}</span>
        ) : (
          <span className={styles.muted}>—</span>
        ),
      sortValue: (r) => r.outInterface,
    },
    {
      key: 'bytes',
      header: t('firewall.columns.bytes'),
      render: (r) =>
        r.bytes ? (
          <span className={styles.mono}>{format.sizeLabel(r.bytes)}</span>
        ) : (
          <span className={styles.muted}>0</span>
        ),
      sortValue: (r) => Number(r.bytes ?? 0),
    },
    {
      key: 'packets',
      header: t('firewall.columns.packets'),
      render: (r) =>
        r.packets ? (
          <span className={styles.mono}>{r.packets}</span>
        ) : (
          <span className={styles.muted}>0</span>
        ),
      sortValue: (r) => Number(r.packets ?? 0),
    },
    {
      key: 'comment',
      header: t('firewall.columns.comment'),
      render: (r) => (r.comment ? r.comment : <span className={styles.muted}>—</span>),
    },
    {
      key: 'status',
      header: t('firewall.columns.status'),
      sortValue: (r) => !r.disabled,
      render: (r) => (
        <Inline>
          {r.disabled ? (
            <Badge tone="warning">{t('common.disabled')}</Badge>
          ) : (
            <Badge tone="success">{t('common.enabled')}</Badge>
          )}
          {r.log ? <Badge tone="info">{t('firewall.log')}</Badge> : null}
        </Inline>
      ),
    },
  ];

  const skeletonRows = (
    <div data-testid="firewall-skeleton">
      {['a', 'b', 'c', 'd'].map((k) => (
        <div key={`skeleton-${k}`} className={styles.skeletonRow}>
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={`${k}-${i}`} height={14} />
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <Stack>
      <div className={styles.domesticLayout}>
        <DomesticAddressCard key={id} creds={creds} onInfo={setDomesticInfo} />
        <aside>
          <DomesticBlockCard key={id} creds={creds} info={domesticInfo} />
        </aside>
      </div>

      <Card data-testid="firewall-rules">
        <CardHeader className={styles.cardHeader}>
          <div>
            <CardTitle>
              <Inline>
                <Flame size={16} aria-hidden /> {t('firewall.title')}
              </Inline>
            </CardTitle>
            <CardDescription>{t('firewall.description')}</CardDescription>
          </div>
          <div className={styles.headerActions}>
            <Label className={styles.chainField}>
              <span className={styles.chainLabel}>{t('firewall.chain')}</span>
              <Select
                aria-label={t('firewall.chainFilterAria')}
                value={chain}
                onChange={setChain}
                options={chainOptions}
              />
            </Label>
          </div>
        </CardHeader>

        {error ? <div className={styles.errorBanner}>{error}</div> : null}

        {loading ? (
          skeletonRows
        ) : visibleRules.length === 0 ? (
          <div className={styles.empty}>
            <ShieldOff size={22} aria-hidden className={styles.emptyIcon} />
            <p>{chain ? t('firewall.emptyInChain', { chain }) : t('firewall.empty')}</p>
          </div>
        ) : (
          <DataTable columns={columns} rows={visibleRules} rowKey={(r) => r.id} />
        )}
      </Card>
    </Stack>
  );
}
