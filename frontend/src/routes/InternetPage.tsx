import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle, Stack, useToast } from '@nasnet/ui';
import type { RoutingTopology } from '@nasnet/mocks';
import { api } from '../api';
import { usePolling } from '../utils/usePolling';
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
  const toast = useToast();
  const [topology, setTopology] = useState<RoutingTopology | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editingHopId, setEditingHopId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    try {
      const t = await api.routing.getTopology(id);
      setTopology(t);
      setLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load routing topology.';
      toast.notify({
        title: 'Failed to load Internet topology',
        description: message,
        tone: 'danger',
      });
    }
  }, [id, toast]);

  usePolling(reload, 5000, !!id && editingHopId === null);

  const handleSaveHop = useCallback(
    async ({ hopId, isActive, fromId }: { hopId: string; isActive: boolean; fromId?: string }) => {
      if (!id) return;
      try {
        const next = await api.routing.updateHop(id, hopId, { isActive, fromId });
        setTopology(next);
        toast.notify({ title: 'Routing updated', tone: 'success' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update hop.';
        toast.notify({ title: 'Update failed', description: message, tone: 'danger' });
      }
    },
    [id, toast],
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
            Live view of how clients reach the internet via WAN uplinks and VPN tunnels. Click a WAN
            or VPN icon to toggle its link or reroute through a different upstream.
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
                  const editable =
                    node.kind === 'wan' || node.kind === 'vpn' || node.kind === 'router';
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
            <span className={styles.legendItem}>Click a node to configure</span>
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
