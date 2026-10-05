import i18n from '../../i18n';
import type { RoutingHop, RoutingNode, RoutingNodeKind, RoutingTopology } from '@nasnet/mocks';

export const NODE_BOX_W = 160;
export const NODE_BOX_H = 150;

export const COLUMN_ORDER: RoutingNodeKind[] = ['group', 'router', 'wan', 'vpn', 'internet'];

// Labels buildTopology gives its fixed nodes, translated at render. WAN and VPN labels
// come from the router (interface comments and names) and are shown as-is.
const FIXED_NODE_LABEL_KEYS = {
  group: 'internet.nodes.clients',
  router: 'internet.nodes.router',
  internet: 'internet.nodes.internet',
} as const;

// Uplinks buildTopology names from interface comments; Persian users know them by their
// Persian names.
const CARRIER_LABEL_KEYS: Record<
  string,
  'internet.carriers.starlink' | 'internet.carriers.hamrahAval' | 'internet.carriers.irancell'
> = {
  Starlink: 'internet.carriers.starlink',
  'Hamrah-e-Aval': 'internet.carriers.hamrahAval',
  Irancell: 'internet.carriers.irancell',
};

export function nodeLabel(node: RoutingNode): string {
  if (node.kind === 'group' || node.kind === 'router' || node.kind === 'internet') {
    return i18n.t(FIXED_NODE_LABEL_KEYS[node.kind], { ns: 'internet' });
  }
  const carrierKey = CARRIER_LABEL_KEYS[node.label];
  return carrierKey ? i18n.t(carrierKey, { ns: 'internet' }) : node.label;
}

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
