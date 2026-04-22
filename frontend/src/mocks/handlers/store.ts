import { seededInterfaces } from '../fixtures/interfaces';
import { seededWireless } from '../fixtures/wireless-settings';
import { seededWirelessClients } from '../fixtures/wireless-clients';
import { seededVPNClients, seededVPNServers, seededVPNPeers } from '../fixtures/vpn';
import { seededRouterUsers } from '../fixtures/router-users';
import { seededAppUpdate, seededFirmwareUpdates } from '../fixtures/update-info';
import { seededLogs } from '../fixtures/logs';
import type {
  AppUpdateInfo,
  FirmwareUpdateInfo,
  Interface,
  LogEntry,
  LogLevel,
  Router,
  RouterUser,
  VPNClient,
  VPNPeer,
  VPNServer,
  WirelessClient,
  WirelessSettings,
} from '../types';

export interface Store {
  routers: Router[];
  interfaces: Record<string, Interface[]>;
  wireless: Record<string, WirelessSettings>;
  wirelessClients: Record<string, WirelessClient[]>;
  vpnClients: VPNClient[];
  vpnServers: VPNServer[];
  vpnPeers: VPNPeer[];
  routerUsers: RouterUser[];
  appUpdate: AppUpdateInfo;
  firmware: Record<string, FirmwareUpdateInfo>;
  logs: LogEntry[];
  idCounter: number;
}

const STORAGE_KEY = 'nasnet-panel.mock-store.v3';

const createStore = (): Store => ({
  routers: [],
  interfaces: seededInterfaces(),
  wireless: seededWireless(),
  wirelessClients: seededWirelessClients(),
  vpnClients: seededVPNClients(),
  vpnServers: seededVPNServers(),
  vpnPeers: seededVPNPeers(),
  routerUsers: seededRouterUsers(),
  appUpdate: seededAppUpdate(),
  firmware: seededFirmwareUpdates(),
  logs: seededLogs(),
  idCounter: 1,
});

const loadStore = (): Store => {
  if (typeof window === 'undefined') return createStore();
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return createStore();
    return JSON.parse(raw) as Store;
  } catch {
    return createStore();
  }
};

const persistStore = (next: Store): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
};

export const state = { current: loadStore() };

export const commit = (): void => persistStore(state.current);

export const nextId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${state.current.idCounter++}`;

export const clone = <T>(value: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);

export function ipFromSubnet(subnet: string, ip: string): string {
  const cidrParts = subnet.split('/');
  const base = cidrParts[0];
  const baseOctets = base.split('.');
  const ipOctets = ip.split('.');
  if (baseOctets.length === 4 && ipOctets.length === 4) {
    return `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${ipOctets[3]}`;
  }
  return ip;
}

export const mockStore = {
  reset(): void {
    state.current = createStore();
    commit();
  },
  seedEmpty(): void {
    state.current = createStore();
    state.current.routers = [];
    state.current.routerUsers = [];
    state.current.vpnClients = [];
    state.current.vpnServers = [];
    state.current.vpnPeers = [];
    commit();
  },
  seedRouter(router: Partial<Router> & Pick<Router, 'id'>): Router {
    const store = state.current;
    const defaults: Router = {
      id: router.id,
      name: router.name ?? 'Seeded Router',
      host: router.host ?? '192.168.99.1',
      port: router.port ?? 443,
      platform: router.platform ?? 'mikrotik',
      model: router.model ?? 'hAP ax3',
      version: router.version ?? '7.13.2',
      status: router.status ?? 'online',
      lastSeen: router.lastSeen,
      createdAt: router.createdAt ?? new Date().toISOString(),
      configurationAppliedAt: router.configurationAppliedAt,
    };
    store.routers = store.routers.filter((r) => r.id !== defaults.id);
    store.routers.push(defaults);
    if (!store.interfaces[defaults.id]) {
      store.interfaces[defaults.id] = [
        { name: 'ether1', type: 'ether', mac: 'AA:AA:AA:AA:AA:01', running: true },
        { name: 'ether2', type: 'ether', mac: 'AA:AA:AA:AA:AA:02', running: true },
        { name: 'wlan1', type: 'wireless', mac: 'AA:AA:AA:AA:AA:0C', running: true },
      ];
    }
    if (!store.wireless[defaults.id]) {
      store.wireless[defaults.id] = {
        ssid: 'Seeded-SSID',
        password: 'seededpass',
        security: 'WPA2-PSK',
        band: '5ghz',
        countryCode: 'US',
        hidden: false,
      };
    }
    if (!store.routerUsers.some((u) => u.routerId === defaults.id)) {
      store.routerUsers.push({
        id: `usr_admin_${defaults.id}`,
        routerId: defaults.id,
        name: 'admin',
        group: 'full',
        disabled: false,
      });
    }
    if (!store.firmware[defaults.id]) {
      store.firmware[defaults.id] = {
        routerId: defaults.id,
        currentChannel: 'stable',
        currentVersion: defaults.version ?? '7.13',
        latestVersion: '7.14',
        updateAvailable: true,
      };
    }
    if (!store.logs.some((l) => l.routerId === defaults.id)) {
      const now = Date.now();
      const sampleMessages: Array<{ level: LogLevel; topic: string; message: string }> = [
        { level: 'info', topic: 'system', message: 'router added to Nasnet Panel' },
        { level: 'info', topic: 'interface', message: 'interface ether1 link up' },
        { level: 'info', topic: 'dhcp', message: 'DHCP lease 192.168.88.2 assigned' },
        { level: 'warning', topic: 'firewall', message: 'dropping invalid packet' },
        { level: 'error', topic: 'pppoe', message: 'PPPoE authentication failed' },
        { level: 'info', topic: 'wireless', message: 'wireless client associated' },
      ];
      sampleMessages.forEach((entry, i) => {
        store.logs.push({
          id: `log_seed_${defaults.id}_${i}`,
          routerId: defaults.id,
          ts: new Date(now - i * 30_000).toISOString(),
          level: entry.level,
          topic: entry.topic,
          message: entry.message,
        });
      });
    }
    commit();
    return clone(defaults);
  },
};
