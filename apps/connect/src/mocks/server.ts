/**
 * MSW Server Configuration for Node.js (Vitest)
 *
 * This file sets up the MSW server for use in Vitest tests.
 * The server intercepts network requests and returns mocked responses.
 *
 * Usage in test setup:
 * import { server } from '@/mocks/server';
 *
 * beforeAll(() => server.listen());
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 */

import { setupServer } from 'msw/node';

import { handlers } from './handlers';

// Create the MSW server with default handlers
export const server = setupServer(...handlers);

// Export handlers for selective use in tests
export { handlers };
