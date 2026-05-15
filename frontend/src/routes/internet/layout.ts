import type { RoutingHop, RoutingNode, RoutingNodeKind, RoutingTopology } from '@nasnet/mocks';

export const VIEWBOX_W = 1000;
export const VIEWBOX_H = 600;
export const HEADER_BAND = 60;
export const FOOT_PAD = 30;
export const NODE_BOX_W = 160;
export const NODE_BOX_H = 120;
export const NODE_RADIUS = 50;

export const COLUMN_ORDER: RoutingNodeKind[] = ['group', 'router', 'wan', 'vpn'];

export const COLUMN_LABELS: Record<RoutingNodeKind, string> = {
  group: 'Clients',
  router: 'Router',
  wan: 'WAN',
  vpn: 'VPN',
};

export const COLUMN_X: Record<RoutingNodeKind, number> = {
  group: 120,
  router: 380,
  wan: 640,
  vpn: 880,
};

export interface Positioned extends RoutingNode {
  x: number;
  y: number;
  isActive: boolean;
}

export function computeReachable(topology: RoutingTopology): Set<string> {
  const reachable = new Set<string>(
    topology.nodes.filter((n) => n.kind === 'group').map((n) => n.id),
  );
  let changed = true;
  while (changed) {
    changed = false;
    for (const h of topology.hops) {
      if (h.isActive && reachable.has(h.fromId) && !reachable.has(h.toId)) {
        reachable.add(h.toId);
        changed = true;
      }
    }
  }
  return reachable;
}

export function layoutNodes(topology: RoutingTopology, reachable: Set<string>): Positioned[] {
  const byKind: Record<RoutingNodeKind, RoutingNode[]> = {
    group: [],
    router: [],
    wan: [],
    vpn: [],
  };
  topology.nodes.forEach((n) => byKind[n.kind].push(n));

  const positioned: Positioned[] = [];
  const usableHeight = VIEWBOX_H - HEADER_BAND - FOOT_PAD;
  COLUMN_ORDER.forEach((kind) => {
    const list = byKind[kind];
    if (list.length === 0) return;
    const slot = usableHeight / (list.length + 1);
    list.forEach((node, i) => {
      positioned.push({
        ...node,
        x: COLUMN_X[kind],
        y: HEADER_BAND + slot * (i + 1),
        isActive: reachable.has(node.id),
      });
    });
  });
  return positioned;
}

export function hopForNode(node: RoutingNode, topology: RoutingTopology): RoutingHop | undefined {
  if (node.kind === 'group') return topology.hops.find((h) => h.fromId === node.id);
  return topology.hops.find((h) => h.toId === node.id);
}
