export interface WirelessNetwork {
  ssid: string;
  signal: number;
  security: 'open' | 'wpa2' | 'wpa3';
  band: '2.4ghz' | '5ghz';
}

const NETWORKS: WirelessNetwork[] = [
  { ssid: 'NasNet-Home', signal: 92, security: 'wpa3', band: '5ghz' },
  { ssid: 'NasNet-Home-2.4', signal: 88, security: 'wpa3', band: '2.4ghz' },
  { ssid: 'Neighbor-WiFi', signal: 64, security: 'wpa2', band: '5ghz' },
  { ssid: 'Coffee-Guest', signal: 48, security: 'open', band: '2.4ghz' },
  { ssid: 'TPLink-2EF1', signal: 41, security: 'wpa2', band: '2.4ghz' },
  { ssid: 'ASUS-Office', signal: 34, security: 'wpa3', band: '5ghz' },
];

export async function scanWirelessNetworks(): Promise<WirelessNetwork[]> {
  await new Promise((r) => setTimeout(r, 600));
  return [...NETWORKS].sort((a, b) => b.signal - a.signal);
}

export async function verifyWirelessPassword(
  _ssid: string,
  password: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  await new Promise((r) => setTimeout(r, 600));
  if (password.length < 8) {
    return { ok: false, reason: 'Password must be at least 8 characters.' };
  }
  return { ok: true };
}
