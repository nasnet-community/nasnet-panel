import { test as base } from '@playwright/test';
import type { Router } from '../../src/mocks/types';

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

export interface OverviewBackendInterface {
  id?: string;
  name: string;
  type?: string;
  running?: boolean;
  disabled?: boolean;
  comment?: string;
  rx?: string;
  tx?: string;
  actualMtu?: number;
}

export interface OverviewBackendIpAddress {
  id?: string;
  address: string;
  interface: string;
  dynamic?: boolean;
  disabled?: boolean;
}

export interface OverviewBackendRouter {
  id?: string;
  model?: string;
  version?: string;
  interfaces?: OverviewBackendInterface[];
  addresses?: OverviewBackendIpAddress[];
}

export interface WifiBackendInterface {
  id?: string;
  name?: string;
  ssid?: string;
  band?: string;
  running?: boolean;
  disabled?: boolean;
}

export interface WifiBackendRouter {
  id?: string;
  ssid?: string;
  passphrase?: string;
  interfaceName?: string;
  interfaces?: WifiBackendInterface[];
}

export interface LogsBackendOptions {
  id?: string;
}

export interface DhcpBackendOptions {
  id?: string;
}

export interface DiagBackendOptions {
  id?: string;
  initialProgress?: number;
}

export interface EasyConfigBackendInterface {
  id?: string;
  name: string;
  type?: string;
  running?: boolean;
  disabled?: boolean;
  defaultName?: string;
}

export interface EasyConfigBackendWifiInterface {
  id?: string;
  name?: string;
  band: string;
  ssid?: string;
}

export interface EasyConfigBackendScanNetwork {
  ssid: string;
  security?: string;
  signal?: string;
  channel?: string;
}

export interface EasyConfigBackendOptions {
  id: string;
  interfaces?: EasyConfigBackendInterface[];
  wifiInterfaces?: EasyConfigBackendWifiInterface[];
  scanNetworks?: EasyConfigBackendScanNetwork[];
  // progress returned by successive wizard status polls; the last value repeats
  wizardProgress?: number[];
  // management WiFi credentials returned by finalize; pass null to omit them (no WiFi radio)
  managementWifi?: { ssid: string; password: string } | null;
}

export interface TestFixtures {
  resetMocks: () => Promise<void>;
  seedRouter: (input: SeedInput) => Promise<void>;
  mockBackendScan: (devices?: ScanMockDevice[]) => Promise<void>;
  mockOverviewBackend: (router?: OverviewBackendRouter) => Promise<void>;
  mockWifiBackend: (router?: WifiBackendRouter) => Promise<void>;
  mockLogsBackend: (options?: LogsBackendOptions) => Promise<void>;
  mockDhcpBackend: (options?: DhcpBackendOptions) => Promise<void>;
  mockDiagBackend: (options?: DiagBackendOptions) => Promise<void>;
  mockEasyConfigBackend: (options: EasyConfigBackendOptions) => Promise<void>;
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

      const norm = model.toLowerCase().replace(/[^a-z0-9]/g, '');
      const ethCount = norm.includes('rb4011') ? 10 : norm.includes('rb5009') ? 8 : 5;
      const hasSfp = norm.includes('rb4011') || norm.includes('rb5009');
      const defaultInterfaces: OverviewBackendInterface[] = [
        ...Array.from({ length: ethCount }, (_, i) => {
          const n = i + 1;
          const isUp = n !== 5 && n !== 3;
          return {
            id: `*${n}`,
            name: `ether${n}`,
            type: 'ether',
            running: n !== 5,
            disabled: n === 3,
            comment: n === 1 ? 'WAN uplink' : undefined,
            rx: isUp ? '100 MB' : undefined,
            tx: isUp ? '50 MB' : undefined,
            actualMtu: 1500,
          } as OverviewBackendInterface;
        }),
        ...(hasSfp
          ? [
              {
                id: '*20',
                name: 'sfp-sfpplus1',
                type: 'ether',
                running: true,
                disabled: false,
                rx: '1 GB',
                tx: '500 MB',
                actualMtu: 1500,
              } as OverviewBackendInterface,
            ]
          : []),
        { id: '*30', name: 'bridge1', type: 'bridge', running: true, disabled: false },
      ];
      const interfaces = (router.interfaces ?? defaultInterfaces).map((i) => ({
        id: i.id ?? `*${i.name}`,
        name: i.name,
        type: i.type ?? 'ether',
        running: i.running ?? true,
        disabled: i.disabled ?? false,
        comment: i.comment,
        rx: i.rx,
        tx: i.tx,
        actualMtu: i.actualMtu,
      }));
      const addresses = router.addresses ?? [
        { id: '*1', address: '100.64.0.2/24', interface: 'ether1', dynamic: true, disabled: false },
        {
          id: '*2',
          address: '192.168.88.1/24',
          interface: 'bridge1',
          dynamic: false,
          disabled: false,
        },
      ];
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

      await context.route('**/api/interface/interfaces', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope(interfaces),
        });
      });

      const dhcpClients = addresses.map((a) => ({
        id: a.id ?? `*${a.interface}`,
        interface: a.interface,
        status: 'bound',
        address: a.address,
        usePeerDns: true,
        usePeerNtp: false,
        disabled: a.disabled ?? false,
      }));

      await context.route('**/api/dhcp/clients', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope(dhcpClients),
        });
      });

      const graphStart = Date.now() - 29 * 10_000;
      const trafficData = Array.from({ length: 30 }, (_, i) => ({
        rxBytes: 1_000_000 + i * 1_250_000,
        txBytes: 500_000 + i * 625_000,
        rx: '1.25 MB/s',
        tx: '625.0 kB/s',
        timestamp: new Date(graphStart + i * 10_000).toISOString(),
      }));
      await context.route('**/api/interface/graph/*', async (route) => {
        const url = new URL(route.request().url());
        const interfaceName = decodeURIComponent(url.pathname.split('/').pop() ?? '');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ interfaceName, trafficData }),
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

      const ifaces = router.interfaces ?? [
        { id: '*1', name: interfaceName, ssid, band: '5ghz-ac', running: true },
      ];
      const ifacePayload = ifaces.map((i, idx) => ({
        id: i.id ?? `*${idx + 1}`,
        name: i.name ?? `wifi${idx + 1}`,
        interface: i.name ?? `wifi${idx + 1}`,
        ssid: i.ssid ?? ssid,
        frequency: '5180',
        channelWidth: '20/40/80mhz-XXXX',
        macAddress: `AA:BB:CC:DD:EE:0${idx + 1}`,
        disabled: i.disabled ?? false,
        running: i.running ?? true,
        inactive: !(i.running ?? true),
        mode: 'ap',
        band: i.band ?? '',
        securityType: 'wpa2-psk',
        comment: '',
      }));

      await context.route('**/api/wifi/interfaces', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope(ifacePayload),
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

      await context.route('**/api/wifi/settings/*', async (route) => {
        if (route.request().method() === 'PUT') {
          const body = route.request().postDataJSON() as {
            ssid?: string;
            password?: string;
            securityTypes?: string;
          } | null;
          if (body?.password) passphrase = body.password;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: envelope({ ok: true }),
          });
          return;
        }
        await route.fallback();
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
  mockEasyConfigBackend: async ({ context }, use) => {
    await use(async (options) => {
      const { id, interfaces, wifiInterfaces, scanNetworks, wizardProgress, managementWifi } =
        options;
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
      }, id);

      const envelope = <T>(data: T, status = 200) =>
        JSON.stringify({ status, message: 'OK', data });

      const ifaces = (
        interfaces ?? [
          { id: '*1', name: 'ether1', type: 'ether', running: true, disabled: false },
          { id: '*2', name: 'ether2', type: 'ether', running: true, disabled: false },
          { id: '*3', name: 'Wifi2.4', type: 'wireless', running: true, disabled: false },
        ]
      ).map((i, idx) => ({
        id: i.id ?? `*${idx + 1}`,
        name: i.name,
        type: i.type ?? 'ether',
        running: i.running ?? true,
        disabled: i.disabled ?? false,
        defaultName: i.defaultName,
      }));

      const wifiIfaces = (
        wifiInterfaces ?? [{ id: '*100', name: 'wifi1', band: '2ghz-ax', ssid: 'TestNet' }]
      ).map((w, idx) => ({
        id: w.id ?? `*${100 + idx}`,
        name: w.name ?? `wifi${idx + 1}`,
        interface: w.name ?? `wifi${idx + 1}`,
        ssid: w.ssid ?? '',
        frequency: '',
        channelWidth: '',
        macAddress: `AA:BB:CC:DD:EE:${(idx + 1).toString().padStart(2, '0')}`,
        disabled: false,
        running: true,
        inactive: false,
        mode: 'ap',
        band: w.band,
        securityType: 'wpa2-psk',
      }));

      const networks = (scanNetworks ?? []).map((n, idx) => ({
        macAddress: `AA:BB:CC:DD:EE:${(idx + 1).toString().padStart(2, '0')}`,
        ssid: n.ssid,
        channel: n.channel ?? '36',
        security: n.security ?? 'wpa2-psk',
        signal: n.signal ?? '-50',
      }));

      await context.route('**/api/interface/interfaces', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope(ifaces),
        });
      });

      await context.route('**/api/wifi/interfaces', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope(wifiIfaces),
        });
      });

      await context.route('**/api/wifi/scan/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope(networks),
        });
      });

      const mgmtWifi =
        managementWifi === undefined
          ? { ssid: 'NNC-Rescue-42', password: 'rescue-pass-4242' }
          : managementWifi;
      await context.route('**/api/wizard/finalize', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({
            managementWiFiSSID: mgmtWifi?.ssid ?? '',
            managementWiFiPassword: mgmtWifi?.password ?? '',
          }),
        });
      });

      const steps = wizardProgress ?? [100];
      let polls = 0;
      await context.route('**/api/wizard/status', async (route) => {
        const progress = steps[Math.min(polls, steps.length - 1)] ?? 100;
        polls += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ completed: progress >= 100, completedAt: null, progress }),
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

      const leases = [
        {
          id: '*1',
          address: '192.168.88.101',
          macAddress: 'AA:BB:CC:DD:EE:01',
          hostName: 'laptop-maj',
          serverName: 'default-lan',
          status: 'bound',
          expiresAfter: '9m32s',
          bridgePort: 'ether3',
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
  mockDiagBackend: async ({ context }, use) => {
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

      let progress = options.initialProgress ?? 0;
      let started = false;

      await context.route('**/api/diag/generate', async (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        started = true;
        progress = 0;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ message: 'Diagnostic script executed successfully' }),
        });
      });

      await context.route('**/api/diag/status**', async (route) => {
        if (started && progress < 100) progress = Math.min(100, progress + 45);
        const running = progress > 0 && progress < 100;
        const data: Record<string, unknown> = { progress, running };
        if (progress === 100) {
          data.generateTime = '2026-07-08 01:36:16';
          data.fileSize = '74.15 KB';
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope(data),
        });
      });

      await context.route('**/api/diag/download', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/plain',
          headers: {
            'Content-Disposition': 'attachment; filename="nasnet-diagnostic-report.txt"',
          },
          body: 'NasNet Panel Diagnostic Report',
        });
      });
    });
  },
});

export const expect = test.expect;
