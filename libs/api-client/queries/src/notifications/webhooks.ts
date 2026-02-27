/**
 * Webhook Notifications GraphQL Operations and Hooks
 * NAS-18.4: Webhook Notifications Feature
 *
 * Apollo Client hooks for webhook management and notification logs.
 * Provides CRUD operations, testing, and delivery monitoring.
 */

import { gql } from '@apollo/client';
import {
  useQuery,
  useMutation,
  type QueryHookOptions,
  type MutationHookOptions,
} from '@apollo/client';

// =============================================================================
// Fragments
// =============================================================================

/**
 * Core Webhook fields fragment
 */
export const WEBHOOK_FIELDS = gql`
  fragment WebhookFields on Webhook {
    id
    name
    description
    url
    method
    authType
    username
    bearerToken
    headers
    template
    customTemplate
    signingSecretMasked
    timeoutSeconds
    retryEnabled
    maxRetries
    enabled
    createdAt
    updatedAt
    lastDeliveredAt
    deliveryStats {
      totalAttempts
      successCount
      failureCount
      successRate
      avgResponseTimeMs
    }
  }
`;

/**
 * NotificationLog fields fragment
 */
export const NOTIFICATION_LOG_FIELDS = gql`
  fragment NotificationLogFields on NotificationLog {
    id
    alertId
    channel
    webhookId
    status
    statusCode
    responseTimeMs
    errorMessage
    retryCount
    requestPayload
    responseBody
    attemptedAt
    completedAt
  }
`;

// =============================================================================
// Queries
// =============================================================================

/**
 * Get all webhooks
 */
export const GET_WEBHOOKS = gql`
  query GetWebhooks {
    webhooks {
      ...WebhookFields
    }
  }
  ${WEBHOOK_FIELDS}
`;

/**
 * Get a single webhook by ID
 *
 * @param id - Webhook ID
 */
export const GET_WEBHOOK = gql`
  query GetWebhook($id: ID!) {
    webhook(id: $id) {
      ...WebhookFields
    }
  }
  ${WEBHOOK_FIELDS}
`;

/**
 * Get notification logs with optional filtering
 *
 * @param channel - Filter by channel type (optional)
 * @param webhookId - Filter by webhook ID (optional)
 * @param status - Filter by delivery status (optional)
 * @param limit - Maximum number of logs to return (optional)
 */
export const GET_NOTIFICATION_LOGS = gql`
  query GetNotificationLogs(
    $channel: String
    $webhookId: ID
    $status: NotificationStatus
    $limit: Int
  ) {
    notificationLogs(channel: $channel, webhookId: $webhookId, status: $status, limit: $limit) {
      ...NotificationLogFields
    }
  }
  ${NOTIFICATION_LOG_FIELDS}
`;

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new webhook
 *
 * @param input - Webhook creation input
 */
export const CREATE_WEBHOOK = gql`
  mutation CreateWebhook($input: CreateWebhookInput!) {
    createWebhook(input: $input) {
      webhook {
        ...WebhookFields
      }
      errors {
        field
        message
      }
    }
  }
  ${WEBHOOK_FIELDS}
`;

/**
 * Update an existing webhook
 *
 * @param id - Webhook ID
 * @param input - Webhook update input
 */
export const UPDATE_WEBHOOK = gql`
  mutation UpdateWebhook($id: ID!, $input: UpdateWebhookInput!) {
    updateWebhook(id: $id, input: $input) {
      webhook {
        ...WebhookFields
      }
      errors {
        field
        message
      }
    }
  }
  ${WEBHOOK_FIELDS}
`;

/**
 * Delete a webhook
 *
 * @param id - Webhook ID
 */
export const DELETE_WEBHOOK = gql`
  mutation DeleteWebhook($id: ID!) {
    deleteWebhook(id: $id) {
      success
      deletedId
      errors {
        field
        message
      }
    }
  }
`;

/**
 * Test a webhook by sending a test notification
 *
 * @param id - Webhook ID to test
 */
export const TEST_WEBHOOK = gql`
  mutation TestWebhook($id: ID!) {
    testWebhook(id: $id) {
      result {
        success
        statusCode
        responseBody
        responseTimeMs
        errorMessage
      }
      errors {
        field
        message
      }
    }
  }
`;

// =============================================================================
// Type Definitions
// =============================================================================

export interface WebhookDeliveryStats {
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgResponseTimeMs?: number;
}

export interface Webhook {
  id: string;
  name: string;
  description?: string;
  url: string;
  method: string;
  authType: 'NONE' | 'BASIC' | 'BEARER';
  username?: string;
  bearerToken?: string;
  headers?: Record<string, string>;
  template: 'GENERIC' | 'SLACK' | 'DISCORD' | 'TEAMS' | 'CUSTOM';
  customTemplate?: string;
  signingSecretMasked?: string;
  timeoutSeconds: number;
  retryEnabled: boolean;
  maxRetries: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastDeliveredAt?: string;
  deliveryStats?: WebhookDeliveryStats;
}

export interface NotificationLog {
  id: string;
  alertId: string;
  channel: string;
  webhookId?: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';
  statusCode?: number;
  responseTimeMs?: number;
  errorMessage?: string;
  retryCount: number;
  requestPayload?: Record<string, unknown>;
  responseBody?: string;
  attemptedAt: string;
  completedAt?: string;
}

export interface WebhookTestResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  responseTimeMs?: number;
  errorMessage?: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface CreateWebhookInput {
  name: string;
  description?: string;
  url: string;
  method?: string;
  authType?: 'NONE' | 'BASIC' | 'BEARER';
  username?: string;
  password?: string;
  bearerToken?: string;
  headers?: Record<string, string>;
  template?: 'GENERIC' | 'SLACK' | 'DISCORD' | 'TEAMS' | 'CUSTOM';
  customTemplate?: string;
  signingSecret?: string;
  timeoutSeconds?: number;
  retryEnabled?: boolean;
  maxRetries?: number;
  enabled?: boolean;
}

export interface UpdateWebhookInput {
  name?: string;
  description?: string;
  url?: string;
  method?: string;
  authType?: 'NONE' | 'BASIC' | 'BEARER';
  username?: string;
  password?: string;
  bearerToken?: string;
  headers?: Record<string, string>;
  template?: 'GENERIC' | 'SLACK' | 'DISCORD' | 'TEAMS' | 'CUSTOM';
  customTemplate?: string;
  signingSecret?: string;
  timeoutSeconds?: number;
  retryEnabled?: boolean;
  maxRetries?: number;
  enabled?: boolean;
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch all webhooks
 */
export function useWebhooks(
  options?: QueryHookOptions<{ webhooks: Webhook[] }, Record<string, never>>
) {
  return useQuery<{ webhooks: Webhook[] }, Record<string, never>>(GET_WEBHOOKS, options);
}

/**
 * Fetch a single webhook by ID
 */
export function useWebhook(
  id: string,
  options?: QueryHookOptions<{ webhook: Webhook | null }, { id: string }>
) {
  return useQuery<{ webhook: Webhook | null }, { id: string }>(GET_WEBHOOK, {
    ...options,
    variables: { id },
    skip: !id || options?.skip,
  });
}

/**
 * Fetch notification logs with optional filtering
 */
interface NotificationLogVariables {
  channel?: string;
  webhookId?: string;
  status?: 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';
  limit?: number;
}

export function useNotificationLogs(
  variables?: NotificationLogVariables,
  options?: Omit<QueryHookOptions, 'variables'>
) {
  return useQuery(GET_NOTIFICATION_LOGS, {
    ...options,
    variables,
  } as any);
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new webhook
 */
export function useCreateWebhook(
  options?: MutationHookOptions<
    {
      createWebhook: {
        webhook: Webhook | null;
        errors: FieldError[];
      };
    },
    { input: CreateWebhookInput }
  >
) {
  return useMutation(CREATE_WEBHOOK, {
    ...options,
    update(cache: any, result: any) {
      const data = result?.data;
      if (data?.createWebhook.webhook) {
        // Update the webhooks list cache
        const existingWebhooks = cache.readQuery({
          query: GET_WEBHOOKS,
        }) as { webhooks: Webhook[] } | null;

        if (existingWebhooks) {
          cache.writeQuery({
            query: GET_WEBHOOKS,
            data: {
              webhooks: [...existingWebhooks.webhooks, data.createWebhook.webhook],
            },
          });
        }
      }

      // Call user-provided update function if exists
      (options?.update as any)?.(cache, result, {});
    },
  });
}

/**
 * Update an existing webhook
 */
export function useUpdateWebhook(
  options?: MutationHookOptions<
    {
      updateWebhook: {
        webhook: Webhook | null;
        errors: FieldError[];
      };
    },
    { id: string; input: UpdateWebhookInput }
  >
) {
  return useMutation(UPDATE_WEBHOOK, {
    ...options,
    update(cache: any, result: any) {
      const data = result?.data;
      if (data?.updateWebhook.webhook) {
        // Update the specific webhook in cache
        cache.writeQuery({
          query: GET_WEBHOOK,
          variables: { id: data.updateWebhook.webhook.id },
          data: { webhook: data.updateWebhook.webhook },
        });
      }

      // Call user-provided update function if exists
      (options?.update as any)?.(cache, result, {});
    },
  });
}

/**
 * Delete a webhook
 */
export function useDeleteWebhook(
  options?: MutationHookOptions<
    {
      deleteWebhook: {
        success: boolean;
        deletedId: string | null;
        errors: FieldError[];
      };
    },
    { id: string }
  >
) {
  return useMutation(DELETE_WEBHOOK, {
    ...options,
    update(cache: any, result: any) {
      const data = result?.data;
      if (data?.deleteWebhook.success && data.deleteWebhook.deletedId) {
        // Remove webhook from cache
        const deletedId = data.deleteWebhook.deletedId;

        // Evict the specific webhook from cache
        cache.evict({ id: cache.identify({ __typename: 'Webhook', id: deletedId }) });
        cache.gc();

        // Update the webhooks list cache
        const existingWebhooks = cache.readQuery({
          query: GET_WEBHOOKS,
        }) as { webhooks: Webhook[] } | null;

        if (existingWebhooks) {
          cache.writeQuery({
            query: GET_WEBHOOKS,
            data: {
              webhooks: existingWebhooks.webhooks.filter((w: Webhook) => w.id !== deletedId),
            },
          });
        }
      }

      // Call user-provided update function if exists
      (options?.update as any)?.(cache, result, {});
    },
  });
}

/**
 * Test a webhook by sending a test notification
 */
export function useTestWebhook(
  options?: MutationHookOptions<
    {
      testWebhook: {
        result: WebhookTestResult | null;
        errors: FieldError[];
      };
    },
    { id: string }
  >
) {
  return useMutation<
    {
      testWebhook: {
        result: WebhookTestResult | null;
        errors: FieldError[];
      };
    },
    { id: string }
  >(TEST_WEBHOOK, options);
}
