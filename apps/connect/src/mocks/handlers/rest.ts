/**
 * REST Handlers for MSW
 *
 * This file contains MSW handlers for mocking REST API responses.
 * Used primarily for the ROSProxy backend endpoints.
 */

import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:8080';

/**
 * Health Check Handler
 * Returns server health status
 */
export const healthCheckHandler = http.get(`${API_BASE_URL}/api/health`, () => {
  return HttpResponse.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Router Discovery Handler
 * Returns discovered routers on the network
 */
export const routerDiscoveryHandler = http.get(`${API_BASE_URL}/api/routers/discover`, () => {
  return HttpResponse.json({
    routers: [
      {
        address: '192.168.1.1',
        identity: 'MikroTik-Office',
        platform: 'MikroTik RouterOS',
        version: '7.12',
        boardName: 'hAP ac3',
      },
      {
        address: '192.168.1.2',
        identity: 'MikroTik-Lab',
        platform: 'MikroTik RouterOS',
        version: '7.11',
        boardName: 'RB4011',
      },
    ],
  });
});

/**
 * Router Connection Handler
 * Simulates connecting to a router
 */
export const routerConnectHandler = http.post(
  `${API_BASE_URL}/api/routers/connect`,
  async ({ request }) => {
    const body = (await request.json()) as {
      address?: string;
      username?: string;
    };
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

/**
 * Batch Job Handler
 * Simulates creating a batch job
 */
export const batchJobHandler = http.post(`${API_BASE_URL}/api/batch`, async ({ request }) => {
  const body = (await request.json()) as { script?: string };
  const jobId = `batch_${Date.now()}`;

  return HttpResponse.json({
    jobId,
    status: 'created',
    commandCount: body?.script?.split('\n').length || 0,
    createdAt: new Date().toISOString(),
  });
});

// Export all REST handlers
export const restHandlers = [
  healthCheckHandler,
  routerDiscoveryHandler,
  routerConnectHandler,
  batchJobHandler,
];
