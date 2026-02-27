# Mocking Strategy

NasNetConnect uses **MSW (Mock Service Worker)** as the single mocking layer for all network requests — GraphQL and REST alike. MSW intercepts requests at the network level (using a service worker in the browser, and a Node.js interceptor in Vitest). This means tests exercise real Apollo Client logic, real fetch calls, and real response parsing — only the network boundary is replaced with controlled fixtures.

**Source:** `apps/connect/src/mocks/`

---

## Architecture

```
apps/connect/src/mocks/
├── handlers/
│   ├── graphql.ts     ← GraphQL query/mutation/subscription handlers
│   ├── rest.ts        ← REST endpoint handlers
│   └── index.ts       ← Combined export
├── server.ts          ← MSW Node server (Vitest)
├── browser.ts         ← MSW service worker (Storybook / dev)
└── index.ts
```

### Two Environments

| File | Used in | MSW mode |
|------|---------|---------|
| `server.ts` | Vitest unit/component tests | Node.js request interceptor |
| `browser.ts` | Storybook, local development | Service worker in browser |

---

## MSW Server (Vitest)

`apps/connect/src/mocks/server.ts`

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Server with all default handlers active
export const server = setupServer(...handlers);

export { handlers };
```

The server is started in `apps/connect/src/test/setup.ts`:

```typescript
import { server } from '../mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();  // Remove test-specific overrides
});

afterAll(() => server.close());
```

`onUnhandledRequest: 'warn'` prints a console warning when a test makes a network request that no handler covers, helping catch missing mock setup.

---

## MSW Browser Worker (Storybook)

`apps/connect/src/mocks/browser.ts`

```typescript
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
export { handlers };
```

To enable MSW in Storybook, start the worker in `.storybook/preview.ts`:

```typescript
if (typeof window !== 'undefined') {
  const { worker } = await import('@/mocks/browser');
  await worker.start({ onUnhandledRequest: 'warn' });
}
```

To enable in development mode:

```typescript
// In main.tsx (dev only)
if (import.meta.env.DEV) {
  const { worker } = await import('./mocks/browser');
  await worker.start();
}
```

---

## Handlers

### Handler Index

`apps/connect/src/mocks/handlers/index.ts` combines all handlers:

```typescript
import { graphqlHandlers } from './graphql';
import { restHandlers } from './rest';

export const handlers = [...graphqlHandlers, ...restHandlers];

// Re-export individual groups for selective use
export { graphqlHandlers, restHandlers };
```

---

## GraphQL Handlers

`apps/connect/src/mocks/handlers/graphql.ts`

All handlers target a single GraphQL endpoint:

```typescript
import { graphql, HttpResponse } from 'msw';

const graphqlEndpoint = graphql.link('http://localhost:8080/graphql');
```

### Query Handler

```typescript
export const getSystemInfoHandler = graphqlEndpoint.query(
  'GetSystemInfo',
  () => {
    return HttpResponse.json({
      data: {
        systemInfo: {
          identity: 'MikroTik-Router',
          routerBoard: 'hAP ac3',
          version: '7.12',
          uptime: '5d 12h 30m',
          cpuLoad: 15,
          memoryUsed: 45,
          memoryFree: 55,
          lastUpdate: new Date().toISOString(),
        },
      },
    });
  }
);
```

### Mutation Handler

```typescript
export const connectRouterHandler = graphqlEndpoint.mutation(
  'ConnectRouter',
  ({ variables }) => {
    const { id } = variables as { id: string };
    return HttpResponse.json({
      data: {
        connectRouter: {
          success: true,
          router: {
            id,
            name: 'Main Router',
            host: '192.168.88.1',
            status: 'CONNECTED',
            identity: 'MikroTik',
            lastConnectedAt: new Date().toISOString(),
          },
          errors: null,
        },
      },
    });
  }
);
```

### Variables in Handlers

Access query/mutation variables via the `{ variables }` parameter:

```typescript
export const getRouterHandler = graphqlEndpoint.query(
  'GetRouter',
  ({ variables }) => {
    const { id } = variables as { id: string };
    return HttpResponse.json({
      data: {
        router: { id, name: 'Main Router', host: '192.168.88.1', status: 'CONNECTED' },
      },
    });
  }
);
```

### Error Handler

Return a GraphQL error response to test error states:

```typescript
export const errorHandler = graphqlEndpoint.query('GetSystemInfo', () => {
  return HttpResponse.json(
    {
      errors: [
        {
          message: 'Router connection failed',
          extensions: { code: 'CONNECTION_ERROR' },
        },
      ],
    },
    { status: 500 }
  );
});
```

### Default Handlers List

```typescript
export const graphqlHandlers = [
  getSystemInfoHandler,
  getInterfacesHandler,
  getDHCPLeasesHandler,
  getRouterHandler,
  getRoutersHandler,
  connectRouterHandler,
  disconnectRouterHandler,
];
```

---

## REST Handlers

`apps/connect/src/mocks/handlers/rest.ts`

```typescript
import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:8080';
```

### GET Handler

```typescript
export const healthCheckHandler = http.get(
  `${API_BASE_URL}/api/health`,
  () => {
    return HttpResponse.json({
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  }
);
```

### POST Handler with Request Body

```typescript
export const routerConnectHandler = http.post(
  `${API_BASE_URL}/api/routers/connect`,
  async ({ request }) => {
    const body = await request.json() as { address?: string; username?: string };
    const address = body?.address || 'unknown';

    return HttpResponse.json({
      success: true,
      router: {
        address,
        connected: true,
        protocol: 'api',
        sessionId: `session_${Date.now()}`,
      },
    });
  }
);
```

---

## Overriding Handlers in Tests

The default handlers provide a "happy path" response. Override in specific tests to simulate edge cases.

### Single-test override

```typescript
import { server } from '@/mocks/server';
import { errorHandler } from '@/mocks/handlers/graphql';

it('should show error when router is unreachable', async () => {
  // Override only for this test — resets automatically in afterEach
  server.use(errorHandler);

  render(<RouterDashboard routerId="r1" />);
  expect(await screen.findByText(/connection failed/i)).toBeInTheDocument();
});
```

### Inline handler override

```typescript
import { graphql, HttpResponse } from 'msw';

it('should show empty router list', async () => {
  server.use(
    graphql.query('GetRouters', () =>
      HttpResponse.json({
        data: {
          routers: { edges: [], totalCount: 0, pageInfo: { hasNextPage: false } },
        },
      })
    )
  );

  render(<RouterListPage />);
  expect(await screen.findByText(/no routers configured/i)).toBeInTheDocument();
});
```

### Loading state

```typescript
it('should show skeleton while loading', async () => {
  // Return a promise that never resolves = permanent loading state
  server.use(
    graphql.query('GetInterfaces', () => new Promise(() => {}))
  );

  render(<NetworkPage routerId="r1" />);
  expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
});
```

---

## Adding New Handlers

### 1. Add to the domain file

Add handlers to `graphql.ts` or `rest.ts` organized by domain. Keep each handler focused on a single operation:

```typescript
// In graphql.ts
export const getFirewallRulesHandler = graphqlEndpoint.query(
  'GetFirewallRules',
  ({ variables }) => {
    const { routerId } = variables as { routerId: string };
    return HttpResponse.json({
      data: {
        firewallRules: [
          {
            id: '1',
            chain: 'input',
            action: 'accept',
            protocol: 'tcp',
            dstPort: '80',
            comment: 'Allow HTTP',
            disabled: false,
          },
        ],
      },
    });
  }
);
```

### 2. Add to the handlers array

```typescript
export const graphqlHandlers = [
  getSystemInfoHandler,
  // ... existing handlers
  getFirewallRulesHandler, // ← Add here
];
```

### 3. Consider pairing with an error handler

```typescript
export const getFirewallRulesErrorHandler = graphqlEndpoint.query(
  'GetFirewallRules',
  () =>
    HttpResponse.json(
      { errors: [{ message: 'Unauthorized', extensions: { code: 'FORBIDDEN' } }] },
      { status: 403 }
    )
);
```

---

## Storybook MSW Integration

Stories can use MSW handlers to render components in specific data states without a running backend. The `browser.ts` worker intercepts network requests made from Storybook.

```typescript
// In a story file
import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';

const meta: Meta<typeof RouterDashboard> = {
  title: 'Features/Router/Dashboard',
  component: RouterDashboard,
  parameters: {
    msw: {
      handlers: [
        http.get('*/api/health', () =>
          HttpResponse.json({ status: 'degraded' })
        ),
      ],
    },
  },
};

export const DegradedState: StoryObj = {
  parameters: {
    msw: {
      handlers: [
        // Story-specific override — degraded health response
        http.get('*/api/health', () =>
          HttpResponse.json({ status: 'degraded' })
        ),
      ],
    },
  },
};
```

---

## Mock Data Patterns

### Typed fixture factories

```typescript
import { type RouterNode } from '@nasnet/api-client/generated';

function makeRouter(overrides: Partial<RouterNode> = {}): RouterNode {
  return {
    id: 'router-1',
    name: 'Main Router',
    host: '192.168.88.1',
    status: 'CONNECTED',
    identity: 'MikroTik',
    model: 'hAP ac3',
    version: '7.12',
    lastConnectedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Re-use in handlers
export const getRouterHandler = graphqlEndpoint.query('GetRouter', ({ variables }) => {
  const { id } = variables as { id: string };
  return HttpResponse.json({ data: { router: makeRouter({ id }) } });
});
```

### Dynamic responses based on variables

```typescript
export const getDHCPLeasesHandler = graphqlEndpoint.query(
  'GetDHCPLeases',
  ({ variables }) => {
    const { serverId } = variables as { serverId?: string };

    // Return different data based on which server was queried
    const leases = serverId === 'dhcp-lan'
      ? lanLeases
      : serverId === 'dhcp-guest'
      ? guestLeases
      : [];

    return HttpResponse.json({ data: { dhcpLeases: leases } });
  }
);
```

---

## See Also

- `apps/connect/src/mocks/handlers/graphql.ts` — All GraphQL handlers
- `apps/connect/src/mocks/handlers/rest.ts` — All REST handlers
- `apps/connect/src/mocks/server.ts` — Vitest server setup
- `apps/connect/src/mocks/browser.ts` — Storybook worker setup
- `apps/connect/src/test/setup.ts` — MSW server lifecycle in tests
- `10-testing/component-testing.md` — How to use `server.use()` in tests
