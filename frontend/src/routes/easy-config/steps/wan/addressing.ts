import { isIPv4 } from '../../../../utils/validators';
import type { WanInterfaceType } from '../../../../api';

// Mirrors iface.ResolveWANAddressing on the backend: a bare address gets the
// per-link default prefix, and an empty gateway means the first host of the network.
const DEFAULT_PREFIX: Record<WanInterfaceType, number> = { foreign: 10, domestic: 24 };
const MAX_PREFIX = 30;

export type WanIpMode = 'dhcp' | 'static';

export type WanAddressingProblem =
  | 'wanIpRequired'
  | 'wanIpInvalid'
  | 'wanIpPrefixRange'
  | 'wanIpNotHost'
  | 'wanGatewayInvalid'
  | 'wanGatewayOutside'
  | 'wanGatewaySameAsIp'
  | 'wanGatewayRequired';

export const WAN_IP_PLACEHOLDER: Record<WanInterfaceType, string> = {
  foreign: '100.64.0.2/10',
  domestic: '192.168.1.2/24',
};

const toInt = (ip: string): number =>
  ip
    .trim()
    .split('.')
    .reduce((acc, octet) => ((acc << 8) | Number(octet)) >>> 0, 0);

const toIp = (n: number): string => [24, 16, 8, 0].map((shift) => (n >>> shift) & 255).join('.');

const maskOf = (prefix: number): number => (prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0);

interface ParsedAddress {
  address: number;
  prefix: number;
}

function parseStaticIp(
  raw: string,
  wanType: WanInterfaceType,
): ParsedAddress | WanAddressingProblem {
  const value = raw.trim();
  if (!value) return 'wanIpRequired';
  const parts = value.split('/');
  if (parts.length > 2 || !isIPv4(parts[0] ?? '')) return 'wanIpInvalid';
  let prefix = DEFAULT_PREFIX[wanType];
  if (parts.length === 2) {
    const text = parts[1] ?? '';
    if (!/^\d{1,2}$/.test(text)) return 'wanIpInvalid';
    prefix = Number(text);
    if (prefix < 1 || prefix > MAX_PREFIX) return 'wanIpPrefixRange';
  }
  return { address: toInt(parts[0] ?? ''), prefix };
}

export function wanStaticIpProblem(
  raw: string,
  wanType: WanInterfaceType,
): WanAddressingProblem | null {
  const parsed = parseStaticIp(raw, wanType);
  if (typeof parsed === 'string') return parsed;
  const mask = maskOf(parsed.prefix);
  const network = (parsed.address & mask) >>> 0;
  const broadcast = (network | ~mask) >>> 0;
  if (parsed.address === network || parsed.address === broadcast) return 'wanIpNotHost';
  return null;
}

/** The gateway the backend uses when none is given, or null when the ip is not valid. */
export function defaultWanGateway(raw: string, wanType: WanInterfaceType): string | null {
  const parsed = parseStaticIp(raw, wanType);
  if (typeof parsed === 'string') return null;
  const network = (parsed.address & maskOf(parsed.prefix)) >>> 0;
  return toIp(network + 1);
}

export function wanGatewayProblem(
  rawIp: string,
  rawGateway: string,
  wanType: WanInterfaceType,
): WanAddressingProblem | null {
  const parsed = parseStaticIp(rawIp, wanType);
  const gateway = rawGateway.trim();
  if (typeof parsed === 'string') {
    return gateway && !isIPv4(gateway) ? 'wanGatewayInvalid' : null;
  }
  const mask = maskOf(parsed.prefix);
  const network = (parsed.address & mask) >>> 0;
  if (!gateway) {
    return network + 1 === parsed.address ? 'wanGatewayRequired' : null;
  }
  if (!isIPv4(gateway)) return 'wanGatewayInvalid';
  const value = toInt(gateway);
  if ((value & mask) >>> 0 !== network) return 'wanGatewayOutside';
  if (value === parsed.address) return 'wanGatewaySameAsIp';
  return null;
}

export function wanAddressingProblem(
  mode: WanIpMode,
  ip: string,
  gateway: string,
  wanType: WanInterfaceType,
): WanAddressingProblem | null {
  if (mode !== 'static') return null;
  return wanStaticIpProblem(ip, wanType) ?? wanGatewayProblem(ip, gateway, wanType);
}

/** The ip and gateway fields of a WAN request. DHCP sends neither. */
export function wanAddressingPayload(
  mode: WanIpMode,
  ip: string,
  gateway: string,
): { ip?: string; gateway?: string } {
  if (mode !== 'static') return {};
  const trimmedGateway = gateway.trim();
  return { ip: ip.trim(), ...(trimmedGateway ? { gateway: trimmedGateway } : {}) };
}
