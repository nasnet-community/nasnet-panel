import type { VPNClient, VPNProtocol, VPNServer } from '../../api';
import type { VPNClientResponse, VPNServersStatusResponse } from '../../api/vpn';

const TYPE_TO_PROTOCOL: Record<string, VPNProtocol> = {
  wg: 'wireguard',
  'l2tp-out': 'l2tp',
  'l2tp-in': 'l2tp',
  'pptp-out': 'pptp',
  'pptp-in': 'pptp',
  'ovpn-out': 'openvpn',
  'ovpn-in': 'openvpn',
};

function typeToProtocol(type: string): VPNProtocol {
  // Tunneling types (pppoe-*, eoip, gre, ipip, sit) fall through and surface their raw name in the badge.
  return TYPE_TO_PROTOCOL[type] ?? (type as VPNProtocol);
}

export function mapClientFromBE(r: VPNClientResponse, routerId: string): VPNClient {
  return {
    id: r.id,
    routerId,
    name: r.name,
    protocol: typeToProtocol(r.type),
    enabled: !r.disabled,
    running: r.running,
    lastLinkUp: r.lastLinkUp,
    lastLinkDown: r.lastLinkDown,
    rxByte: r.rxByte,
    txByte: r.txByte,
    comment: r.comment,
  };
}

export function mapServersStatusToList(s: VPNServersStatusResponse, routerId: string): VPNServer[] {
  const rows: VPNServer[] = [];
  for (const srv of s.ovpnServers ?? []) {
    rows.push({
      id: `ovpn:${srv.name}`,
      routerId,
      name: srv.name,
      protocol: 'openvpn',
      listenPort: 0,
      ipPool: '',
      running: srv.enabled,
    });
  }
  for (const srv of s.wireguards ?? []) {
    rows.push({
      id: `wg:${srv.name}`,
      routerId,
      name: srv.name,
      protocol: 'wireguard',
      listenPort: 0,
      ipPool: '',
      running: srv.enabled,
    });
  }
  if (s.pptp) {
    rows.push({
      id: 'pptp-server',
      routerId,
      name: 'PPTP',
      protocol: 'pptp',
      listenPort: 0,
      ipPool: '',
      running: s.pptp.enabled,
    });
  }
  if (s.l2tp) {
    rows.push({
      id: 'l2tp-server',
      routerId,
      name: 'L2TP',
      protocol: 'l2tp',
      listenPort: 0,
      ipPool: '',
      running: s.l2tp.enabled,
    });
  }
  if (s.sstp) {
    rows.push({
      id: 'sstp-server',
      routerId,
      name: 'SSTP',
      protocol: 'sstp',
      listenPort: 0,
      ipPool: '',
      running: s.sstp.enabled,
    });
  }
  return rows;
}
