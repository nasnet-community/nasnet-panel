/**
 * Router queries barrel export
 */

export * from './useRouterInfo';
export * from './useRouterboard';

// Export useInterfaces but rename useIPAddresses to avoid conflict with network module
export {
  interfaceKeys,
  useInterfaces,
  useInterfaceTraffic,
  useARPTable,
  useIPAddresses as useRouterIPAddresses, // Renamed to avoid conflict with network/useIPAddresses (GraphQL version)
} from './useInterfaces';
