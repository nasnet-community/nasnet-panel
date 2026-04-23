import { test as base } from '@playwright/test';
import type { Router } from '../../packages/mocks/src/types';

export interface SeedInput extends Partial<Router> {
  id: string;
}

export interface ScanMockDevice {
  ip: string;
  hostname?: string;
  vendor?: string;
  type?: string;
  ports?: number[];
  services?: string[];
}

export interface OverviewBackendRouter {
  id?: string;
  model?: string;
  version?: string;
}

export interface WifiBackendRouter {
  id?: string;
  ssid?: string;
  passphrase?: string;
  interfaceName?: string;
}

export interface LogsBackendOptions {
  id?: string;
}

export interface DhcpBackendOptions {
  id?: string;
}

export interface TestFixtures {
  resetMocks: () => Promise<void>;
  seedRouter: (input: SeedInput) => Promise<void>;
  mockBackendScan: (devices?: ScanMockDevice[]) => Promise<void>;
  mockOverviewBackend: (router?: OverviewBackendRouter) => Promise<void>;
  mockWifiBackend: (router?: WifiBackendRouter) => Promise<void>;
  mockLogsBackend: (options?: LogsBackendOptions) => Promise<void>;
  mockDhcpBackend: (options?: DhcpBackendOptions) => Promise<void>;
}

export const test = base.extend<TestFixtures>({
  resetMocks: async ({ context }, use) => {
    await use(async () => {
      await context.addInitScript(() => {
        try {
          if (window.localStorage.getItem('nasnet-panel.test.reset-done') === 'yes') {
            return;
          }
          window.localStorage.removeItem('nasnet-panel.router-store.v1');
          window.sessionStorage.removeItem('nasnet-panel.mock-store.v1');
          window.localStorage.setItem('nasnet-panel.test.reset-done', 'yes');
        } catch {
          /* ignore */
        }
        window.__SEED_EMPTY__ = true;
        window.__PENDING_SEEDS__ = [];
      });
    });
  },
  seedRouter: async ({ context }, use) => {
    await use(async (input) => {
      await context.addInitScript((seed) => {
        window.__PENDING_SEEDS__ = window.__PENDING_SEEDS__ ?? [];
        window.__PENDING_SEEDS__.push(seed);
      }, input);
    });
  },
  mockBackendScan: async ({ context }, use) => {
    await use(async (devices = []) => {
      const defaults: Required<ScanMockDevice> = {
        ip: '',
        hostname: undefined as unknown as string,
        vendor: 'MikroTik',
        type: 'router',
        ports: [8728, 8729],
        services: ['api', 'api-ssl'],
      };
      const results = devices.map((d) => ({ ...defaults, ...d }));

      const envelope = <T>(data: T, status = 200) =>
        JSON.stringify({ status, message: 'OK', data });

      await context.route('**/api/scan', async (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ task_id: 'test-task', status: 'running' }),
        });
      });
      await context.route('**/api/scan/status**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({
            taskId: 'test-task',
            subnet: '192.168.1.0/24',
            status: 'completed',
            progress: 100,
            startTime: Date.now(),
            results,
          }),
        });
      });
      await context.route('**/api/scan/verify', async (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        const body = route.request().postDataJSON() as { ip?: string } | null;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({
            ip: body?.ip ?? '0.0.0.0',
            hostname: 'test-router',
            isOnline: true,
            isMikroTik: true,
            ports: [8728, 8729],
            services: ['api', 'api-ssl'],
            routerOs: { version: '7.14', boardName: 'RB5009UG+S+IN', confidence: 0.95 },
          }),
        });
      });
      await context.route('**/api/system/info', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({
            model: 'RB5009UG+S+IN',
            version: '7.14',
            cpuLoad: 12,
            uptime: '3d 4h 21m',
          }),
        });
      });
    });
  },
  mockOverviewBackend: async ({ context }, use) => {
    await use(async (router = {}) => {
      const model = router.model ?? 'hAP ax3';
      const version = router.version ?? '7.14';

      if (router.id) {
        await context.addInitScript((routerId) => {
          try {
            const key = 'nasnet-panel.session-credentials.v1';
            const raw = window.sessionStorage.getItem(key);
            const map = (raw ? JSON.parse(raw) : {}) as Record<
              string,
              { username: string; password: string }
            >;
            map[routerId] = { username: 'admin', password: 'test' };
            window.sessionStorage.setItem(key, JSON.stringify(map));
          } catch {
            /* ignore */
          }
        }, router.id);
      }

      const envelope = <T>(data: T, status = 200) =>
        JSON.stringify({ status, message: 'OK', data });

      await context.route('**/api/system/info', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({
            model,
            cpuLoad: 12,
            uptime: '3d 4h 21m',
            identity: 'MikroTik',
            architecture: 'arm64',
            boardName: model,
            version,
            buildTime: 'Jan/10/2026 15:30:00',
            license: 'L4',
            updateChannel: 'stable',
          }),
        });
      });

      await context.route('**/api/system/resources', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({
            uptime: '3d 4h 21m',
            cpuCount: 4,
            cpuLoad: 12,
            cpuFrequency: '1400MHz',
            memoryTotal: '1.00 GB',
            memoryUsed: '256.00 MB',
            memoryFree: '768.00 MB',
            memoryTotalBytes: 1024 ** 3,
            memoryUsedBytes: 256 * 1024 ** 2,
            memoryFreeBytes: 768 * 1024 ** 2,
            hddTotal: '128.00 MB',
            hddFree: '96.00 MB',
            hddTotalBytes: 128 * 1024 ** 2,
            hddFreeBytes: 96 * 1024 ** 2,
            badBlocks: '0',
            version,
            architecture: 'arm64',
            boardName: model,
          }),
        });
      });

      await context.route('**/api/dhcp/leases', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope([]),
        });
      });

      await context.route('**/api/interfaces', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope([
            { id: '*1', name: 'ether1', type: 'ether', running: true, disabled: false },
          ]),
        });
      });

      await context.route('**/api/interfaces/*/traffic', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({
            name: 'ether1',
            rxBitsPerSecond: 1_000_000,
            txBitsPerSecond: 500_000,
            rxPacketsPerSecond: 100,
            txPacketsPerSecond: 50,
          }),
        });
      });

      await context.route('**/api/vpn/clients', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope([]),
        });
      });
    });
  },
  mockWifiBackend: async ({ context }, use) => {
    await use(async (router = {}) => {
      const interfaceName = router.interfaceName ?? 'wifi1';
      const ssid = router.ssid ?? 'Seeded-SSID';
      let passphrase = router.passphrase ?? 'seededpass';

      if (router.id) {
        await context.addInitScript((routerId) => {
          try {
            const key = 'nasnet-panel.session-credentials.v1';
            const raw = window.sessionStorage.getItem(key);
            const map = (raw ? JSON.parse(raw) : {}) as Record<
              string,
              { username: string; password: string }
            >;
            map[routerId] = { username: 'admin', password: 'test' };
            window.sessionStorage.setItem(key, JSON.stringify(map));
          } catch {
            /* ignore */
          }
        }, router.id);
      }

      const envelope = <T>(data: T, status = 200) =>
        JSON.stringify({ status, message: 'OK', data });

      await context.route('**/api/wifi/interfaces', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope([
            {
              id: '*1',
              name: interfaceName,
              interface: interfaceName,
              ssid,
              frequency: '5180',
              channelWidth: '20/40/80mhz-XXXX',
              macAddress: 'AA:BB:CC:DD:EE:01',
              disabled: false,
              running: true,
              inactive: false,
              mode: 'ap',
              band: '5ghz-ac',
              securityType: 'wpa2-psk',
              comment: '',
            },
          ]),
        });
      });

      await context.route('**/api/wifi/interfaces/*', async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: envelope({ ok: true }),
          });
          return;
        }
        await route.fallback();
      });

      await context.route('**/api/wifi/clients', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope([]),
        });
      });

      await context.route('**/api/wifi/passphrase/*', async (route) => {
        const method = route.request().method();
        if (method === 'PUT') {
          const body = route.request().postDataJSON() as { passphrase?: string } | null;
          if (body?.passphrase) passphrase = body.passphrase;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: envelope({ ok: true }),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ interfaceName, passphrase }),
        });
      });
    });
  },
  mockLogsBackend: async ({ context }, use) => {
    await use(async (options = {}) => {
      if (options.id) {
        await context.addInitScript((routerId) => {
          try {
            const key = 'nasnet-panel.session-credentials.v1';
            const raw = window.sessionStorage.getItem(key);
            const map = (raw ? JSON.parse(raw) : {}) as Record<
              string,
              { username: string; password: string }
            >;
            map[routerId] = { username: 'admin', password: 'test' };
            window.sessionStorage.setItem(key, JSON.stringify(map));
          } catch {
            /* ignore */
          }
        }, options.id);
      }

      const envelope = <T>(data: T, status = 200) =>
        JSON.stringify({ status, message: 'OK', data });

      const entries = [
        {
          id: '0',
          time: 'apr/23 10:00:00',
          topic: 'system,info',
          level: 'info',
          message: 'system started',
        },
        {
          id: '1',
          time: 'apr/23 10:01:00',
          topic: 'pppoe,error',
          level: 'error',
          message: 'pppoe connection failed',
        },
        {
          id: '2',
          time: 'apr/23 10:02:00',
          topic: 'dhcp,warning',
          level: 'warning',
          message: 'lease expired for 192.168.1.50',
        },
      ];

      await context.route('**/api/logs**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({
            count: entries.length,
            entries,
            availableTopics: ['system', 'info', 'pppoe', 'error', 'dhcp', 'warning'],
            availableLevels: ['debug', 'info', 'warning', 'error', 'critical'],
          }),
        });
      });
    });
  },
  mockDhcpBackend: async ({ context }, use) => {
    await use(async (options = {}) => {
      if (options.id) {
        await context.addInitScript((routerId) => {
          try {
            const key = 'nasnet-panel.session-credentials.v1';
            const raw = window.sessionStorage.getItem(key);
            const map = (raw ? JSON.parse(raw) : {}) as Record<
              string,
              { username: string; password: string }
            >;
            map[routerId] = { username: 'admin', password: 'test' };
            window.sessionStorage.setItem(key, JSON.stringify(map));
          } catch {
            /* ignore */
          }
        }, options.id);
      }

      const envelope = <T>(data: T, status = 200) =>
        JSON.stringify({ status, message: 'OK', data });

      const servers = [
        {
          id: '*1',
          name: 'default-lan',
          interface: 'bridge1',
          addressPool: 'lan-pool',
          ranges: ['192.168.88.100-192.168.88.200'],
          gateway: '192.168.88.1',
          dnsServers: '1.1.1.1,8.8.8.8',
          leaseTime: '10m',
          disabled: false,
          localAddress: '192.168.88.1',
        },
      ];

      const leases = [
        {
          id: '*1',
          address: '192.168.88.101',
          macAddress: 'AA:BB:CC:DD:EE:01',
          hostName: 'laptop-maj',
          serverName: 'default-lan',
          status: 'bound',
          expiresAfter: '9m32s',
          dynamic: true,
        },
        {
          id: '*2',
          address: '192.168.88.102',
          macAddress: 'AA:BB:CC:DD:EE:02',
          hostName: 'printer',
          serverName: 'default-lan',
          status: 'bound',
          expiresAfter: '5m10s',
          dynamic: false,
        },
      ];

      const clients = [
        {
          id: '*1',
          interface: 'ether1',
          status: 'bound',
          address: '10.0.0.42',
          gateway: '10.0.0.1',
          primaryDns: '1.1.1.1',
          usePeerDns: true,
          usePeerNtp: false,
          disabled: false,
        },
      ];

      await context.route('**/api/dhcp/servers', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope(servers),
        });
      });
      await context.route('**/api/dhcp/leases', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope(leases),
        });
      });
      await context.route('**/api/dhcp/clients', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope(clients),
        });
      });
      await context.route('**/api/dhcp/leases/make-static**', async (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ macAddress: 'AA:BB:CC:DD:EE:01', id: '*1', address: '192.168.88.101' }),
        });
      });
      await context.route('**/api/dhcp/leases/*', async (route) => {
        if (route.request().method() !== 'DELETE') return route.fallback();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ macAddress: 'AA:BB:CC:DD:EE:02', id: '*2', address: '192.168.88.102' }),
        });
      });
    });
  },
});

declare global {
  interface Window {
    __MOCKS__?: {
      reset: () => void;
      seedEmpty: () => void;
      seedRouter: (input: SeedInput) => Router;
    };
    __SEED_EMPTY__?: boolean;
    __PENDING_SEEDS__?: SeedInput[];
  }
}

export const expect = test.expect;
