import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRightFromLine,
  ArrowRightLeft,
  ArrowRightToLine,
  Cloud,
  Cpu,
  Flame,
  Globe,
  ShieldOff,
} from 'lucide-react';
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
import { fetchFirewallRules, type FirewallCredentials, type FirewallRule } from '../api';
import { useSession } from '../state/SessionContext';
import { useRouter } from '../state/RouterStoreContext';
import { useFormat } from '../utils/useFormat';

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

interface FlowNodeSpec {
  id: string;
  icon: ReactNode;
  label: string;
  x: number;
  y: number;
  rules?: FirewallRule[];
  popoverPlacement?: 'above' | 'below';
}

const FLOW_W = 1800;
const FLOW_H = 280;
const NODE_SIZE = 64;
const NODE_R = NODE_SIZE / 2;

const P = {
  'net-in': { x: 120, y: 110 },
  input: { x: 480, y: 110 },
  router: { x: 900, y: 110 },
  output: { x: 1320, y: 110 },
  'net-out': { x: 1680, y: 110 },
  forward: { x: 900, y: 230 },
} as const;

interface Connector {
  id: string;
  d: string;
  dotBegin: string;
}

const CONNECTORS: Connector[] = [
  {
    id: 'net-in-input',
    d: `M ${P['net-in'].x + NODE_R} ${P['net-in'].y} H ${P.input.x - NODE_R}`,
    dotBegin: '0s',
  },
  {
    id: 'input-router',
    d: `M ${P.input.x + NODE_R} ${P.input.y} H ${P.router.x - NODE_R}`,
    dotBegin: '0.7s',
  },
  {
    id: 'router-output',
    d: `M ${P.router.x + NODE_R} ${P.router.y} H ${P.output.x - NODE_R}`,
    dotBegin: '1.4s',
  },
  {
    id: 'output-net-out',
    d: `M ${P.output.x + NODE_R} ${P.output.y} H ${P['net-out'].x - NODE_R}`,
    dotBegin: '2.1s',
  },
  {
    id: 'fwd-in',
    d: `M ${P['net-in'].x} ${P['net-in'].y + NODE_R} V ${P.forward.y} H ${P.forward.x - NODE_R}`,
    dotBegin: '0.3s',
  },
  {
    id: 'fwd-out',
    d: `M ${P.forward.x + NODE_R} ${P.forward.y} H ${P['net-out'].x} V ${P['net-out'].y + NODE_R}`,
    dotBegin: '1.8s',
  },
];

interface PacketFlowBoardProps {
  rulesByChain: { input: FirewallRule[]; forward: FirewallRule[]; output: FirewallRule[] };
  loading: boolean;
}

function PacketFlowBoard({ rulesByChain, loading }: PacketFlowBoardProps) {
  const { t } = useTranslation('network');
  const format = useFormat();
  const ruleCount = (count: number) => t('firewall.ruleCount', { count, n: format.number(count) });
  const nodes: FlowNodeSpec[] = [
    {
      id: 'net-in',
      icon: <Globe size={26} aria-hidden />,
      label: t('firewall.nodes.ingress'),
      ...P['net-in'],
    },
    {
      id: 'input',
      icon: <ArrowRightToLine size={26} aria-hidden />,
      label: t('firewall.nodes.input'),
      ...P.input,
      rules: rulesByChain.input,
      popoverPlacement: 'below',
    },
    {
      id: 'router',
      icon: <Cpu size={26} aria-hidden />,
      label: t('firewall.nodes.router'),
      ...P.router,
    },
    {
      id: 'output',
      icon: <ArrowRightFromLine size={26} aria-hidden />,
      label: t('firewall.nodes.output'),
      ...P.output,
      rules: rulesByChain.output,
      popoverPlacement: 'below',
    },
    {
      id: 'net-out',
      icon: <Cloud size={26} aria-hidden />,
      label: t('firewall.nodes.egress'),
      ...P['net-out'],
    },
    {
      id: 'forward',
      icon: <ArrowRightLeft size={26} aria-hidden />,
      label: t('firewall.nodes.forward'),
      ...P.forward,
      rules: rulesByChain.forward,
      popoverPlacement: 'above',
    },
  ];

  return (
    <div className={styles.board} role="img" aria-label={t('firewall.diagramAria')}>
      <svg
        className={styles.boardSvg}
        viewBox={`0 0 ${FLOW_W} ${FLOW_H}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <defs>
          <marker
            id="fw-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className={styles.arrowHead} />
          </marker>
        </defs>

        {CONNECTORS.map((c) => (
          <path
            key={c.id}
            d={c.d}
            className={styles.boardLine}
            fill="none"
            markerEnd="url(#fw-arrow)"
          />
        ))}

        {!loading
          ? CONNECTORS.map((c) => (
              <circle key={`dot-${c.id}`} r="5" className={styles.flowDot}>
                <animateMotion dur="3s" repeatCount="indefinite" begin={c.dotBegin} path={c.d} />
              </circle>
            ))
          : null}
      </svg>

      {nodes.map((n) => {
        const pct = (v: number, total: number) => `${(v / total) * 100}%`;
        const hasPopover = n.rules !== undefined;
        const chainClass =
          n.id === 'input' || n.id === 'forward' || n.id === 'output'
            ? styles.boardNodeChain
            : styles.boardNodeEndpoint;
        return (
          <div
            key={n.id}
            className={`${styles.boardNodeCircle} ${chainClass} ${hasPopover ? styles.boardNodeInteractive : ''}`}
            style={{
              left: pct(n.x - NODE_R, FLOW_W),
              top: pct(n.y - NODE_R, FLOW_H),
              width: pct(NODE_SIZE, FLOW_W),
              height: pct(NODE_SIZE, FLOW_H),
            }}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={hasPopover ? 0 : undefined}
            role={hasPopover ? 'button' : undefined}
            aria-label={
              hasPopover && n.rules
                ? t('firewall.nodeAria', {
                    label: n.label,
                    count: n.rules.length,
                    n: format.number(n.rules.length),
                  })
                : n.label
            }
          >
            <div className={styles.boardNodeIcon}>{n.icon}</div>
            <span
              className={
                n.id === 'net-in' || n.id === 'net-out'
                  ? styles.boardNodeLabelAbove
                  : styles.boardNodeLabel
              }
            >
              {n.label}
            </span>
            {hasPopover ? (
              <div
                role="tooltip"
                className={
                  n.popoverPlacement === 'above'
                    ? styles.boardPopoverAbove
                    : styles.boardPopoverBelow
                }
              >
                <div className={styles.boardPopoverHeader}>
                  <span className={styles.boardPopoverTitle}>{n.label}</span>
                  <span className={styles.boardPopoverMeta}>
                    {loading ? '…' : ruleCount(n.rules!.length)}
                  </span>
                </div>
                {loading ? (
                  <div className={styles.flowEmpty}>
                    <Skeleton height={12} />
                  </div>
                ) : (
                  <RuleSummary rules={n.rules!} />
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function RuleSummary({ rules }: { rules: FirewallRule[] }) {
  const { t } = useTranslation('network');
  if (rules.length === 0) {
    return <div className={styles.flowEmpty}>{t('firewall.noRules')}</div>;
  }
  return (
    <ul className={styles.flowRuleList}>
      {rules.map((r) => (
        <li key={r.id} className={r.disabled ? styles.flowRuleItemDisabled : styles.flowRuleItem}>
          <Badge tone={actionTone(r.action)}>{r.action}</Badge>
          <span className={styles.flowRuleProto}>{r.protocol || t('firewall.any')}</span>
          <span className={styles.flowRuleComment}>
            {r.comment || <span className={styles.muted}>{t('firewall.noComment')}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
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
    },
    {
      key: 'comment',
      header: t('firewall.columns.comment'),
      render: (r) => (r.comment ? r.comment : <span className={styles.muted}>—</span>),
    },
    {
      key: 'status',
      header: t('firewall.columns.status'),
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
      <div className={styles.flowBoard} data-testid="firewall-flow">
        <PacketFlowBoard
          rulesByChain={{
            input: rules.filter((r) => r.chain === 'input'),
            forward: rules.filter((r) => r.chain === 'forward'),
            output: rules.filter((r) => r.chain === 'output'),
          }}
          loading={loading}
        />
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
