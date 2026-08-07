import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@nasnet/ui';
import {
  ApiError,
  fetchInterfaces,
  listVPNClients,
  type InterfaceResponse,
  type SystemCredentials,
  type VPNClient,
} from '../api';
import { useSession } from '../state/SessionContext';
import { useRouter } from '../state/RouterStoreContext';
import { usePolling } from '../utils/usePolling';
import styles from './wan/WanPage.module.scss';
import { StarlinkSection } from './wan/sections/StarlinkSection';
import { DomesticUplinkSection } from './wan/sections/DomesticUplinkSection';
import { matchesWanCategory } from './wan/types';
import { mapClientFromBE } from './vpn/adapters';
import { ClientsSection } from './vpn/sections/ClientsSection';

const WAN_INTERFACE_TYPES = ['ether', 'wireless', 'wifi', 'wlan', 'w60g', 'lte'];
const WAN_REFRESH_DELAY_MS = 3000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export function WanPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { getCredentials } = useSession();
  const router = useRouter(id);

  const [interfaces, setInterfaces] = useState<InterfaceResponse[]>([]);
  const [interfacesLoading, setInterfacesLoading] = useState(false);
  const [vpnClients, setVpnClients] = useState<VPNClient[]>([]);
  const [vpnDialogOpen, setVpnDialogOpen] = useState(false);

  const resolveCreds = useCallback((): SystemCredentials | null => {
    if (!id) return null;
    const creds = getCredentials(id);
    const host = router?.host;
    if (!creds || !host) return null;
    return { host, ...creds };
  }, [id, router?.host, getCredentials]);

  const vpnCreds = useMemo(() => resolveCreds(), [resolveCreds]);

  const loadInterfaces = useCallback(async () => {
    const creds = resolveCreds();
    if (!creds) {
      setInterfaces([]);
      return;
    }
    setInterfacesLoading(true);
    try {
      const list = await fetchInterfaces(creds);
      setInterfaces(list.filter((i) => WAN_INTERFACE_TYPES.includes(i.type)));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load interfaces.';
      toast.notify({ title: 'Failed to load interfaces', description: message, tone: 'danger' });
    } finally {
      setInterfacesLoading(false);
    }
  }, [resolveCreds, toast]);

  const loadVpn = useCallback(async () => {
    const creds = resolveCreds();
    if (!id || !creds) {
      setVpnClients([]);
      return;
    }
    try {
      const list = await listVPNClients(creds);
      setVpnClients(list.map((c) => mapClientFromBE(c, id)));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load VPN clients.';
      toast.notify({ title: 'Failed to load VPN', description: message, tone: 'danger' });
    }
  }, [id, resolveCreds, toast]);

  const reloadAfterWanChange = useCallback(async () => {
    void loadVpn();
    await sleep(WAN_REFRESH_DELAY_MS);
    await loadInterfaces();
  }, [loadVpn, loadInterfaces]);

  useEffect(() => {
    void loadInterfaces();
  }, [loadInterfaces]);

  usePolling(loadVpn, 5000, !!id && !vpnDialogOpen);

  if (!id) return null;

  const foreign = interfaces.filter((i) => matchesWanCategory(i.comment, 'foreign'));
  const domestic = interfaces.filter((i) => matchesWanCategory(i.comment, 'domestic'));
  const assignedNames = [...foreign, ...domestic].map((i) => i.name);

  return (
    <div className={styles.sectionGrid}>
      <StarlinkSection
        routerId={id}
        items={foreign}
        interfaces={interfaces}
        excludeNames={assignedNames}
        interfacesLoading={interfacesLoading}
        onChanged={reloadAfterWanChange}
      />
      <DomesticUplinkSection
        routerId={id}
        items={domestic}
        interfaces={interfaces}
        excludeNames={assignedNames}
        interfacesLoading={interfacesLoading}
        onChanged={reloadAfterWanChange}
      />
      <ClientsSection
        creds={vpnCreds}
        clients={vpnClients}
        onChanged={loadVpn}
        onDialogOpenChange={setVpnDialogOpen}
      />
    </div>
  );
}
