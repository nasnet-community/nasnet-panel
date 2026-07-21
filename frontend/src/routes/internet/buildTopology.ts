import {
  fetchForeignGateway,
  fetchInterfaces,
  fetchNetStatus,
  type InterfaceResponse,
  type NetStatusEntry,
} from '../../api';
import type {
  RoutingHop,
  RoutingNode,
  RoutingTopology,
  RoutingWanKind,
  VPNProtocol,
} from '@nasnet/mocks';
import { matchesWanCategory } from '../wan/types';

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

function pickWanInterfaces(ifaces: InterfaceResponse[]): InterfaceResponse[] {
  const candidates = ifaces.filter((i) => {
    if (i.disabled) return false;
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

export async function buildTopology(
  routerId: string,
  creds: Creds,
  signal?: AbortSignal,
): Promise<RoutingTopology> {
  const [ifaces, foreignGateway, netStatus] = await Promise.all([
    fetchInterfaces(creds, signal),
    fetchForeignGateway(creds, signal).catch(() => null),
    fetchNetStatus(creds, signal).catch((): NetStatusEntry[] => []),
  ]);

  const isNetDown = (type: NetStatusEntry['type']) =>
    netStatus.some((e) => e.type === type && e.status === 'down');
  const domesticDown = isNetDown('domestic');
  const vpnDown = isNetDown('vpn');
  const foreignDown = isNetDown('foreign');

  const nodes: RoutingNode[] = [];
  const hops: RoutingHop[] = [];
  const ROUTER_ID = 'rtr';
  const GROUP_ID = 'grp_clients';

  nodes.push({ id: GROUP_ID, kind: 'group', label: 'Clients' });
  hops.push({ id: 'h_clients_rtr', fromId: GROUP_ID, toId: ROUTER_ID, isActive: true });
  nodes.push({ id: ROUTER_ID, kind: 'router', label: 'Router' });

  const INTERNET_ID = 'internet';
  const domesticWans: InterfaceResponse[] = [];

  const wans = pickWanInterfaces(ifaces);
  wans.forEach((wan) => {
    const id = `wan_${wan.name}`;
    const { kind, label } = classifyWan(wan);
    const isDomestic = matchesWanCategory(wan.comment, 'domestic');
    nodes.push({ id, kind: 'wan', label, wanKind: kind });
    hops.push({
      id: `h_${ROUTER_ID}_${wan.name}`,
      fromId: ROUTER_ID,
      toId: id,
      isActive: (isDomestic || !!wan.running) && !(isDomestic ? domesticDown : foreignDown),
    });
    if (isDomestic) domesticWans.push(wan);
  });

  const fallbackWan = wans.find((w) => w.running) ?? wans[0];
  const vpnTunnels = ifaces.filter((i) => {
    if (!VPN_INTERFACE_TYPES.has(i.type) || i.type.endsWith('-in')) return false;
    const name = i.name.toLowerCase();
    return name.includes('wg-client') || name.includes('l2tp-client');
  });
  const isRouted = (name: string) => foreignGateway === name;
  vpnTunnels.forEach((vpn) => {
    const id = `vpn_${vpn.name}`;
    nodes.push({
      id,
      kind: 'vpn',
      label: vpn.comment?.trim() ? vpn.comment : vpn.name,
      protocol: TYPE_TO_PROTOCOL[vpn.type],
    });
    if (fallbackWan) {
      hops.push({
        id: `h_vpn_${vpn.name}`,
        fromId: `wan_${fallbackWan.name}`,
        toId: id,
        isActive: !!vpn.running && isRouted(vpn.name) && !vpnDown,
      });
    }
  });

  if (vpnTunnels.length > 0 || domesticWans.length > 0) {
    nodes.push({ id: INTERNET_ID, kind: 'internet', label: 'Internet' });
    vpnTunnels.forEach((vpn) => {
      hops.push({
        id: `h_internet_vpn_${vpn.name}`,
        fromId: `vpn_${vpn.name}`,
        toId: INTERNET_ID,
        isActive: !!vpn.running && isRouted(vpn.name) && !vpnDown,
      });
    });
    domesticWans.forEach((wan) => {
      hops.push({
        id: `h_internet_wan_${wan.name}`,
        fromId: `wan_${wan.name}`,
        toId: INTERNET_ID,
        isActive: !domesticDown,
      });
    });
  }

  return { routerId, nodes, hops };
}
