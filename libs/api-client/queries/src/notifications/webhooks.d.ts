/**
 * Webhook Notifications GraphQL Operations and Hooks
 * NAS-18.4: Webhook Notifications Feature
 *
 * Apollo Client hooks for webhook management and notification logs.
 * Provides CRUD operations, testing, and delivery monitoring.
 */
import { type QueryHookOptions, type MutationHookOptions } from '@apollo/client';
/**
 * Core Webhook fields fragment
 */
export declare const WEBHOOK_FIELDS: import("graphql").DocumentNode;
/**
 * NotificationLog fields fragment
 */
export declare const NOTIFICATION_LOG_FIELDS: import("graphql").DocumentNode;
/**
 * Get all webhooks
 */
export declare const GET_WEBHOOKS: import("graphql").DocumentNode;
/**
 * Get a single webhook by ID
 *
 * @param id - Webhook ID
 */
export declare const GET_WEBHOOK: import("graphql").DocumentNode;
/**
 * Get notification logs with optional filtering
 *
 * @param channel - Filter by channel type (optional)
 * @param webhookId - Filter by webhook ID (optional)
 * @param status - Filter by delivery status (optional)
 * @param limit - Maximum number of logs to return (optional)
 */
export declare const GET_NOTIFICATION_LOGS: import("graphql").DocumentNode;
/**
 * Create a new webhook
 *
 * @param input - Webhook creation input
 */
export declare const CREATE_WEBHOOK: import("graphql").DocumentNode;
/**
 * Update an existing webhook
 *
 * @param id - Webhook ID
 * @param input - Webhook update input
 */
export declare const UPDATE_WEBHOOK: import("graphql").DocumentNode;
/**
 * Delete a webhook
 *
 * @param id - Webhook ID
 */
export declare const DELETE_WEBHOOK: import("graphql").DocumentNode;
/**
 * Test a webhook by sending a test notification
 *
 * @param id - Webhook ID to test
 */
export declare const TEST_WEBHOOK: import("graphql").DocumentNode;
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
/**
 * Fetch all webhooks
 */
export declare function useWebhooks(options?: QueryHookOptions<{
    webhooks: Webhook[];
}, Record<string, never>>): import("@apollo/client").InteropQueryResult<{
    webhooks: Webhook[];
}, Record<string, never>>;
/**
 * Fetch a single webhook by ID
 */
export declare function useWebhook(id: string, options?: QueryHookOptions<{
    webhook: Webhook | null;
}, {
    id: string;
}>): import("@apollo/client").InteropQueryResult<{
    webhook: Webhook | null;
}, {
    id: string;
}>;
/**
 * Fetch notification logs with optional filtering
 */
interface NotificationLogVariables {
    channel?: string;
    webhookId?: string;
    status?: 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';
    limit?: number;
}
export declare function useNotificationLogs(variables?: NotificationLogVariables, options?: Omit<QueryHookOptions, 'variables'>): import("@apollo/client").InteropQueryResult<any, import("@apollo/client").OperationVariables>;
/**
 * Create a new webhook
 */
export declare function useCreateWebhook(options?: MutationHookOptions<{
    createWebhook: {
        webhook: Webhook | null;
        errors: FieldError[];
    };
}, {
    input: CreateWebhookInput;
}>): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, any>;
/**
 * Update an existing webhook
 */
export declare function useUpdateWebhook(options?: MutationHookOptions<{
    updateWebhook: {
        webhook: Webhook | null;
        errors: FieldError[];
    };
}, {
    id: string;
    input: UpdateWebhookInput;
}>): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, any>;
/**
 * Delete a webhook
 */
export declare function useDeleteWebhook(options?: MutationHookOptions<{
    deleteWebhook: {
        success: boolean;
        deletedId: string | null;
        errors: FieldError[];
    };
}, {
    id: string;
}>): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, any>;
/**
 * Test a webhook by sending a test notification
 */
export declare function useTestWebhook(options?: MutationHookOptions<{
    testWebhook: {
        result: WebhookTestResult | null;
        errors: FieldError[];
    };
}, {
    id: string;
}>): import("@apollo/client").MutationTuple<{
    testWebhook: {
        result: WebhookTestResult | null;
        errors: FieldError[];
    };
}, {
    id: string;
}, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
export {};
//# sourceMappingURL=webhooks.d.ts.map