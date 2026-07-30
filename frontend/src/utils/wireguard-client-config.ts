export interface WireguardClientConfigInput {
  privateKey: string;
  address?: string;
  dns?: string;
  serverPublicKey: string;
  presharedKey?: string;
  allowedIps?: string;
  endpoint?: string;
  persistentKeepalive?: string;
}

export function buildWireguardClientConfig(input: WireguardClientConfigInput): string {
  const iface = ['[Interface]', `PrivateKey = ${input.privateKey}`];
  if (input.address?.trim()) iface.push(`Address = ${input.address.trim()}`);
  if (input.dns?.trim()) iface.push(`DNS = ${input.dns.trim()}`);

  const peer = ['[Peer]', `PublicKey = ${input.serverPublicKey}`];
  if (input.presharedKey?.trim()) peer.push(`PresharedKey = ${input.presharedKey.trim()}`);
  peer.push(`AllowedIPs = ${input.allowedIps?.trim() || '0.0.0.0/0'}`);
  if (input.endpoint?.trim()) peer.push(`Endpoint = ${input.endpoint.trim()}`);
  if (input.persistentKeepalive?.trim())
    peer.push(`PersistentKeepalive = ${input.persistentKeepalive.trim()}`);

  return `${iface.join('\n')}\n\n${peer.join('\n')}\n`;
}

export function wireguardConfigFilename(peerName: string): string {
  const base = peerName.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'wireguard';
  return `${base.slice(0, 60)}.conf`;
}
