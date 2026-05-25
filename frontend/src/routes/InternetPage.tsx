import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle, Stack, useToast } from '@nasnet/ui';
import type { RoutingTopology } from '@nasnet/mocks';
import { ApiError, updateVPNClient } from '../api';
import { useRouter } from '../state/RouterStoreContext';
import { useSession } from '../state/SessionContext';
import { usePolling } from '../utils/usePolling';
import { buildTopology } from './internet/buildTopology';
import { Edge } from './internet/Edge';
import { HopEditDialog } from './internet/HopEditDialog';
import { NodeBubble } from './internet/NodeBubble';
import {
  COLUMN_LABELS,
  COLUMN_ORDER,
  COLUMN_X,
  VIEWBOX_H,
  VIEWBOX_W,
  computeReachable,
  hopForNode,
  layoutNodes,
  type Positioned,
} from './internet/layout';
import styles from './InternetPage.module.scss';

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
  const positioned = useMemo(
    () => (topology ? layoutNodes(topology, reachable) : []),
    [topology, reachable],
  );
  const nodeById = useMemo(() => {
    const map = new Map<string, Positioned>();
    positioned.forEach((p) => map.set(p.id, p));
    return map;
  }, [positioned]);

  if (!id) return null;

  const hasContent = !!topology && positioned.length > 0;

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
          <div className={styles.canvas}>
            {hasContent ? (
              <svg
                className={styles.svg}
                viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
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
                {COLUMN_ORDER.map((kind) => {
                  if (!positioned.some((p) => p.kind === kind)) return null;
                  return (
                    <foreignObject
                      key={`col-${kind}`}
                      x={COLUMN_X[kind] - 80}
                      y={10}
                      width={160}
                      height={30}
                    >
                      <div className={styles.columnHeader}>{COLUMN_LABELS[kind]}</div>
                    </foreignObject>
                  );
                })}
                {topology?.hops.map((hop) => (
                  <Edge
                    key={hop.id}
                    effectiveActive={hop.isActive && reachable.has(hop.fromId)}
                    from={nodeById.get(hop.fromId)}
                    to={nodeById.get(hop.toId)}
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
                {loaded
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
