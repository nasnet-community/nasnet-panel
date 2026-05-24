import {
  fetchInterfaces,
  fetchRoutes,
  listVPNClients,
  type InterfaceResponse,
  type RouteResponse,
  type VPNClientResponse,
} from '../../api';
import type {
  RoutingHop,
  RoutingNode,
  RoutingTopology,
  RoutingWanKind,
  VPNProtocol,
} from '@nasnet/mocks';

interface Creds {
  host: string;
  username: string;
  password: string;
}

const VPN_INTERFACE_TYPES = new Set([
  'wg',
  'l2tp-out',
  'l2tp-in',
  'pptp-out',
  'pptp-in',
  'ovpn-out',
  'ovpn-in',
  'sstp-out',
  'sstp-in',
]);

const TYPE_TO_PROTOCOL: Record<string, VPNProtocol> = {
  wg: 'wireguard',
  'l2tp-out': 'l2tp',
  'l2tp-in': 'l2tp',
  'pptp-out': 'pptp',
  'pptp-in': 'pptp',
  'ovpn-out': 'openvpn',
  'ovpn-in': 'openvpn',
  'sstp-out': 'sstp',
  'sstp-in': 'sstp',
};

function classifyWan(iface: InterfaceResponse): { kind: RoutingWanKind; label: string } {
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

function pickWanInterfaces(
  ifaces: InterfaceResponse[],
  routes: RouteResponse[],
): InterfaceResponse[] {
  const routeIfaces = new Set(
    routes
      .filter((r) => r.dstAddress === '0.0.0.0/0' && r.interface)
      .map((r) => r.interface as string),
  );
  const candidates = ifaces.filter((i) => {
    if (i.disabled) return false;
    if (routeIfaces.has(i.name)) return true;
    if (i.type !== 'ether') return false;
    const comment = (i.comment ?? '').toLowerCase();
    return (
      comment.includes('wan') ||
      comment.includes('uplink') ||
      comment.includes('isp') ||
      comment.includes('starlink') ||
      comment.includes('fiber') ||
      comment.includes('mobile') ||
      comment.includes('lte') ||
      comment.includes('5g') ||
      comment.includes('hamrah') ||
      comment.includes('irancell')
    );
  });
  if (candidates.length > 0) return candidates;
  return ifaces.filter((i) => i.type === 'ether' && !i.disabled);
}

function findWanForVpn(
  vpnIfaceName: string,
  routes: RouteResponse[],
  wanByName: Map<string, InterfaceResponse>,
): InterfaceResponse | undefined {
  const vpnRoute = routes.find((r) => r.interface === vpnIfaceName);
  if (vpnRoute?.gateway) {
    const gwRoute = routes.find(
      (r) => r.interface && r.interface !== vpnIfaceName && r.dstAddress === '0.0.0.0/0',
    );
    if (gwRoute?.interface && wanByName.has(gwRoute.interface)) {
      return wanByName.get(gwRoute.interface);
    }
  }
  const defaultRoute = routes.find(
    (r) => r.dstAddress === '0.0.0.0/0' && r.active && r.interface && wanByName.has(r.interface),
  );
  if (defaultRoute?.interface) return wanByName.get(defaultRoute.interface);
  return undefined;
}

export async function buildTopology(
  routerId: string,
  creds: Creds,
  signal?: AbortSignal,
): Promise<RoutingTopology> {
  const [ifaces, vpnClients, routes] = await Promise.all([
    fetchInterfaces(creds, signal),
    listVPNClients(creds, signal),
    fetchRoutes(creds, signal).catch(() => [] as RouteResponse[]),
  ]);

  const nodes: RoutingNode[] = [];
  const hops: RoutingHop[] = [];
  const ROUTER_ID = 'rtr';
  const GROUP_ID = 'grp_clients';

  nodes.push({ id: GROUP_ID, kind: 'group', label: 'Clients' });
  hops.push({ id: 'h_clients_rtr', fromId: GROUP_ID, toId: ROUTER_ID, isActive: true });
  nodes.push({ id: ROUTER_ID, kind: 'router', label: 'Router' });

  const wans = pickWanInterfaces(ifaces, routes);
  const wanByName = new Map<string, InterfaceResponse>();
  wans.forEach((wan) => {
    wanByName.set(wan.name, wan);
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

  const fallbackWan = wans.find((w) => w.running) ?? wans[0];
  const vpnTunnels = vpnClients.filter(
    (c: VPNClientResponse) => VPN_INTERFACE_TYPES.has(c.type) && !c.type.endsWith('-in'),
  );
  vpnTunnels.forEach((vpn) => {
    const id = `vpn_${vpn.name}`;
    nodes.push({
      id,
      kind: 'vpn',
      label: vpn.comment?.trim() ? vpn.comment : vpn.name,
      protocol: TYPE_TO_PROTOCOL[vpn.type],
    });
    const upstream = findWanForVpn(vpn.name, routes, wanByName) ?? fallbackWan;
    if (upstream) {
      hops.push({
        id: `h_vpn_${vpn.name}`,
        fromId: `wan_${upstream.name}`,
        toId: id,
        isActive: !!vpn.running,
      });
    }
  });

  return { routerId, nodes, hops };
}
