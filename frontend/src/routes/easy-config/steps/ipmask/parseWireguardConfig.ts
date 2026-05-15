export interface ParsedWireguardConfig {
  privateKey: string;
  address?: string;
  dns?: string;
  mtu?: string;
  peerPublicKey: string;
  endpoint: string;
  endpointPort: string;
  allowedIps: string;
  persistentKeepalive?: string;
}

function getSection(text: string, name: string): string | null {
  const re = new RegExp(`\\[${name}\\]([\\s\\S]*?)(?=\\n\\[|$)`, 'i');
  const match = text.match(re);
  return match ? match[1] : null;
}

function getField(section: string, key: string): string | undefined {
  const re = new RegExp(`^\\s*${key}\\s*=\\s*(.+)$`, 'im');
  const match = section.match(re);
  return match ? match[1].trim() : undefined;
}

export function parseWireguardConfig(text: string): ParsedWireguardConfig | null {
  const iface = getSection(text, 'Interface');
  const peer = getSection(text, 'Peer');
  if (!iface || !peer) return null;

  const privateKey = getField(iface, 'PrivateKey');
  const peerPublicKey = getField(peer, 'PublicKey');
  const endpointRaw = getField(peer, 'Endpoint');
  if (!privateKey || !peerPublicKey || !endpointRaw) return null;

  const lastColon = endpointRaw.lastIndexOf(':');
  const endpoint = lastColon > -1 ? endpointRaw.slice(0, lastColon) : endpointRaw;
  const endpointPort = lastColon > -1 ? endpointRaw.slice(lastColon + 1) : '51820';

  return {
    privateKey,
    address: getField(iface, 'Address'),
    dns: getField(iface, 'DNS'),
    mtu: getField(iface, 'MTU'),
    peerPublicKey,
    endpoint,
    endpointPort,
    allowedIps: getField(peer, 'AllowedIPs') ?? '0.0.0.0/0',
    persistentKeepalive: getField(peer, 'PersistentKeepalive'),
  };
}
