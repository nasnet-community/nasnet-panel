/**
 * DNS Mutation Hooks
 * Updates DNS settings and manages static entries using Apollo Client + GraphQL
 *
 * Per ADR-011: Unified GraphQL Architecture
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { useMutation, gql } from '@apollo/client';

/**
 * GraphQL mutation to update DNS settings
 *
 * Updates router DNS configuration including:
 * - Static DNS servers list
 * - Remote requests setting
 * - Cache size
 */
const UPDATE_DNS_SETTINGS = gql`
  mutation UpdateDNSSettings($deviceId: ID!, $input: DNSSettingsInput!) {
    updateDNSSettings(deviceId: $deviceId, input: $input) {
      servers
      allowRemoteRequests
      cacheSize
      cacheUsed
    }
  }
`;

/**
 * GraphQL mutation to create a new DNS static entry
 *
 * Adds a local hostname-to-IP mapping on the router.
 * The entry will be immediately resolvable by DNS queries.
 */
const CREATE_DNS_STATIC_ENTRY = gql`
  mutation CreateDNSStaticEntry($deviceId: ID!, $input: DNSStaticEntryInput!) {
    createDNSStaticEntry(deviceId: $deviceId, input: $input) {
      id
      name
      address
      ttl
      comment
    }
  }
`;

/**
 * GraphQL mutation to update an existing DNS static entry
 *
 * Modifies an existing hostname-to-IP mapping.
 * Requires the entry ID to identify which entry to update.
 */
const UPDATE_DNS_STATIC_ENTRY = gql`
  mutation UpdateDNSStaticEntry($deviceId: ID!, $entryId: ID!, $input: DNSStaticEntryInput!) {
    updateDNSStaticEntry(deviceId: $deviceId, entryId: $entryId, input: $input) {
      id
      name
      address
      ttl
      comment
    }
  }
`;

/**
 * GraphQL mutation to delete a DNS static entry
 *
 * Removes a hostname-to-IP mapping from the router.
 * The hostname will no longer resolve locally.
 */
const DELETE_DNS_STATIC_ENTRY = gql`
  mutation DeleteDNSStaticEntry($deviceId: ID!, $entryId: ID!) {
    deleteDNSStaticEntry(deviceId: $deviceId, entryId: $entryId) {
      success
    }
  }
`;

/**
 * Hook to update DNS settings
 *
 * Automatically refetches DNS settings after successful update
 * to ensure UI reflects latest state.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [updateSettings, { loading }] = useUpdateDNSSettings();
 *
 * const handleSubmit = async (values) => {
 *   await updateSettings({
 *     variables: {
 *       deviceId: routerId,
 *       input: {
 *         servers: values.servers,
 *         allowRemoteRequests: values.allowRemoteRequests,
 *         cacheSize: values.cacheSize,
 *       },
 *     },
 *   });
 * };
 * ```
 */
export function useUpdateDNSSettings() {
  return useMutation(UPDATE_DNS_SETTINGS, {
    refetchQueries: ['GetDNSSettings'],
    awaitRefetchQueries: true,
  });
}

/**
 * Hook to create a new DNS static entry
 *
 * Automatically refetches static entries list after successful creation
 * to show the new entry in the UI.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [createEntry, { loading }] = useCreateDNSStaticEntry();
 *
 * const handleAdd = async (values) => {
 *   await createEntry({
 *     variables: {
 *       deviceId: routerId,
 *       input: {
 *         name: 'nas.local',
 *         address: '192.168.1.50',
 *         ttl: 86400,
 *         comment: 'Network storage',
 *       },
 *     },
 *   });
 * };
 * ```
 */
export function useCreateDNSStaticEntry() {
  return useMutation(CREATE_DNS_STATIC_ENTRY, {
    refetchQueries: ['GetDNSStaticEntries'],
    awaitRefetchQueries: true,
  });
}

/**
 * Hook to update an existing DNS static entry
 *
 * Automatically refetches static entries list after successful update
 * to reflect changes in the UI.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [updateEntry, { loading }] = useUpdateDNSStaticEntry();
 *
 * const handleEdit = async (entryId, values) => {
 *   await updateEntry({
 *     variables: {
 *       deviceId: routerId,
 *       entryId,
 *       input: {
 *         name: values.name,
 *         address: values.address,
 *         ttl: values.ttl,
 *         comment: values.comment,
 *       },
 *     },
 *   });
 * };
 * ```
 */
export function useUpdateDNSStaticEntry() {
  return useMutation(UPDATE_DNS_STATIC_ENTRY, {
    refetchQueries: ['GetDNSStaticEntries'],
    awaitRefetchQueries: true,
  });
}

/**
 * Hook to delete a DNS static entry
 *
 * Automatically refetches static entries list after successful deletion
 * to remove the entry from the UI.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [deleteEntry, { loading }] = useDeleteDNSStaticEntry();
 *
 * const handleDelete = async (entryId) => {
 *   await deleteEntry({
 *     variables: {
 *       deviceId: routerId,
 *       entryId,
 *     },
 *   });
 * };
 * ```
 */
export function useDeleteDNSStaticEntry() {
  return useMutation(DELETE_DNS_STATIC_ENTRY, {
    refetchQueries: ['GetDNSStaticEntries'],
    awaitRefetchQueries: true,
  });
}
