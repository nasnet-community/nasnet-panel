/**
 * GraphQL Handlers for MSW
 *
 * This file contains MSW handlers for mocking GraphQL API responses.
 * Handlers are organized by domain and follow the schema structure.
 *
 * Usage:
 * - Import individual handlers or the full graphqlHandlers array
 * - Override responses in specific tests using server.use()
 */

import { graphql, HttpResponse } from 'msw';

// GraphQL endpoint for the API
const graphqlEndpoint = graphql.link('http://localhost:8080/graphql');

/**
 * System Info Query Handler
 * Returns basic router system information
 */
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

/**
 * Interfaces Query Handler
 * Returns network interface list
 */
export const getInterfacesHandler = graphqlEndpoint.query(
  'GetInterfaces',
  () => {
    return HttpResponse.json({
      data: {
        interfaces: [
          {
            id: '1',
            name: 'ether1',
            type: 'ethernet',
            status: 'running',
            macAddress: 'AA:BB:CC:DD:EE:01',
            rxBytes: 1234567890,
            txBytes: 987654321,
          },
          {
            id: '2',
            name: 'ether2',
            type: 'ethernet',
            status: 'disabled',
            macAddress: 'AA:BB:CC:DD:EE:02',
            rxBytes: 0,
            txBytes: 0,
          },
          {
            id: '3',
            name: 'wlan1',
            type: 'wireless',
            status: 'running',
            macAddress: 'AA:BB:CC:DD:EE:03',
            rxBytes: 555555555,
            txBytes: 444444444,
          },
        ],
      },
    });
  }
);

/**
 * DHCP Leases Query Handler
 * Returns active DHCP leases
 */
export const getDHCPLeasesHandler = graphqlEndpoint.query(
  'GetDHCPLeases',
  () => {
    return HttpResponse.json({
      data: {
        dhcpLeases: [
          {
            id: '1',
            address: '192.168.1.100',
            macAddress: '11:22:33:44:55:66',
            hostname: 'laptop-user1',
            status: 'bound',
            expiresIn: '23h 45m',
          },
          {
            id: '2',
            address: '192.168.1.101',
            macAddress: '11:22:33:44:55:77',
            hostname: 'phone-user1',
            status: 'bound',
            expiresIn: '12h 30m',
          },
        ],
      },
    });
  }
);

/**
 * Router Query Handler
 * Returns a single router by ID
 */
export const getRouterHandler = graphqlEndpoint.query(
  'GetRouter',
  ({ variables }) => {
    const { id } = variables as { id: string };
    return HttpResponse.json({
      data: {
        router: {
          id,
          name: 'Main Router',
          host: '192.168.88.1',
          status: 'CONNECTED',
          identity: 'MikroTik',
          model: 'hAP ac3',
          version: '7.12',
          lastConnectedAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }
);

/**
 * Routers Query Handler
 * Returns paginated list of routers
 */
export const getRoutersHandler = graphqlEndpoint.query('GetRouters', () => {
  return HttpResponse.json({
    data: {
      routers: {
        edges: [
          {
            node: {
              id: 'router-1',
              name: 'Main Router',
              host: '192.168.88.1',
              status: 'CONNECTED',
              identity: 'MikroTik-Main',
              model: 'hAP ac3',
              version: '7.12',
            },
            cursor: 'cursor-1',
          },
          {
            node: {
              id: 'router-2',
              name: 'Office Router',
              host: '192.168.1.1',
              status: 'DISCONNECTED',
              identity: 'MikroTik-Office',
              model: 'RB4011',
              version: '7.11',
            },
            cursor: 'cursor-2',
          },
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'cursor-1',
          endCursor: 'cursor-2',
        },
        totalCount: 2,
      },
    },
  });
});

/**
 * Connect Router Mutation Handler
 * Simulates connecting to a router
 */
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

/**
 * Disconnect Router Mutation Handler
 * Simulates disconnecting from a router
 */
export const disconnectRouterHandler = graphqlEndpoint.mutation(
  'DisconnectRouter',
  ({ variables }) => {
    const { id } = variables as { id: string };
    return HttpResponse.json({
      data: {
        disconnectRouter: {
          success: true,
          router: {
            id,
            name: 'Main Router',
            status: 'DISCONNECTED',
          },
          errors: null,
        },
      },
    });
  }
);

/**
 * Error handler example for testing error states
 */
export const errorHandler = graphqlEndpoint.query('GetSystemInfo', () => {
  return HttpResponse.json(
    {
      errors: [
        {
          message: 'Router connection failed',
          extensions: {
            code: 'CONNECTION_ERROR',
          },
        },
      ],
    },
    { status: 500 }
  );
});

// Export all GraphQL handlers
export const graphqlHandlers = [
  getSystemInfoHandler,
  getInterfacesHandler,
  getDHCPLeasesHandler,
  getRouterHandler,
  getRoutersHandler,
  connectRouterHandler,
  disconnectRouterHandler,
];
