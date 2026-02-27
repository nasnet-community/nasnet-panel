---
sidebar_position: 13
title: TanStack Query Modules — REST-Only Endpoints
---

# TanStack Query Modules

While the majority of NasNetConnect uses Apollo Client for GraphQL, there are three specialized
domains that communicate with REST-only endpoints and require TanStack Query (React Query) instead:
**batch jobs**, **OUI/MAC vendor lookups**, and **connection testing**. This document covers each
module, their caching strategies, and when to use them.

## Decision Boundary: GraphQL vs. REST

| Endpoint Type                              | Transport          | Caching                             | Module                         |
| ------------------------------------------ | ------------------ | ----------------------------------- | ------------------------------ |
| Structured data (resources, config, state) | GraphQL via Apollo | Apollo cache + IndexedDB            | Apollo hooks in `queries/src/` |
| Batch job operations                       | REST only          | TanStack Query                      | `batch/useBatchJob`            |
| MAC vendor lookup                          | REST only          | TanStack Query (infinite staleTime) | `oui/useVendorLookup`          |
| Router connection test                     | REST only          | TanStack Query                      | `discovery/useTestConnection`  |

**Rule:** If the backend exposes a GraphQL resolver, use Apollo. If it's a REST-only endpoint, use
TanStack Query.

---

## Batch Jobs Module

**Reference:** `libs/api-client/queries/src/batch/useBatchJob.ts`

Batch jobs allow you to submit multiple router configuration commands in a single transaction, with
optional rollback on failure. The batch module polls the job status in real-time and automatically
stops polling when the job reaches a terminal state (completed, failed, cancelled, rolled_back).

### API Endpoints

```
POST   /api/batch/jobs              # Create a batch job
GET    /api/batch/jobs/{jobId}      # Fetch job status
DELETE /api/batch/jobs/{jobId}      # Cancel a running job
```

### Types

```typescript
export type BatchProtocol = 'api' | 'ssh' | 'telnet';

export type BatchJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'rolled_back';

export interface BatchJob {
  id: string;
  routerIp: string;
  protocol: BatchProtocol;
  status: BatchJobStatus;
  progress: BatchJobProgress;
  currentCommand?: string;
  errors: BatchJobError[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  dryRun: boolean;
  rollbackEnabled: boolean;
  rollbackCount?: number;
}

export interface BatchJobProgress {
  total: number;
  current: number;
  percent: number;
  succeeded: number;
  failed: number;
  skipped: number;
}

export interface BatchJobError {
  lineNumber: number;
  command: string;
  error: string;
  timestamp: string;
}

export interface CreateBatchJobRequest {
  routerIp: string;
  username: string;
  password: string;
  protocol: BatchProtocol;
  useTls?: boolean;
  script?: string;
  commands?: string[];
  dryRun?: boolean;
  rollbackEnabled?: boolean;
}

export interface CreateBatchJobResponse {
  jobId: string;
  totalCommands: number;
  status: BatchJobStatus;
}
```

### Query Keys

```typescript
export const batchKeys = {
  all: ['batch'], // all batch queries
  job: (jobId: string) => [...batchKeys.all, 'job', jobId], // specific job
};
```

### useBatchJob Hook

Fetches batch job status with automatic polling while the job is running.

```typescript
export function useBatchJob(
  jobId: string | null,
  options?: {
    pollingInterval?: number; // default: 1000ms
  }
): UseQueryResult<BatchJob, Error>;
```

**Behavior:**

- Automatically polls while status is `pending` or `running`
- Stops polling when status is `completed`, `failed`, `cancelled`, or `rolled_back`
- Returns `enabled: false` if `jobId` is null
- `staleTime: 0` for real-time updates
- `retry: 2` on network errors

**Example:**

```typescript
import { useBatchJob } from '@nasnet/api-client/queries';

function JobProgress({ jobId }: { jobId: string }) {
  const { data: job, isLoading, error } = useBatchJob(jobId);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorAlert error={error} />;

  const { progress, status } = job!;

  return (
    <div>
      <ProgressBar value={progress.percent} />
      <p>
        {progress.current} of {progress.total} completed
      </p>
      <ul>
        <li>Succeeded: {progress.succeeded}</li>
        <li>Failed: {progress.failed}</li>
        <li>Skipped: {progress.skipped}</li>
      </ul>
      {job.errors.length > 0 && (
        <ErrorList errors={job.errors} />
      )}
      {status === 'completed' && <SuccessAlert />}
      {status === 'failed' && <FailureAlert />}
    </div>
  );
}
```

### useCreateBatchJob Hook

Creates a new batch job and automatically pre-populates the cache with initial state.

```typescript
export function useCreateBatchJob(): UseMutationResult<
  CreateBatchJobResponse,
  Error,
  CreateBatchJobRequest
>;
```

**Behavior:**

- On success: Invalidates all batch queries and pre-populates the job query cache
- Transforms API response (snake_case) to camelCase
- Throws error with message from API or statusText

**Example:**

```typescript
import { useCreateBatchJob } from '@nasnet/api-client/queries';

function ConfigurationApply() {
  const createJob = useCreateBatchJob();

  const handleApply = async (script: string) => {
    try {
      const result = await createJob.mutateAsync({
        routerIp: '192.168.88.1',
        username: 'admin',
        password: 'password',
        protocol: 'api',
        script,
        dryRun: false,
        rollbackEnabled: true,
      });

      console.log(`Job ${result.jobId} created with ${result.totalCommands} commands`);
      // Navigate to job progress page
    } catch (error) {
      console.error('Failed to create job:', error.message);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const script = e.currentTarget.script.value;
      handleApply(script);
    }}>
      <textarea name="script" placeholder="Enter configuration commands..." />
      <button type="submit" disabled={createJob.isPending}>
        {createJob.isPending ? 'Creating...' : 'Apply Configuration'}
      </button>
    </form>
  );
}
```

### useCancelBatchJob Hook

Cancels a running batch job.

```typescript
export function useCancelBatchJob(): UseMutationResult<
  void,
  Error,
  string // jobId
>;
```

**Behavior:**

- Sends DELETE request to `/api/batch/jobs/{jobId}`
- On success: Invalidates the specific job's query cache to refetch updated status
- No response body expected

**Example:**

```typescript
import { useCancelBatchJob } from '@nasnet/api-client/queries';

function CancelJobButton({ jobId }: { jobId: string }) {
  const cancelJob = useCancelBatchJob();

  return (
    <button
      onClick={() => {
        if (confirm('Are you sure you want to cancel this job?')) {
          cancelJob.mutate(jobId);
        }
      }}
      disabled={cancelJob.isPending}
    >
      {cancelJob.isPending ? 'Cancelling...' : 'Cancel Job'}
    </button>
  );
}
```

---

## OUI / MAC Vendor Lookup Module

**Reference:** `libs/api-client/queries/src/oui/useVendorLookup.ts`

OUI (Organizationally Unique Identifier) lookups translate MAC addresses to vendor names. Used in
DHCP leases, ARP tables, and connected device lists. Vendor data is static and never changes, so we
cache indefinitely.

### API Endpoints

```
GET  /api/oui/{macAddress}       # Lookup single vendor
POST /api/oui/batch              # Lookup multiple vendors
```

### Types

```typescript
interface VendorResponse {
  mac: string;
  vendor?: string;
  found: boolean;
}

interface BatchVendorResponse {
  results: Record<string, string>;
  count: number;
}
```

### Query Keys

```typescript
export const ouiKeys = {
  all: ['oui'],
  vendor: (mac: string) => [...ouiKeys.all, 'vendor', mac],
  batch: (macs: string[]) => [...ouiKeys.all, 'batch', ...macs],
};
```

### useVendorLookup Hook

Looks up the vendor name for a single MAC address.

```typescript
export function useVendorLookup(macAddress: string): string | null;
```

**Behavior:**

- `staleTime: Infinity` — Vendor data never changes; never refetch
- `gcTime: 24h` — Keep in cache for 24 hours, then garbage collect
- `enabled: false` if macAddress is falsy or less than 17 chars (AA:BB:CC:DD:EE:FF)
- Returns `null` if vendor not found or query is disabled

**Example:**

```typescript
import { useVendorLookup } from '@nasnet/api-client/queries';

function DHCPLeaseRow({ lease }: { lease: DHCPLease }) {
  const vendor = useVendorLookup(lease.macAddress);

  return (
    <tr>
      <td>{lease.ipAddress}</td>
      <td>{lease.macAddress}</td>
      <td>{vendor || <em>Unknown vendor</em>}</td>
      <td>{lease.hostname}</td>
    </tr>
  );
}
```

### useBatchVendorLookup Hook

Looks up vendors for multiple MAC addresses in a single request. More efficient than calling
`useVendorLookup` multiple times.

```typescript
export function useBatchVendorLookup(macAddresses: string[]): Record<string, string>;
```

**Behavior:**

- `staleTime: Infinity` — Vendor data never changes
- `gcTime: 24h` — Cache for 24 hours
- `enabled: false` if macAddresses is empty
- Returns empty object `{}` if query is disabled

**Example:**

```typescript
import { useBatchVendorLookup } from '@nasnet/api-client/queries';

function ConnectedDevicesTable({ devices }: { devices: Device[] }) {
  const macs = devices.map((d) => d.macAddress);
  const vendors = useBatchVendorLookup(macs);

  return (
    <table>
      <tbody>
        {devices.map((device) => (
          <tr key={device.id}>
            <td>{device.ipAddress}</td>
            <td>{device.macAddress}</td>
            <td>{vendors[device.macAddress] || 'Unknown'}</td>
            <td>{device.hostname}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Performance Notes

- A single lookup is faster for one or two MACs
- Batch lookups are more efficient for 5+ MACs
- Consider batching if rendering a table with many devices

---

## Connection Testing Module

**Reference:** `libs/api-client/queries/src/discovery/useTestConnection.ts`

Connection testing validates router credentials by attempting to connect and retrieve system
information. Used during the router setup flow.

### API / Types

The hook uses the `validateCredentials` function from `@nasnet/features/router-discovery`:

```typescript
export interface TestConnectionInput {
  ipAddress: string;
  credentials: RouterCredentials;
}

// Returns from validateCredentials (from router-discovery feature)
interface CredentialValidationResult {
  isValid: boolean;
  routerInfo?: {
    identity: string;
    version: string;
    architecture: string;
  };
  error?: string;
}
```

### Query Keys

```typescript
export const connectionKeys = {
  all: ['connection'],
  test: (ip: string) => [...connectionKeys.all, 'test', ip],
};
```

### useTestConnection Hook

Validates credentials by attempting to connect to a router.

```typescript
export function useTestConnection(): UseMutationResult<
  CredentialValidationResult,
  Error,
  TestConnectionInput
>;
```

**Behavior:**

- `retry: false` — Do not retry on network errors (immediate feedback for auth failures)
- Calls `validateCredentials` which performs SSH/API connection
- Does not cache results (each test is independent)

**Example:**

```typescript
import { useTestConnection } from '@nasnet/api-client/queries';

function RouterLoginForm({ routerIp }: { routerIp: string }) {
  const testConnection = useTestConnection();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    testConnection.mutate(
      {
        ipAddress: routerIp,
        credentials: {
          username: formData.get('username') as string,
          password: formData.get('password') as string,
        },
      },
      {
        onSuccess: (result) => {
          if (result.isValid) {
            console.log(`Connected to ${result.routerInfo?.identity}`);
            // Save router and navigate
          } else {
            console.error('Connection failed:', result.error);
          }
        },
        onError: (error) => {
          console.error('Test failed:', error.message);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="username"
        placeholder="Username"
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        required
      />
      <button type="submit" disabled={testConnection.isPending}>
        {testConnection.isPending ? 'Testing...' : 'Test Connection'}
      </button>

      {testConnection.data?.isValid && (
        <SuccessAlert message={`Connected to ${testConnection.data.routerInfo?.identity}`} />
      )}

      {testConnection.data && !testConnection.data.isValid && (
        <ErrorAlert message={testConnection.data.error} />
      )}

      {testConnection.isError && (
        <ErrorAlert message={testConnection.error.message} />
      )}
    </form>
  );
}
```

---

## Caching Strategy Comparison

| Module              | Query Type        | staleTime      | gcTime  | Refetch Trigger          |
| ------------------- | ----------------- | -------------- | ------- | ------------------------ |
| **Batch Jobs**      | Real-time polling | 0ms            | default | Auto-poll until terminal |
| **Vendor Lookup**   | Static data       | Infinity       | 24h     | Manual (invalidate)      |
| **Connection Test** | One-time test     | N/A (mutation) | N/A     | User action              |

---

## Integration with Apollo

These TanStack Query modules live alongside Apollo and do **not** conflict:

```typescript
// Apollo query for router data
const { data: router } = useGetRouter(routerId);

// TanStack Query for batch job
const { data: job } = useBatchJob(jobId);

// TanStack Query for vendors
const vendors = useBatchVendorLookup(router.devices.map((d) => d.mac));
```

The `QueryClient` is set up in the ApolloProvider and can be accessed from feature components.

---

## Best Practices

### Batch Jobs

1. **Always check terminal state:** Use the `status` field to determine if polling should stop.
2. **Display progress:** Show `progress.percent` and command counts to keep users informed.
3. **Handle errors:** Parse the `errors` array to show which commands failed.
4. **Rollback awareness:** Indicate `rollbackCount` if rollback was triggered.
5. **Timeout handling:** Set a reasonable timeout (e.g., 5 minutes) for hung jobs.

### Vendor Lookup

1. **Batch when possible:** If rendering a list of 5+ devices, use `useBatchVendorLookup`.
2. **Fallback UI:** Always provide a fallback for unknown vendors.
3. **No refetch:** Trust that vendor data is static; don't add manual invalidation.
4. **Cache hit:** Subsequent lookups of the same MAC are instant from cache.

### Connection Testing

1. **No caching:** Test results are one-time; don't expect cached data.
2. **Disable retry:** Let auth failures fail fast for immediate user feedback.
3. **Display router info:** On success, show router identity/version for confirmation.
4. **Error clarity:** Map error messages to user-friendly text (e.g., "Incorrect password" vs.
   "Network unreachable").

---

## Cross-References

- [Domain Query Hooks](./domain-query-hooks.md) — Full query hook catalog
- [Offline First](./offline-first.md) — How offline detection affects REST calls
- [Testing and Codegen](./testing-and-codegen.md) — Mocking REST endpoints in tests
