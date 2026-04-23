import { simulateLatency } from '../simulate-latency';
import type { AddRouterInput, Router, RouterInfo } from '../types';
import { clone, commit, nextId, state } from './store';

export const routers = {
  async list(): Promise<Router[]> {
    await simulateLatency();
    return clone(state.current.routers);
  },
  async get(id: string): Promise<Router | undefined> {
    await simulateLatency(50, 150);
    return clone(state.current.routers.find((r) => r.id === id));
  },
  async add(input: AddRouterInput): Promise<Router> {
    await simulateLatency();
    const store = state.current;
    const id = nextId('rtr');
    const router: Router = {
      id,
      name: input.name || `Router ${store.routers.length + 1}`,
      host: input.host,
      port: input.port,
      platform: 'mikrotik',
      model: 'RB5009UG+S+IN',
      version: '7.14',
      status: 'online',
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    store.routers.push(router);
    store.interfaces[id] = [
      { name: 'ether1', type: 'ether', mac: '00:00:00:00:00:01', running: true },
      { name: 'ether2', type: 'ether', mac: '00:00:00:00:00:02', running: true },
      { name: 'ether3', type: 'ether', mac: '00:00:00:00:00:03', running: false },
      { name: 'bridge1', type: 'bridge', mac: '00:00:00:00:00:0B', running: true },
      { name: 'wlan1', type: 'wireless', mac: '00:00:00:00:00:0C', running: true },
    ];
    store.routerUsers.push({
      id: nextId('usr'),
      routerId: id,
      name: 'admin',
      group: 'full',
      disabled: false,
    });
    store.firmware[id] = {
      routerId: id,
      currentChannel: 'stable',
      currentVersion: '7.14',
      latestVersion: '7.14',
      updateAvailable: false,
    };
    const now = Date.now();
    (['system', 'interface', 'dhcp', 'firewall', 'wireless'] as const).forEach((topic, i) => {
      store.logs.push({
        id: `log_new_${id}_${i}`,
        routerId: id,
        ts: new Date(now - i * 15_000).toISOString(),
        level: 'info',
        topic,
        message: `${topic} initialised on ${router.name}`,
      });
    });
    commit();
    return clone(router);
  },
  async remove(id: string): Promise<void> {
    await simulateLatency();
    state.current.routers = state.current.routers.filter((r) => r.id !== id);
    commit();
  },
  async markConfigurationApplied(id: string): Promise<Router | undefined> {
    await simulateLatency(50, 150);
    const router = state.current.routers.find((r) => r.id === id);
    if (!router) return undefined;
    router.configurationAppliedAt = new Date().toISOString();
    commit();
    return clone(router);
  },
  async testCredentials(input: {
    host: string;
    username: string;
    password: string;
  }): Promise<RouterInfo> {
    await simulateLatency();
    if (!input.username || !input.password) {
      throw new Error('Username and password are required');
    }
    return {
      model: 'RB5009UG+S+IN',
      version: '7.14',
      cpuLoad: 12,
      uptime: '3d 4h 21m',
    };
  },
};
