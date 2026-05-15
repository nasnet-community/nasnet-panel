import {
  Globe,
  Laptop,
  Router as RouterIcon,
  SatelliteDish,
  Server,
  Shield,
  Signal,
} from 'lucide-react';
import type { RoutingNode } from '@nasnet/mocks';

function wanIcon(kind: string | undefined) {
  switch (kind) {
    case 'starlink':
      return <SatelliteDish size={26} strokeWidth={1.75} />;
    case 'mobile':
      return <Signal size={26} strokeWidth={1.75} />;
    case 'fiber':
      return <Server size={26} strokeWidth={1.75} />;
    default:
      return <Globe size={26} strokeWidth={1.75} />;
  }
}

export function nodeIcon(node: RoutingNode) {
  if (node.kind === 'group') return <Laptop size={26} strokeWidth={1.75} />;
  if (node.kind === 'router') return <RouterIcon size={26} strokeWidth={1.75} />;
  if (node.kind === 'wan') return wanIcon(node.wanKind);
  return <Shield size={26} strokeWidth={1.75} />;
}

const VPN_PROTOCOL_LABELS: Record<string, string> = {
  wireguard: 'WireGuard',
  l2tp: 'L2TP',
  openvpn: 'OpenVPN',
  pptp: 'PPTP',
  sstp: 'SSTP',
  ikev2: 'IKEv2',
};

export function nodeSubLabel(node: RoutingNode): string | undefined {
  if (node.kind === 'vpn' && node.protocol) {
    return VPN_PROTOCOL_LABELS[node.protocol] ?? node.protocol.toUpperCase();
  }
  return node.subnet;
}
