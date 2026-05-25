export type WanCategory = 'foreign' | 'domestic';

export type WanVpnKind = 'wireguard' | 'l2tp';

export interface WanVpnFormPayload {
  name: string;
  kind: WanVpnKind;
  enabled: boolean;
  wgConfig?: string;
  wgEndpoint?: string;
  wgEndpointPort?: string;
  wgPeerPublicKey?: string;
  wgPrivateKey?: string;
  wgPublicKey?: string;
  wgAllowedIps?: string;
  wgKeepalive?: string;
  wgMtu?: string;
  l2tpServer?: string;
  l2tpUsername?: string;
  l2tpPassword?: string;
  l2tpUseIpsec?: boolean;
  l2tpIpsecSecret?: string;
}

export const WAN_COMMENT_FOREIGN = 'WAN - Foreign Link(Foreign)';
export const WAN_COMMENT_DOMESTIC = 'WAN - Domestic Link(Domestic)';

export const wanCommentFor = (category: WanCategory): string =>
  category === 'foreign' ? WAN_COMMENT_FOREIGN : WAN_COMMENT_DOMESTIC;

export const matchesWanCategory = (comment: string | undefined, category: WanCategory): boolean =>
  (comment ?? '').toLowerCase().includes(category);
