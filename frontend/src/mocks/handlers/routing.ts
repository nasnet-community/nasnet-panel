import { simulateLatency } from '../simulate-latency';
import type { Interface, RoutingHop, RoutingNode, RoutingTopology, RoutingWanKind } from '../types';
import { clone, commit, state } from './store';

const SUBNET_BASES = ['192.168.88.0/24', '192.168.89.0/24', '192.168.90.0/24', '192.168.91.0/24'];

function classifyWan(iface: Interface): { kind: RoutingWanKind; label: string } {
  const comment = (iface.comment ?? '').toLowerCase();
  if (comment.includes('starlink')) return { kind: 'starlink', label: 'Starlink' };
  if (comment.includes('hamrah')) return { kind: 'mobile', label: 'Hamrah-e-Aval' };
  if (comment.includes('irancell')) return { kind: 'mobile', label: 'Irancell' };
  if (comment.includes('mobile') || comment.includes('lte') || comment.includes('5g')) {
    return { kind: 'mobile', label: iface.comment ?? iface.name };
  }
  if (comment.includes('fiber') || comment.includes('fibre')) {
    return { kind: 'fiber', label: iface.comment ?? iface.name };
  }
  if (comment.includes('uplink') || comment.includes('wan') || comment.includes('isp')) {
    return { kind: 'ether', label: iface.comment ?? iface.name.toUpperCase() };
  }
  return { kind: 'ether', label: iface.name.toUpperCase() };
}

function deriveTopology(routerId: string): RoutingTopology {
  const ifaces = state.current.interfaces[routerId] ?? [];
  const vpnClients = state.current.vpnClients.filter((c) => c.routerId === routerId);

  const nodes: RoutingNode[] = [];
  const hops: RoutingHop[] = [];
  const ROUTER_ID = 'rtr';
  const GROUP_ID = 'grp_clients';

  nodes.push({ id: GROUP_ID, kind: 'group', label: 'Clients', subnet: SUBNET_BASES[0] });
  hops.push({ id: 'h_clients_rtr', fromId: GROUP_ID, toId: ROUTER_ID, isActive: true });

  nodes.push({ id: ROUTER_ID, kind: 'router', label: 'Router' });

  const wans = ifaces.filter((i) => i.type === 'ether' && !i.disabled);
  wans.forEach((wan) => {
    const id = `wan_${wan.name}`;
    const { kind, label } = classifyWan(wan);
    nodes.push({ id, kind: 'wan', label, wanKind: kind });
    hops.push({
      id: `h_${ROUTER_ID}_${wan.name}`,
      fromId: ROUTER_ID,
      toId: id,
      isActive: !!wan.running,
    });
  });

  const activeWan = wans.find((w) => w.running) ?? wans[0];
  vpnClients.forEach((vpn) => {
    const id = `vpn_${vpn.id}`;
    nodes.push({ id, kind: 'vpn', label: vpn.name, protocol: vpn.protocol });
    if (activeWan) {
      hops.push({
        id: `h_wan_${activeWan.name}_${vpn.id}`,
        fromId: `wan_${activeWan.name}`,
        toId: id,
        isActive: !!vpn.running,
      });
    }
  });

  if (!ifaces.length) {
    nodes.push({ id: 'wan_eth1', kind: 'wan', label: 'WAN', wanKind: 'ether' });
    hops.push({
      id: 'h_rtr_wan_eth1',
      fromId: ROUTER_ID,
      toId: 'wan_eth1',
      isActive: false,
    });
  }

  return { routerId, nodes, hops };
}

export interface HopPatch {
  isActive?: boolean;
  fromId?: string;
}

export const routing = {
  async getTopology(routerId: string): Promise<RoutingTopology> {
    await simulateLatency(50, 150);
    const existing = state.current.routingTopologies?.[routerId];
    if (existing) return clone(existing);
    return deriveTopology(routerId);
  },

  async updateHop(routerId: string, hopId: string, patch: HopPatch): Promise<RoutingTopology> {
    await simulateLatency();
    const map = state.current.routingTopologies ?? {};
    const current = map[routerId] ?? deriveTopology(routerId);
    const hops = current.hops.map((h) =>
      h.id === hopId
        ? {
            ...h,
            ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
            ...(patch.fromId !== undefined ? { fromId: patch.fromId } : {}),
          }
        : h,
    );
    const next: RoutingTopology = { ...current, hops };
    state.current.routingTopologies = { ...map, [routerId]: next };
    commit();
    return clone(next);
  },
};
