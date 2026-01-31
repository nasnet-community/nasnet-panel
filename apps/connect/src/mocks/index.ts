/**
 * MSW Mocks Index
 *
 * Re-export MSW components for easy importing
 *
 * Usage:
 * import { server, handlers } from '@/mocks'; // For tests
 * import { worker } from '@/mocks/browser';   // For browser
 */

export { server, handlers } from './server';
export { graphqlHandlers, restHandlers } from './handlers';
