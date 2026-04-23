import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@nasnet/ui';
import {
  fetchWifiClients,
  fetchWifiInterfaces,
  fetchWifiPassphrase,
  updateWifiInterface,
  updateWifiPassphrase,
  type Interface,
  type WifiConnectedClientResponse,
  type WifiCredentials,
  type WifiInterfaceResponse,
  type WirelessBand,
  type WirelessClient,
  type WirelessSecurity,
  type WirelessSettings,
} from '../../api';
import { useRouter } from '../../state/RouterStoreContext';
import { useSession } from '../../state/SessionContext';

const toBand = (value: string | undefined): WirelessBand =>
  value && value.toLowerCase().startsWith('5') ? '5ghz' : '2.4ghz';

const toSecurity = (value: string | undefined): WirelessSecurity => {
  const v = (value ?? '').toLowerCase();
  if (v.includes('wpa3')) return 'WPA3-PSK';
  if (v === 'none' || v === 'open' || v === '') return 'open';
  return 'WPA2-PSK';
};

const parseNumber = (value: string | undefined): number => {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const bpsToKbps = (value: string | undefined): number => Math.round(parseNumber(value) / 1000);

const parseSecurityTypes = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const toInterface = (wi: WifiInterfaceResponse): Interface => ({
  name: wi.name || wi.interface,
  type: 'wireless',
  mac: wi.macAddress,
  running: wi.running && !wi.disabled,
  comment: wi.comment,
  ssid: wi.ssid,
  band: toBand(wi.band),
  securityTypes: parseSecurityTypes(wi.securityType),
});

const toWirelessClient = (c: WifiConnectedClientResponse): WirelessClient => ({
  mac: c.macAddress,
  hostname: c.macAddress,
  ip: '',
  signalDbm: parseNumber(c.signal),
  band: toBand(c.band),
  txKbps: bpsToKbps(c.txBitsPerSecond),
  rxKbps: bpsToKbps(c.rxBitsPerSecond),
  connectedFor: c.uptime,
});

const toSettings = (
  primary: WifiInterfaceResponse | undefined,
  passphrase: string,
): WirelessSettings | null => {
  if (!primary) return null;
  return {
    ssid: primary.ssid,
    password: passphrase,
    security: toSecurity(primary.securityType),
    band: toBand(primary.band),
    countryCode: '',
    hidden: false,
  };
};

export function useWireless(id: string | undefined) {
  const router = useRouter(id);
  const { getCredentials } = useSession();
  const [settings, setSettings] = useState<WirelessSettings | null>(null);
  const [interfaces, setInterfaces] = useState<Interface[]>([]);
  const [clients, setClients] = useState<WirelessClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIface, setEditingIface] = useState<Interface | null>(null);
  const [editingSettings, setEditingSettings] = useState<WirelessSettings | null>(null);
  const toast = useToast();

  const creds = useMemo<WifiCredentials | null>(() => {
    if (!id) return null;
    const c = getCredentials(id);
    const host = router?.host;
    if (!c || !host) return null;
    return { host, username: c.username, password: c.password };
  }, [id, router?.host, getCredentials]);

  const reload = useCallback(async () => {
    if (!creds) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [rawInterfaces, rawClients] = await Promise.all([
        fetchWifiInterfaces(creds),
        fetchWifiClients(creds).catch(() => [] as WifiConnectedClientResponse[]),
      ]);
      const primary = rawInterfaces.find((i) => i.running && !i.disabled) ?? rawInterfaces[0];
      let passphrase = primary?.passphrase ?? '';
      if (primary && !passphrase) {
        try {
          const p = await fetchWifiPassphrase(creds, primary.name || primary.interface);
          passphrase = p.passphrase;
        } catch {
          // passphrase unavailable — leave blank
        }
      }
      setInterfaces(rawInterfaces.map(toInterface));
      setClients(rawClients.map(toWirelessClient));
      setSettings(toSettings(primary, passphrase));
    } finally {
      setLoading(false);
    }
  }, [creds]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!creds) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const [rawInterfaces, rawClients] = await Promise.all([
          fetchWifiInterfaces(creds),
          fetchWifiClients(creds).catch(() => [] as WifiConnectedClientResponse[]),
        ]);
        if (cancelled) return;
        setInterfaces(rawInterfaces.map(toInterface));
        setClients(rawClients.map(toWirelessClient));
      } catch {
        // keep previous values on transient failures
      }
    };
    const interval = window.setInterval(() => {
      void tick();
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [creds]);

  const openEdit = useCallback(
    async (iface: Interface) => {
      let passphrase = '';
      if (creds) {
        try {
          const p = await fetchWifiPassphrase(creds, iface.name);
          passphrase = p.passphrase;
        } catch {
          // passphrase unavailable — leave blank
        }
      }
      setEditingIface(iface);
      setEditingSettings({
        ssid: iface.ssid ?? '',
        password: passphrase,
        security: toSecurity(iface.securityTypes?.join(',')),
        band: iface.band ?? '2.4ghz',
        countryCode: settings?.countryCode ?? '',
        hidden: false,
      });
    },
    [creds, settings?.countryCode],
  );

  const closeEdit = useCallback(() => {
    setEditingIface(null);
    setEditingSettings(null);
  }, []);

  const save = async (next: WirelessSettings) => {
    if (!creds || !editingIface) return;
    if (next.password && next.password !== editingSettings?.password) {
      await updateWifiPassphrase(creds, editingIface.name, next.password);
    }
    toast.notify({ title: 'Wireless settings saved', tone: 'success' });
    closeEdit();
  };

  const toggleInterface = async (ifaceName: string, running: boolean) => {
    if (!creds) return;
    await updateWifiInterface(creds, ifaceName, running);
    setInterfaces((prev) => prev.map((i) => (i.name === ifaceName ? { ...i, running } : i)));
    toast.notify({
      title: `${ifaceName} ${running ? 'enabled' : 'disabled'}`,
      tone: 'success',
    });
  };

  return {
    settings,
    interfaces,
    clients,
    loading,
    editingIface,
    editingSettings,
    openEdit,
    closeEdit,
    reload,
    save,
    toggleInterface,
  };
}
