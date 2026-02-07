/**
 * Network interface management API client hooks
 * NAS-6.1: Interface List and Configuration
 * NAS-6.2: IP Address Management
 * NAS-6.6: Bridge Configuration
 * NAS-6.7: VLAN Management
 */

export * from './queries.graphql';
export * from './useInterfaceList';
export * from './useInterfaceMutations';
export * from './ip-address-queries.graphql';
export * from './useIPAddresses';
export * from './useIPAddressMutations';
export * from './bridge-queries.graphql';
export * from './useBridgeQueries';
export * from './useBridgeMutations';
export * from './useRoutes';
export * from './vlan-queries.graphql';
export * from './useVlanQueries';
export * from './useVlanMutations';
