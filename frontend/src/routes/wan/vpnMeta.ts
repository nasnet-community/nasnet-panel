import type { WanVpnClient } from '../../api';

export function vpnMeta(c: WanVpnClient): string {
  if (c.kind === 'wireguard') return `WireGuard · ${c.wgEndpoint || 'no endpoint'}`;
  return `L2TP · ${c.l2tpServer || 'no server'}`;
}
