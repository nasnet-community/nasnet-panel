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

export interface TestFixtures {
  resetMocks: () => Promise<void>;
  seedRouter: (input: SeedInput) => Promise<void>;
  mockBackendScan: (devices?: ScanMockDevice[]) => Promise<void>;
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
