import type { VPNClientResponse } from '../../api';

export function vpnMeta(c: VPNClientResponse): { tag: string; detail: string } {
  if (c.type === 'wg') return { tag: 'WireGuard', detail: c.comment || 'no comment' };
  if (c.type === 'l2tp-out') return { tag: 'L2TP', detail: c.comment || 'no comment' };
  return { tag: c.type, detail: c.comment || '—' };
}
