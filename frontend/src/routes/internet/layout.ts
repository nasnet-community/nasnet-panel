import type { RoutingHop, RoutingNode, RoutingNodeKind, RoutingTopology } from '@nasnet/mocks';

export const NODE_BOX_W = 160;
export const NODE_BOX_H = 150;

export const COLUMN_ORDER: RoutingNodeKind[] = ['group', 'router', 'wan', 'vpn', 'internet'];

export const COLUMN_LABELS: Record<RoutingNodeKind, string> = {
  group: 'Clients',
  router: 'Router',
  wan: 'WAN',
  vpn: 'VPN',
  internet: 'Internet',
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

export function hopForNode(node: RoutingNode, topology: RoutingTopology): RoutingHop | undefined {
  if (node.kind === 'group') return topology.hops.find((h) => h.fromId === node.id);
  return topology.hops.find((h) => h.toId === node.id);
}
