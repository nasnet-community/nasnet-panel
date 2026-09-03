import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Stack, useToast } from '@nasnet/ui';
import {
  ApiError,
  fetchVPNServersStatus,
  fetchWireguardPeers,
  listVPNClients,
  listVPNUsers,
  type VPNClient,
  type VPNCredentials,
  type VPNPeer,
  type VPNProtocol,
  type VPNServer,
  type VPNUserResponse,
} from '../api';
import { useRouter } from '../state/RouterStoreContext';
import { useSession } from '../state/SessionContext';
import { usePolling } from '../utils/usePolling';
import { mapClientFromBE, mapServersStatusToList } from './vpn/adapters';
import { StatsStrip } from './vpn/StatsStrip';
import { ServersSection } from './vpn/sections/ServersSection';
import { UsersSection } from './vpn/sections/UsersSection';
// import { PeersSection } from './vpn/sections/PeersSection';
// TODO: re-enable PeersSection when /api/vpn/peers exists on the backend.

export function VPNPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const { getCredentials } = useSession();
  const toast = useToast();

  const [clients, setClients] = useState<VPNClient[]>([]);
  const [servers, setServers] = useState<VPNServer[]>([]);
  const [users, setUsers] = useState<VPNUserResponse[]>([]);
  const [peerCounts, setPeerCounts] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const peers: VPNPeer[] = [];

  const creds = useMemo<VPNCredentials | null>(() => {
    if (!id) return null;
    const c = getCredentials(id);
    const host = router?.host;
    if (!c || !host) return null;
    return { host, username: c.username, password: c.password };
  }, [id, router?.host, getCredentials]);

  const reload = useCallback(async () => {
    if (!id || !creds) return;
    try {
      const [rawClients, serversStatus, rawUsers] = await Promise.all([
        listVPNClients(creds),
        fetchVPNServersStatus(creds),
        listVPNUsers(creds),
      ]);
      const mappedServers = mapServersStatusToList(serversStatus, id);
      setClients(rawClients.map((c) => mapClientFromBE(c, id)));
      setServers(mappedServers);
      setUsers(rawUsers);
      setLoaded(true);
      const counted = await Promise.all(
        mappedServers
          .filter((s) => s.protocol === 'wireguard')
          .map(async (s): Promise<[string, number] | null> => {
            try {
              const wgPeers = await fetchWireguardPeers(creds, s.name);
              return [s.id, wgPeers.length];
            } catch {
              return null;
            }
          }),
      );
      setPeerCounts((prev) => {
        const next = { ...prev };
        for (const entry of counted) {
          if (entry) next[entry[0]] = entry[1];
        }
        return next;
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load VPN data.';
      toast.notify({ title: 'Failed to load VPN', description: message, tone: 'danger' });
    }
  }, [id, creds, toast]);

  usePolling(reload, 5000, !!creds);

  const protocols = useMemo(() => {
    const set = new Set<VPNProtocol>();
    clients.forEach((c) => set.add(c.protocol));
    servers.forEach((s) => set.add(s.protocol));
    return [...set];
  }, [clients, servers]);

  if (!id) return null;

  return (
    <Stack>
      <StatsStrip
        clients={clients}
        servers={servers}
        peers={peers}
        protocols={protocols}
        loading={!loaded}
      />
      <ServersSection creds={creds} servers={servers} peerCounts={peerCounts} onChanged={reload} />
      <UsersSection creds={creds} users={users} onChanged={reload} />
      {/* <PeersSection routerId={id} peers={peers} servers={servers} onChanged={reload} /> */}
    </Stack>
  );
}
