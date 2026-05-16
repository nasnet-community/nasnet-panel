import type { InterfaceResponse, IpAddressResponse, RouteResponse } from '../../api';

export type UplinkKind = 'starlink' | 'mobile' | 'fiber' | 'ether';

export interface UplinkRow {
  ifaceName: string;
  label: string;
  kind: UplinkKind;
  ipAddresses: string[];
  running: boolean;
  disabled: boolean;
  isDefaultRoute: boolean;
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

function prefixOf(cidr: string): string {
  const ip = cidr.split('/')[0];
  return `${ip.split('.').slice(0, 3).join('.')}.`;
}

function defaultRouteInterface(
  routes: RouteResponse[],
  addresses: IpAddressResponse[],
): string | undefined {
  const def = routes.find((r) => r.dstAddress === '0.0.0.0/0' && r.active);
  if (!def) return undefined;
  if (def.interface) return def.interface.toLowerCase();
  const gw = def.gateway?.split('%')[0];
  if (!gw) return undefined;
  const match = addresses.find(
    (a) => a.address.split('/')[0] && gw.startsWith(prefixOf(a.address)),
  );
  return match?.interface.toLowerCase();
}

export function buildUplinks(
  interfaces: InterfaceResponse[],
  addresses: IpAddressResponse[],
  routes: RouteResponse[],
): UplinkRow[] {
  const ether = interfaces.filter((i) => i.type === 'ether' && !i.disabled);
  const hinted = ether.filter((i) => matchUplink(i) !== null);
  const pool = hinted.length > 0 ? hinted : ether;
  const defIface = defaultRouteInterface(routes, addresses);
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
      isDefaultRoute: defIface === iface.name.toLowerCase(),
    };
  });
}
