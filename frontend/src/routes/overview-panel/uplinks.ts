import type { InterfaceResponse, IpAddressResponse } from '../../api';

export type UplinkKind = 'starlink' | 'mobile' | 'fiber' | 'ether';

export interface UplinkRow {
  ifaceName: string;
  label: string;
  kind: UplinkKind;
  ipAddresses: string[];
  running: boolean;
  disabled: boolean;
}

interface UplinkMatch {
  kind: UplinkKind;
  label: string;
}

const RULES: ReadonlyArray<{
  keywords: string[];
  kind: UplinkKind;
  label: (iface: InterfaceResponse) => string;
}> = [
  { keywords: ['starlink'], kind: 'starlink', label: () => 'Starlink' },
  { keywords: ['hamrah'], kind: 'mobile', label: () => 'Hamrah-e-Aval' },
  { keywords: ['irancell'], kind: 'mobile', label: () => 'Irancell' },
  { keywords: ['mobile', 'lte', '5g'], kind: 'mobile', label: (i) => i.comment ?? i.name },
  { keywords: ['fiber', 'fibre'], kind: 'fiber', label: (i) => i.comment ?? i.name },
  {
    keywords: ['uplink', 'wan', 'isp'],
    kind: 'ether',
    label: (i) => i.comment ?? i.name.toUpperCase(),
  },
];

function matchUplink(iface: InterfaceResponse): UplinkMatch | null {
  const comment = (iface.comment ?? '').toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => comment.includes(k))) {
      return { kind: rule.kind, label: rule.label(iface) };
    }
  }
  return null;
}

function classify(iface: InterfaceResponse): UplinkMatch {
  return matchUplink(iface) ?? { kind: 'ether', label: iface.name.toUpperCase() };
}

export function wanInterfaces(interfaces: InterfaceResponse[]): InterfaceResponse[] {
  const ether = interfaces.filter((i) => i.type === 'ether' && !i.disabled);
  const hinted = ether.filter((i) => matchUplink(i) !== null);
  return hinted.length > 0 ? hinted : ether;
}

export function buildUplinks(
  interfaces: InterfaceResponse[],
  addresses: IpAddressResponse[],
): UplinkRow[] {
  const ether = interfaces.filter((i) => i.type === 'ether' && !i.disabled);
  const hinted = ether.filter((i) => matchUplink(i) !== null);
  const pool = hinted.length > 0 ? hinted : ether;
  return pool.map((iface) => {
    const { kind, label } = classify(iface);
    const ipAddresses = addresses
      .filter((a) => a.interface.toLowerCase() === iface.name.toLowerCase() && !a.disabled)
      .map((a) => a.address);
    return {
      ifaceName: iface.name,
      label,
      kind,
      ipAddresses,
      running: iface.running,
      disabled: !!iface.disabled,
    };
  });
}
