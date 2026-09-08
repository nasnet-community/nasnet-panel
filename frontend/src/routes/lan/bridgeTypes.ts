export type BridgeKind = 'split' | 'domestic' | 'foreign' | 'vpn' | 'other';

const BRIDGE_NAME_PREFIX = 'LANBridge';

const KIND_LABEL: Record<BridgeKind, string> = {
  split: 'Split',
  domestic: 'Domestic',
  foreign: 'Foreign',
  vpn: 'VPN',
  other: 'Custom',
};

const KIND_DESCRIPTION: Record<BridgeKind, string> = {
  split: 'Splits traffic to foreign and domestic automatically for that interface.',
  domestic: 'Routes all traffic to domestic for that interface.',
  foreign: 'Routes all traffic to foreign for that interface.',
  vpn: 'Routes all traffic to VPN for that interface.',
  other: '',
};

export function bridgeKind(name: string): BridgeKind {
  const suffix = name.startsWith(BRIDGE_NAME_PREFIX) ? name.slice(BRIDGE_NAME_PREFIX.length) : name;
  const lower = suffix.toLowerCase();
  if (lower.startsWith('split')) return 'split';
  if (lower.startsWith('domestic')) return 'domestic';
  if (lower.startsWith('foreign')) return 'foreign';
  if (lower.startsWith('vpn')) return 'vpn';
  return 'other';
}

export function bridgeLabel(name: string): string {
  const kind = bridgeKind(name);
  if (kind === 'other' || !name.startsWith(BRIDGE_NAME_PREFIX)) return name;
  const variant = name.slice(BRIDGE_NAME_PREFIX.length + KIND_LABEL[kind].length).replace(/^-/, '');
  return variant ? `${KIND_LABEL[kind]} - ${variant}` : KIND_LABEL[kind];
}

export function bridgeDescription(name: string, comment?: string): string {
  return KIND_DESCRIPTION[bridgeKind(name)] || comment || '';
}

export function isForeignBridge(name: string): boolean {
  return bridgeKind(name) === 'foreign';
}
