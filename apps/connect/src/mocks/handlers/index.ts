/**
 * MSW Handlers Index
 *
 * Export all GraphQL and REST handlers from this file.
 * Each domain should have its own handler file for organization.
 *
 * Usage in tests:
 * import { handlers } from '@/mocks/handlers';
 */

import { graphqlHandlers } from './graphql';
import { restHandlers } from './rest';

// Combine all handlers
export const handlers = [...graphqlHandlers, ...restHandlers];

// Re-export individual handler groups for selective use
export { graphqlHandlers, restHandlers };
