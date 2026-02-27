---
sidebar_position: 14
title: Notifications and Webhooks — Alert Delivery Integration
---

# Notifications and Webhooks

This document covers the webhook management system that integrates with the alerts feature. Webhooks
allow NasNetConnect to deliver alert notifications to external services like Slack, Discord, custom
HTTP endpoints, and email gateways via HTTP POST.

**Reference:** `libs/api-client/queries/src/notifications/webhooks.ts`

---

## Overview

The notification system has two layers:

1. **Webhook Configuration** — CRUD operations on webhook endpoints, templates, auth, and retry
   settings
2. **Notification Logs** — Audit trail of all webhook deliveries, including response times and
   errors

---

## Types

### Webhook

Core webhook definition with delivery statistics:

```typescript
export interface Webhook {
  id: string;
  name: string;
  description?: string;
  url: string;
  method: string; // HTTP method: GET, POST, etc.
  authType: 'NONE' | 'BASIC' | 'BEARER';
  username?: string;
  bearerToken?: string; // sensitive: redacted in logs
  headers?: Record<string, string>;
  template: 'GENERIC' | 'SLACK' | 'DISCORD' | 'TEAMS' | 'CUSTOM';
  customTemplate?: string; // custom JSON payload template
  signingSecretMasked?: string; // HMAC-SHA256 secret (masked)
  timeoutSeconds: number;
  retryEnabled: boolean;
  maxRetries: number;
  enabled: boolean;
  createdAt: string; // ISO 8601 datetime
  updatedAt: string;
  lastDeliveredAt?: string;
  deliveryStats?: WebhookDeliveryStats;
}

export interface WebhookDeliveryStats {
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  successRate: number; // 0.0–1.0
  avgResponseTimeMs?: number;
}
```

### NotificationLog

Record of a single delivery attempt:

```typescript
export interface NotificationLog {
  id: string;
  alertId: string; // Alert that triggered this notification
  channel: string; // e.g., 'webhook', 'email', 'sms'
  webhookId?: string; // Reference to webhook if delivery via webhook
  status: 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';
  statusCode?: number; // HTTP status code
  responseTimeMs?: number; // Response latency
  errorMessage?: string;
  retryCount: number; // Number of retries attempted
  requestPayload?: Record<string, unknown>; // What was sent
  responseBody?: string;
  attemptedAt: string; // ISO 8601 timestamp
  completedAt?: string; // When delivery completed (or failed finally)
}
```

### Webhook Input Types

**CreateWebhookInput:**

```typescript
export interface CreateWebhookInput {
  name: string;
  description?: string;
  url: string;
  method?: string; // default: 'POST'
  authType?: 'NONE' | 'BASIC' | 'BEARER';
  username?: string;
  password?: string; // @sensitive
  bearerToken?: string; // @sensitive
  headers?: Record<string, string>;
  template?: 'GENERIC' | 'SLACK' | 'DISCORD' | 'TEAMS' | 'CUSTOM';
  customTemplate?: string;
  signingSecret?: string; // @sensitive, for HMAC signing
  timeoutSeconds?: number; // default: 10
  retryEnabled?: boolean; // default: true
  maxRetries?: number; // default: 3
  enabled?: boolean; // default: true
}
```

**UpdateWebhookInput:**

All fields from CreateWebhookInput are optional for updates.

### WebhookTestResult

Response from testing a webhook:

```typescript
export interface WebhookTestResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  responseTimeMs?: number;
  errorMessage?: string;
}
```

---

## GraphQL Fragments

### WEBHOOK_FIELDS

Reusable fragment selecting all webhook fields including delivery stats:

```graphql
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
```

### NOTIFICATION_LOG_FIELDS

Fragment for notification logs:

```graphql
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
```

---

## Query Hooks

### useWebhooks

Fetch all webhooks for the current router/account:

```typescript
export function useWebhooks(
  options?: QueryHookOptions<{ webhooks: Webhook[] }, Record<string, never>>
): UseQueryResult<{ webhooks: Webhook[] }, ...>
```

**Example:**

```typescript
import { useWebhooks } from '@nasnet/api-client/queries';

function WebhookList() {
  const { data, isLoading, error } = useWebhooks();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorAlert error={error} />;

  const { webhooks } = data!;

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Template</th>
          <th>Status</th>
          <th>Success Rate</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {webhooks.map((webhook) => (
          <tr key={webhook.id}>
            <td>{webhook.name}</td>
            <td>{webhook.template}</td>
            <td>
              <Badge status={webhook.enabled ? 'success' : 'warning'}>
                {webhook.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </td>
            <td>
              {webhook.deliveryStats && (
                `${(webhook.deliveryStats.successRate * 100).toFixed(1)}%`
              )}
            </td>
            <td>
              <EditButton webhookId={webhook.id} />
              <DeleteButton webhookId={webhook.id} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### useWebhook

Fetch a single webhook by ID:

```typescript
export function useWebhook(
  id: string,
  options?: QueryHookOptions<{ webhook: Webhook | null }, { id: string }>
): UseQueryResult<{ webhook: Webhook | null }, ...>
```

**Example:**

```typescript
import { useWebhook } from '@nasnet/api-client/queries';

function WebhookDetail({ webhookId }: { webhookId: string }) {
  const { data, isLoading, error } = useWebhook(webhookId);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorAlert error={error} />;

  const { webhook } = data!;

  return (
    <form>
      <h2>{webhook?.name}</h2>
      <p>URL: {webhook?.url}</p>
      <p>Template: {webhook?.template}</p>
      <p>Success Rate: {webhook?.deliveryStats?.successRate.toFixed(2)}</p>
      {webhook?.description && (
        <p>Description: {webhook.description}</p>
      )}
    </form>
  );
}
```

### useNotificationLogs

Fetch notification logs with optional filtering:

```typescript
export function useNotificationLogs(
  variables?: {
    channel?: string;
    webhookId?: string;
    status?: 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';
    limit?: number;
  },
  options?: Omit<QueryHookOptions, 'variables'>
): UseQueryResult<{ notificationLogs: NotificationLog[] }, ...>
```

**Example:**

```typescript
import { useNotificationLogs } from '@nasnet/api-client/queries';

function WebhookDeliveryLog({ webhookId }: { webhookId: string }) {
  const { data, isLoading } = useNotificationLogs(
    { webhookId, limit: 50, status: 'FAILED' },  // Show last 50 failures
    { refetchInterval: 10000 }  // Refetch every 10 seconds
  );

  if (isLoading) return <Spinner />;

  const { notificationLogs } = data!;

  return (
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Alert ID</th>
          <th>Status</th>
          <th>Response Time</th>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>
        {notificationLogs.map((log) => (
          <tr key={log.id}>
            <td>{new Date(log.attemptedAt).toLocaleString()}</td>
            <td>{log.alertId}</td>
            <td>
              <Badge status={log.status === 'SENT' ? 'success' : 'error'}>
                {log.status}
              </Badge>
            </td>
            <td>{log.responseTimeMs}ms</td>
            <td>{log.errorMessage || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Mutation Hooks

### useCreateWebhook

Create a new webhook:

```typescript
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
): UseMutationResult<...>
```

**Cache behavior:**

- On success, automatically adds the new webhook to the `GET_WEBHOOKS` cache
- Calls user-provided `update` function if provided

**Example:**

```typescript
import { useCreateWebhook } from '@nasnet/api-client/queries';

function CreateWebhookForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateWebhookInput>({
    resolver: zodResolver(CreateWebhookInputSchema),
  });

  const createWebhook = useCreateWebhook({
    onSuccess: (data) => {
      if (data.createWebhook.errors.length > 0) {
        showErrorToast('Validation errors', data.createWebhook.errors);
      } else {
        showSuccessToast(`Webhook "${data.createWebhook.webhook?.name}" created`);
        // Reset form or navigate
      }
    },
  });

  const onSubmit = (input: CreateWebhookInput) => {
    createWebhook.mutate({ input });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('name')}
        placeholder="Webhook name"
      />
      {errors.name && <p>{errors.name.message}</p>}

      <input
        {...register('url')}
        placeholder="https://hooks.slack.com/..."
        type="url"
      />
      {errors.url && <p>{errors.url.message}</p>}

      <select {...register('template')}>
        <option value="GENERIC">Generic</option>
        <option value="SLACK">Slack</option>
        <option value="DISCORD">Discord</option>
        <option value="TEAMS">Microsoft Teams</option>
        <option value="CUSTOM">Custom JSON</option>
      </select>

      <button type="submit" disabled={createWebhook.isPending}>
        {createWebhook.isPending ? 'Creating...' : 'Create Webhook'}
      </button>
    </form>
  );
}
```

### useUpdateWebhook

Update an existing webhook:

```typescript
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
): UseMutationResult<...>
```

**Cache behavior:**

- On success, updates the specific webhook in cache via `GET_WEBHOOK` query
- Calls user-provided `update` function if provided

**Example:**

```typescript
import { useUpdateWebhook } from '@nasnet/api-client/queries';

function EditWebhookForm({ webhookId }: { webhookId: string }) {
  const { data } = useWebhook(webhookId);
  const { register, handleSubmit, formState: { errors } } = useForm<UpdateWebhookInput>({
    defaultValues: data?.webhook,
  });

  const updateWebhook = useUpdateWebhook({
    onSuccess: (data) => {
      if (data.updateWebhook.errors.length > 0) {
        showErrorToast('Validation errors', data.updateWebhook.errors);
      } else {
        showSuccessToast(`Webhook updated`);
      }
    },
  });

  const onSubmit = (input: UpdateWebhookInput) => {
    updateWebhook.mutate({ id: webhookId, input });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
      <button type="submit" disabled={updateWebhook.isPending}>
        {updateWebhook.isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

### useDeleteWebhook

Delete a webhook:

```typescript
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
): UseMutationResult<...>
```

**Cache behavior:**

- On success: Evicts the deleted webhook from cache via `cache.evict()` and `cache.gc()`
- Updates the `GET_WEBHOOKS` list to remove the deleted item
- Calls user-provided `update` function if provided

**Example:**

```typescript
import { useDeleteWebhook } from '@nasnet/api-client/queries';

function DeleteWebhookButton({ webhookId, webhookName }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const deleteWebhook = useDeleteWebhook({
    onSuccess: (data) => {
      if (data.deleteWebhook.success) {
        showSuccessToast(`Webhook deleted`);
        setIsOpen(false);
        // Navigate back to list
      } else {
        showErrorToast('Failed to delete webhook');
      }
    },
  });

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Delete
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        title="Delete Webhook?"
        message={`Are you sure you want to delete "${webhookName}"?`}
        onConfirm={() => deleteWebhook.mutate({ id: webhookId })}
        onCancel={() => setIsOpen(false)}
        isLoading={deleteWebhook.isPending}
      />
    </>
  );
}
```

### useTestWebhook

Test a webhook by sending a test notification:

```typescript
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
): UseMutationResult<...>
```

**Example:**

```typescript
import { useTestWebhook } from '@nasnet/api-client/queries';

function TestWebhookButton({ webhookId }: { webhookId: string }) {
  const testWebhook = useTestWebhook({
    onSuccess: (data) => {
      const { result, errors } = data.testWebhook;

      if (errors.length > 0) {
        showErrorToast('Validation error', errors[0].message);
      } else if (result?.success) {
        showSuccessToast(
          `Webhook test successful (${result.responseTimeMs}ms, HTTP ${result.statusCode})`
        );
      } else {
        showErrorToast(
          `Webhook test failed: ${result?.errorMessage || 'Unknown error'}`
        );
      }
    },
  });

  return (
    <button
      onClick={() => testWebhook.mutate({ id: webhookId })}
      disabled={testWebhook.isPending}
    >
      {testWebhook.isPending ? 'Testing...' : 'Send Test'}
    </button>
  );
}
```

---

## Cache Update Strategies

### Add to List (on Create)

```typescript
// In useCreateWebhook mutation:
update(cache, result) {
  const data = result?.data;
  if (data?.createWebhook.webhook) {
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
}
```

### In-Place Update (on Update)

```typescript
// In useUpdateWebhook mutation:
update(cache, result) {
  const data = result?.data;
  if (data?.updateWebhook.webhook) {
    cache.writeQuery({
      query: GET_WEBHOOK,
      variables: { id: data.updateWebhook.webhook.id },
      data: { webhook: data.updateWebhook.webhook },
    });
  }
}
```

### Evict + GC (on Delete)

```typescript
// In useDeleteWebhook mutation:
update(cache, result) {
  const data = result?.data;
  if (data?.deleteWebhook.success && data.deleteWebhook.deletedId) {
    const deletedId = data.deleteWebhook.deletedId;

    // Remove from cache
    cache.evict({
      id: cache.identify({ __typename: 'Webhook', id: deletedId })
    });
    cache.gc();  // Garbage collect orphaned references

    // Update list
    const existing = cache.readQuery({ query: GET_WEBHOOKS }) as
      { webhooks: Webhook[] } | null;

    if (existing) {
      cache.writeQuery({
        query: GET_WEBHOOKS,
        data: {
          webhooks: existing.webhooks.filter((w) => w.id !== deletedId),
        },
      });
    }
  }
}
```

---

## Integration with Alerts

Webhooks are linked to alert rules in the alerts domain. When an alert fires, the alert engine
checks which webhooks are enabled and attempts delivery:

```
Alert Rule → Evaluates → Matches Condition
          → Finds Enabled Webhooks
          → Sends Notification Log (PENDING)
          → TanStack Query Polling
          → Eventually: SENT or FAILED
          → Retry if retryEnabled + attempt < maxRetries
```

**Reference:** [Alerts Domain](./domain-query-hooks.md#6-alerts-domain)

---

## Template Types

| Template    | Format                        | Use Case              |
| ----------- | ----------------------------- | --------------------- |
| **GENERIC** | JSON body with alert fields   | Custom endpoints      |
| **SLACK**   | Slack Block Kit JSON          | Slack channels        |
| **DISCORD** | Discord Embed JSON            | Discord servers       |
| **TEAMS**   | Microsoft Teams Adaptive Card | Teams channels        |
| **CUSTOM**  | User-defined JSON template    | Advanced integrations |

For **CUSTOM** templates, use placeholders like `{{alertName}}`, `{{severity}}`, `{{message}}` that
the backend substitutes.

---

## Error Codes

| Code    | Meaning                             | Recovery                        |
| ------- | ----------------------------------- | ------------------------------- |
| `W1001` | Webhook URL invalid                 | User edits URL format           |
| `W1002` | Webhook timeout                     | Increase `timeoutSeconds`       |
| `W1003` | Auth failed (401/403)               | Check credentials, bearer token |
| `W1004` | HTTP 5xx from endpoint              | Retry (automatic or manual)     |
| `W1005` | JSON parse error (request/response) | Check custom template syntax    |
| `W1006` | Network unreachable                 | Endpoint is down; add retry     |

---

## Best Practices

1. **Test before enabling:** Always use `useTestWebhook` before enabling a new webhook.
2. **Monitor delivery logs:** Regularly check logs for patterns (consistent failures, timeouts).
3. **Set appropriate timeouts:** Slack/Discord usually respond in `<2s`; use `timeoutSeconds: 10`
   for safety.
4. **Use templates:** Prefer built-in templates (SLACK, DISCORD, TEAMS) over CUSTOM JSON when
   possible.
5. **Retry settings:** Enable retries for important alerts; `maxRetries: 3` is reasonable.
6. **Auth security:** Never log bearer tokens or passwords; use `@sensitive` directive.
7. **Rate limiting:** Be aware of endpoint rate limits; batch alerts if needed.
8. **Headers:** Add custom headers (e.g., `X-Alert-Source: NasNetConnect`) for tracking.

---

## Cross-References

- [Domain Query Hooks](./domain-query-hooks.md#15-notifications-domain) — Full notifications domain
  reference
- [Alerts Domain](./domain-query-hooks.md#6-alerts-domain) — Alert rules that trigger webhooks
- [Error Handling](./error-handling.md) — Error code taxonomy
- [GraphQL Schema Contracts](./graphql-schema-contracts.md) — @sensitive directive for redaction
