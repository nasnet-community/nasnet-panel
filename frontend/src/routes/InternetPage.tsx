import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle, Stack, useToast } from '@nasnet/ui';
import type { RoutingTopology } from '@nasnet/mocks';
import { ApiError, updateForeignGateway, updateVPNClient } from '../api';
import { useRouter } from '../state/RouterStoreContext';
import { useSession } from '../state/SessionContext';
import { usePolling } from '../utils/usePolling';
import { buildTopology } from './internet/buildTopology';
import { computeColumnLayout } from './internet/columnLayout';
import { Edge } from './internet/Edge';
import { HopEditDialog } from './internet/HopEditDialog';
import { NodeBubble } from './internet/NodeBubble';
import {
  COLUMN_LABELS,
  COLUMN_ORDER,
  computeReachable,
  hopForNode,
  type Positioned,
} from './internet/layout';
import styles from './InternetPage.module.scss';

const HEADER_BAND = 44;

export function InternetPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const { getCredentials } = useSession();
  const toast = useToast();
  const [topology, setTopology] = useState<RoutingTopology | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editingHopId, setEditingHopId] = useState<string | null>(null);

  const creds = useMemo(() => {
    if (!id) return null;
    const c = getCredentials(id);
    const host = router?.host;
    if (!c || !host) return null;
    return { host, username: c.username, password: c.password };
  }, [id, router?.host, getCredentials]);

  const reload = useCallback(async () => {
    if (!id || !creds) return;
    try {
      const t = await buildTopology(id, creds);
      setTopology(t);
      setLoaded(true);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load routing topology.';
      toast.notify({
        title: 'Failed to load Internet topology',
        description: message,
        tone: 'danger',
      });
    }
  }, [id, creds, toast]);

  usePolling(reload, 5000, !!creds && editingHopId === null);

  const handleSaveHop = useCallback(
    async ({ hopId, isActive }: { hopId: string; isActive: boolean }) => {
      if (!creds || !topology) return;
      const hop = topology.hops.find((h) => h.id === hopId);
      const target = hop ? topology.nodes.find((n) => n.id === hop.toId) : undefined;
      if (!hop || !target) return;
      if (target.kind !== 'vpn') {
        toast.notify({
          title: 'Not supported yet',
          description: 'Only VPN tunnels can be toggled from this view.',
          tone: 'warning',
        });
        return;
      }
      const vpnName = target.id.replace(/^vpn_/, '');
      try {
        await updateVPNClient(creds, vpnName, { disabled: !isActive });
        if (isActive) {
          await updateForeignGateway(creds, vpnName);
          const others = topology.nodes.filter((n) => n.kind === 'vpn' && n.id !== target.id);
          await Promise.all(
            others.map((n) =>
              updateVPNClient(creds, n.id.replace(/^vpn_/, ''), { disabled: true }),
            ),
          );
        }
        await reload();
        toast.notify({ title: 'VPN tunnel updated', tone: 'success' });
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to update VPN tunnel.';
        toast.notify({ title: 'Update failed', description: message, tone: 'danger' });
      }
    },
    [creds, topology, toast, reload],
  );

  const reachable = useMemo(
    () => (topology ? computeReachable(topology) : new Set<string>()),
    [topology],
  );

  const layout = useMemo(() => (topology ? computeColumnLayout(topology) : null), [topology]);

  const positioned = useMemo(() => {
    if (!topology || !layout) return [];
    return topology.nodes.reduce<Positioned[]>((acc, node) => {
      const pos = layout.positions.get(node.id);
      if (pos) acc.push({ ...node, x: pos.x, y: pos.y, isActive: reachable.has(node.id) });
      return acc;
    }, []);
  }, [topology, layout, reachable]);

  const columns = useMemo(() => {
    if (!layout) return [];
    return COLUMN_ORDER.filter((kind) => layout.columnX.has(kind)).map((kind) => ({
      kind,
      x: layout.columnX.get(kind) ?? 0,
    }));
  }, [layout]);

  if (!id) return null;

  const hasContent = !!topology && !!layout && positioned.length > 0;

  return (
    <Stack>
      <Card>
        <CardHeader>
          <CardTitle>Internet routing</CardTitle>
          <CardDescription>
            Live view of how clients reach the internet via WAN uplinks and VPN tunnels. Click a VPN
            tunnel to enable or disable it.
          </CardDescription>
        </CardHeader>
        <div className={styles.wrap} aria-busy={!loaded}>
          <div
            className={styles.canvas}
            style={
              layout && layout.height > 0
                ? { aspectRatio: `${layout.width} / ${layout.height + HEADER_BAND}` }
                : undefined
            }
          >
            {hasContent ? (
              <svg
                className={styles.svg}
                viewBox={`0 ${-HEADER_BAND} ${layout.width} ${layout.height + HEADER_BAND}`}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="Routing topology"
              >
                <defs>
                  <marker
                    id="arr-idle"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto"
                  >
                    <path d="M0,0 L10,5 L0,10 z" className={styles.arrow} />
                  </marker>
                  <marker
                    id="arr-active"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto"
                  >
                    <path d="M0,0 L10,5 L0,10 z" className={styles.arrowActive} />
                  </marker>
                </defs>
                {columns.map((col) => (
                  <foreignObject
                    key={`col-${col.kind}`}
                    x={col.x - 80}
                    y={-HEADER_BAND + 6}
                    width={160}
                    height={30}
                  >
                    <div className={styles.columnHeader}>{COLUMN_LABELS[col.kind]}</div>
                  </foreignObject>
                ))}
                {topology?.hops
                  .map((hop) => ({
                    hop,
                    effectiveActive: hop.isActive && reachable.has(hop.fromId),
                  }))
                  .sort((a, b) => Number(a.effectiveActive) - Number(b.effectiveActive))
                  .map(({ hop, effectiveActive }) => (
                    <Edge
                      key={hop.id}
                      effectiveActive={effectiveActive}
                      d={layout.edges.get(hop.id)}
                      pathId={`edge-${hop.id}`}
                    />
                  ))}
                {positioned.map((node) => {
                  const editable = node.kind === 'vpn';
                  return (
                    <NodeBubble
                      key={node.id}
                      node={node}
                      onSelect={
                        editable && topology
                          ? (n) => {
                              const hop = hopForNode(n, topology);
                              if (hop) setEditingHopId(hop.id);
                            }
                          : undefined
                      }
                    />
                  );
                })}
              </svg>
            ) : (
              <div className={styles.empty}>
                {loaded && (!topology || topology.nodes.length === 0)
                  ? 'No routing topology configured for this router yet.'
                  : 'Loading topology…'}
              </div>
            )}
          </div>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${styles.legendSwatchActive}`} />
              Active link
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} />
              Configured, idle
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} />
              Live traffic
            </span>
            <span className={styles.legendItem}>Click a VPN tunnel to toggle</span>
          </div>
        </div>
      </Card>
      {topology && editingHopId ? (
        <HopEditDialog
          topology={topology}
          hopId={editingHopId}
          onClose={() => setEditingHopId(null)}
          onSave={handleSaveHop}
        />
      ) : null}
    </Stack>
  );
}
