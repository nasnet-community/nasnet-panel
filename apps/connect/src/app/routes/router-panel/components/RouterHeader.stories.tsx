/**
 * RouterHeader Stories
 *
 * RouterHeader reads router metadata from useRouterStore and connection
 * status from useConnectionStore.  Each story uses a Storybook decorator
 * to seed the relevant Zustand store state before the component renders,
 * so no external data-fetching infrastructure is required.
 */

import { useEffect } from 'react';


import { useRouterStore, useConnectionStore } from '@nasnet/state/stores';

import { RouterHeader } from './RouterHeader';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const ROUTER_ID = 'router-demo-001';

const mockRouterFull = {
  id: ROUTER_ID,
  name: 'Office Gateway',
  ipAddress: '192.168.88.1',
  model: 'RB4011iGS+5HacQ2HnD',
  connectionStatus: 'online' as const,
  discoveryMethod: 'manual' as const,
  createdAt: new Date('2024-01-15'),
};

const mockRouterMinimal = {
  id: ROUTER_ID,
  ipAddress: '10.0.0.1',
  connectionStatus: 'online' as const,
  discoveryMethod: 'scan' as const,
  createdAt: new Date('2024-06-01'),
};

// ---------------------------------------------------------------------------
// Decorator helpers
// ---------------------------------------------------------------------------

/** Seeds the router and connection stores, then cleans up after the story. */
function withStoreState({
  router,
  connected,
  routerIp,
}: {
  router?: typeof mockRouterFull | typeof mockRouterMinimal | null;
  connected?: boolean;
  routerIp?: string | null;
}) {
  return function StoreDecorator({ children }: { children: React.ReactNode }) {
    useEffect(() => {
      const routerStore = useRouterStore.getState();
      const connectionStore = useConnectionStore.getState();

      // Seed router store
      if (router) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        routerStore.addRouter(router as any);
      }

      // Seed connection store
      if (connected && routerIp) {
        connectionStore.setCurrentRouter(ROUTER_ID, routerIp);
      } else {
        connectionStore.clearCurrentRouter();
      }

      return () => {
        routerStore.clearAll();
        connectionStore.clearCurrentRouter();
      };
    }, []);

    return <>{children}</>;
  };
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof RouterHeader> = {
  title: 'App/RouterPanel/RouterHeader',
  component: RouterHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a card-style header for the router panel.  Shows the ' +
          'router name, ID, IP address, optional model, and a live ' +
          'connection status indicator.  Data is read from Zustand stores; ' +
          'stories use decorators to seed mock state.',
      },
    },
  },
  argTypes: {
    routerId: {
      control: 'text',
      description: 'Router ID from URL params (used to look up router in store).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RouterHeader>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Fully-populated connected router — name, IP, and model all present,
 * connection indicator is green.
 */
export const Connected: Story = {
  args: { routerId: ROUTER_ID },
  decorators: [
    (Story) => {
      const Seeder = withStoreState({
        router: mockRouterFull,
        connected: true,
        routerIp: '192.168.88.1',
      });
      return (
        <Seeder>
          <Story />
        </Seeder>
      );
    },
  ],
};

/**
 * Router exists in the store but the connection store has no active IP —
 * status indicator shows offline/red.
 */
export const Disconnected: Story = {
  args: { routerId: ROUTER_ID },
  decorators: [
    (Story) => {
      const Seeder = withStoreState({
        router: mockRouterFull,
        connected: false,
        routerIp: null,
      });
      return (
        <Seeder>
          <Story />
        </Seeder>
      );
    },
  ],
};

/**
 * Router in store has only an IP address (no name or model), representing
 * a freshly scanned but unconfigured router.
 */
export const MinimalInfo: Story = {
  args: { routerId: ROUTER_ID },
  decorators: [
    (Story) => {
      const Seeder = withStoreState({
        router: mockRouterMinimal,
        connected: true,
        routerIp: '10.0.0.1',
      });
      return (
        <Seeder>
          <Story />
        </Seeder>
      );
    },
  ],
};

/**
 * Router ID is not present in the store at all — header falls back to
 * displaying "Router <id>" as the title.
 */
export const UnknownRouter: Story = {
  args: { routerId: 'unknown-99' },
  decorators: [
    (Story) => {
      const Seeder = withStoreState({ router: null, connected: false });
      return (
        <Seeder>
          <Story />
        </Seeder>
      );
    },
  ],
};

/**
 * Renders at 375px to verify compact mobile layout — metadata wraps and
 * the model string is hidden via responsive classes.
 */
export const MobileLayout: Story = {
  args: { routerId: ROUTER_ID },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [
    (Story) => {
      const Seeder = withStoreState({
        router: mockRouterFull,
        connected: true,
        routerIp: '192.168.88.1',
      });
      return (
        <Seeder>
          <Story />
        </Seeder>
      );
    },
  ],
};

/**
 * Desktop layout – verifies header rendering on larger screens.
 */
export const Desktop: Story = {
  args: { routerId: ROUTER_ID },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
  decorators: [
    (Story) => {
      const Seeder = withStoreState({
        router: mockRouterFull,
        connected: true,
        routerIp: '192.168.88.1',
      });
      return (
        <Seeder>
          <Story />
        </Seeder>
      );
    },
  ],
};
