import i18n from '../../i18n';

export type BridgeKind = 'split' | 'domestic' | 'foreign' | 'vpn' | 'other';

const BRIDGE_NAME_PREFIX = 'LANBridge';

// The kind as it is spelled inside a RouterOS bridge name, e.g. LANBridgeDomestic-2.
const KIND_NAME: Record<BridgeKind, string> = {
  split: 'Split',
  domestic: 'Domestic',
  foreign: 'Foreign',
  vpn: 'VPN',
  other: 'Custom',
};

// Translated when called, so labels follow the active language.
const kindLabel = (kind: BridgeKind): string => i18n.t(`bridge.kinds.${kind}`, { ns: 'network' });

const kindDescription = (kind: BridgeKind): string =>
  kind === 'other' ? '' : i18n.t(`bridge.kindDescriptions.${kind}`, { ns: 'network' });

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
  const variant = name.slice(BRIDGE_NAME_PREFIX.length + KIND_NAME[kind].length).replace(/^-/, '');
  return variant ? `${kindLabel(kind)} - ${variant}` : kindLabel(kind);
}

export function bridgeDescription(name: string, comment?: string): string {
  return kindDescription(bridgeKind(name)) || comment || '';
}

export function isForeignBridge(name: string): boolean {
  return bridgeKind(name) === 'foreign';
}
