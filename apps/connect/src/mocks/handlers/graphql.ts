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
];
