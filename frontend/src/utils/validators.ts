export const isIPv4 = (value: string): boolean => {
  const match = value.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  return match.slice(1).every((octet) => {
    const n = Number(octet);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
};

export const isCIDR = (value: string): boolean => {
  const [ip, prefix, ...rest] = value.trim().split('/');
  if (!ip || !prefix || rest.length > 0) return false;
  if (!isIPv4(ip)) return false;
  const p = Number(prefix);
  return Number.isInteger(p) && p >= 0 && p <= 32;
};

export const isPort = (value: number | string): boolean => {
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isInteger(n) && n > 0 && n < 65536;
};

export const isMAC = (value: string): boolean =>
  /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/.test(value.trim());

export const isWireGuardKey = (value: string): boolean => /^[A-Za-z0-9+/]{43}=$/.test(value.trim());

export const isSsid = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= 32;
};

export const isWifiPassword = (value: string): boolean => value.length >= 8 && value.length <= 63;

export const isRequired = (value: string | undefined | null): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const IDENTIFIER_RE = /^[A-Za-z0-9_-]+$/;
const HOSTNAME_RE =
  /^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$/;

export const isIdentifier = (value: string): boolean => {
  const v = value.trim();
  return v.length > 0 && v.length <= 64 && IDENTIFIER_RE.test(v);
};

export const isHostname = (value: string): boolean => HOSTNAME_RE.test(value.trim());

export const isHostOrIp = (value: string): boolean => {
  const v = value.trim();
  return isIPv4(v) || isHostname(v);
};

export function validateIdentifier(value: string): string | null {
  const v = value.trim();
  if (!isRequired(v)) return 'Name is required.';
  if (v.length > 64) return 'Name must be 64 characters or fewer.';
  if (!IDENTIFIER_RE.test(v)) return 'Use letters, digits, hyphens or underscores only.';
  return null;
}

export function validateHostOrIp(value: string): string | null {
  const v = value.trim();
  if (!isRequired(v)) return 'Host is required.';
  if (isIPv4(v) || isHostname(v)) return null;
  return 'Enter a valid IP address or hostname.';
}
