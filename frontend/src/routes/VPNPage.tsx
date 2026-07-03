import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Stack, useToast } from '@nasnet/ui';
import {
  ApiError,
  fetchVPNServersStatus,
  listVPNClients,
  type VPNClient,
  type VPNCredentials,
  type VPNPeer,
  type VPNProtocol,
  type VPNServer,
} from '../api';
import { useRouter } from '../state/RouterStoreContext';
import { useSession } from '../state/SessionContext';
import { usePolling } from '../utils/usePolling';
import { mapClientFromBE, mapServersStatusToList } from './vpn/adapters';
import { StatsStrip } from './vpn/StatsStrip';
import { ServersSection } from './vpn/sections/ServersSection';
// import { PeersSection } from './vpn/sections/PeersSection';
// TODO: re-enable PeersSection when /api/vpn/peers exists on the backend.

export function VPNPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const { getCredentials } = useSession();
  const toast = useToast();

  const [clients, setClients] = useState<VPNClient[]>([]);
  const [servers, setServers] = useState<VPNServer[]>([]);
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
      const [rawClients, serversStatus] = await Promise.all([
        listVPNClients(creds),
        fetchVPNServersStatus(creds),
      ]);
      setClients(rawClients.map((c) => mapClientFromBE(c, id)));
      setServers(mapServersStatusToList(serversStatus, id));
      setLoaded(true);
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
      <ServersSection creds={creds} servers={servers} onChanged={reload} />
      {/* <PeersSection routerId={id} peers={peers} servers={servers} onChanged={reload} /> */}
    </Stack>
  );
}
