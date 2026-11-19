import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '@nasnet/ui';
import {
  ApiError,
  fetchInterfaces,
  fetchWans,
  listVPNClients,
  type InterfaceResponse,
  type SystemCredentials,
  type VPNClient,
  type WanResponse,
} from '../api';
import { useSession } from '../state/SessionContext';
import { useRouter } from '../state/RouterStoreContext';
import { usePolling } from '../utils/usePolling';
import styles from './wan/WanPage.module.scss';
import { WanSection } from './wan/sections/WanSection';
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
  const { t } = useTranslation('internet');
  const { getCredentials } = useSession();
  const router = useRouter(id);

  const [interfaces, setInterfaces] = useState<InterfaceResponse[]>([]);
  const [interfacesLoading, setInterfacesLoading] = useState(false);
  const [wans, setWans] = useState<WanResponse[]>([]);
  const [wansLoading, setWansLoading] = useState(false);
  const [wansError, setWansError] = useState<string | null>(null);
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

  const loadInterfaces = useCallback(
    async (silent = false) => {
      const creds = resolveCreds();
      if (!creds) {
        setInterfaces([]);
        return;
      }
      if (!silent) setInterfacesLoading(true);
      try {
        const list = await fetchInterfaces(creds);
        setInterfaces(list.filter((i) => WAN_INTERFACE_TYPES.includes(i.type)));
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : t('wan.loadInterfacesFailedFallback');
        toast.notify({
          title: t('wan.loadInterfacesFailedTitle'),
          description: message,
          tone: 'danger',
        });
      } finally {
        if (!silent) setInterfacesLoading(false);
      }
    },
    [resolveCreds, toast, t],
  );

  const loadWans = useCallback(
    async (silent = false) => {
      const creds = resolveCreds();
      if (!creds) {
        setWans([]);
        return;
      }
      if (!silent) setWansLoading(true);
      try {
        setWans(await fetchWans(creds));
        setWansError(null);
      } catch (err) {
        setWansError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : t('wan.loadWansFailedFallback'),
        );
      } finally {
        if (!silent) setWansLoading(false);
      }
    },
    [resolveCreds, t],
  );

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
            : t('wan.loadVpnFailedFallback');
      toast.notify({ title: t('wan.loadVpnFailedTitle'), description: message, tone: 'danger' });
    }
  }, [id, resolveCreds, toast, t]);

  const reloadAfterWanChange = useCallback(async () => {
    void loadVpn();
    await sleep(WAN_REFRESH_DELAY_MS);
    await Promise.all([loadInterfaces(true), loadWans(true)]);
  }, [loadVpn, loadInterfaces, loadWans]);

  useEffect(() => {
    void loadInterfaces();
  }, [loadInterfaces]);

  useEffect(() => {
    void loadWans();
  }, [loadWans]);

  usePolling(loadVpn, 5000, !!id && !vpnDialogOpen);

  if (!id) return null;

  const foreign = wans.filter((w) => w.wanType === 'foreign');
  const domestic = wans.filter((w) => w.wanType === 'domestic');
  const foreignNames = foreign.map((w) => w.interface);
  const domesticNames = domestic.map((w) => w.interface);

  return (
    <div className={styles.sectionGrid}>
      <WanSection
        variant="foreign"
        routerId={id}
        items={foreign}
        itemsLoading={wansLoading}
        itemsError={wansError}
        interfaces={interfaces}
        otherNames={domesticNames}
        interfacesLoading={interfacesLoading}
        onChanged={reloadAfterWanChange}
      />
      <WanSection
        variant="domestic"
        routerId={id}
        items={domestic}
        itemsLoading={wansLoading}
        itemsError={wansError}
        interfaces={interfaces}
        otherNames={foreignNames}
        interfacesLoading={interfacesLoading}
        onChanged={reloadAfterWanChange}
      />
      <ClientsSection
        creds={vpnCreds}
        clients={vpnClients}
        onChanged={loadVpn}
        onClientUpdated={(updated) =>
          setVpnClients((list) => list.map((c) => (c.id === updated.id ? updated : c)))
        }
        onDialogOpenChange={setVpnDialogOpen}
      />
    </div>
  );
}
