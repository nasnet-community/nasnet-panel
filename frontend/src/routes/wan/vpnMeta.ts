import type { WanVpnClient } from '../../api';

export function vpnMeta(c: WanVpnClient): { tag: string; detail: string } {
  if (c.kind === 'wireguard') return { tag: 'WireGuard', detail: c.wgEndpoint || 'no endpoint' };
  return { tag: 'L2TP', detail: c.l2tpServer || 'no server' };
}
