---
sidebar_position: 12
title: Error Handling
---

# Error Handling (Layer 2)

NasNetConnect provides a comprehensive error boundary system and error UI components to gracefully handle failures at every level of the application. Error boundaries prevent entire app crashes when individual components or features fail, ensuring users can recover and continue working.

This document covers the error boundary hierarchy, error display components, and integration patterns for both Layer 2 (Patterns) and applications.

---

## Error Boundary Hierarchy

Error boundaries in NasNetConnect are organized into a three-tier hierarchy, from outermost to innermost:

```
AppErrorBoundary (catastrophic failures → full-page error)
    ↓
RouteErrorBoundary (route-level errors → per-route isolation)
    ↓
ComponentErrorBoundary (feature errors → inline recovery)
```

Each level catches errors that escape from inner levels and displays an appropriate fallback UI. This layering prevents a single error from crashing the entire application.

### AppErrorBoundary

The outermost error boundary that catches catastrophic failures escaping all other boundaries.

**File:** `libs/ui/patterns/src/error-boundary/AppErrorBoundary.tsx`

**Import:**
```tsx
import { AppErrorBoundary } from '@nasnet/ui/patterns';
```

**Props:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | — | Content to protect |
| `onError` | `(error: Error, errorInfo: React.ErrorInfo) => void` | — | Error logging callback for telemetry |

**Usage:**

Place at the absolute outermost level of your application, wrapping all providers:

```tsx
import { AppErrorBoundary } from '@nasnet/ui/patterns';

export default function App() {
  return (
    <AppErrorBoundary onError={(error, info) => {
      // Log to telemetry service
      console.error('Catastrophic error:', error);
    }}>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </ApolloProvider>
    </AppErrorBoundary>
  );
}
```

**Fallback UI:** Full-page error display with reload button, error details (in dev mode), and issue reporting. Logged errors include timestamp, URL, user agent, and component stack.

---

### RouteErrorBoundary

Route-level error boundary that isolates errors to specific routes and auto-resets on route changes.

**File:** `libs/ui/patterns/src/error-boundary/RouteErrorBoundary.tsx`

**Imports:**
```tsx
import {
  RouteErrorBoundary,
  RouteErrorDisplay
} from '@nasnet/ui/patterns';
```

**Props:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | — | Route content to protect |
| `onError` | `(error: Error, errorInfo: React.ErrorInfo) => void` | — | Error callback |
| `fallback` | `React.ReactNode \| function` | — | Custom fallback UI |
| `className` | `string` | — | Container class name |

**Usage in route components:**

```tsx
function RouterDetailsPage() {
  return (
    <RouteErrorBoundary>
      <RouterDetailsContent />
    </RouteErrorBoundary>
  );
}
```

**Usage with TanStack Router:**

Integrate with TanStack Router's `errorComponent` for layout-level protection:

```tsx
export const Route = createFileRoute('/_layout')({
  component: () => (
    <RouteErrorBoundary>
      <Outlet />
    </RouteErrorBoundary>
  ),
});
```

Or use the standalone `RouteErrorDisplay` component as a TanStack Router errorComponent:

```tsx
export const Route = createFileRoute('/router/$id')({
  errorComponent: ({ error, reset }) => (
    <RouteErrorDisplay error={error} reset={reset} />
  ),
});
```

**Auto-reset:** The boundary automatically resets when the route pathname changes, allowing users to navigate away from the error and return to normal operation.

---

### ComponentErrorBoundary

Feature-level error boundary for individual components/widgets with inline error display.

**File:** `libs/ui/patterns/src/error-boundary/ComponentErrorBoundary.tsx`

**Imports:**
```tsx
import {
  ComponentErrorBoundary,
  InlineErrorCard
} from '@nasnet/ui/patterns';
```

**Props:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | — | Component to protect |
| `onError` | `(error: Error, errorInfo: React.ErrorInfo) => void` | — | Error callback |
| `fallback` | `React.ReactNode \| function` | — | Custom fallback UI |
| `componentName` | `string` | — | Display name in error message |
| `className` | `string` | — | Container class name |
| `minimal` | `boolean` | `false` | Show minimal inline variant |

**Usage - Standard variant:**

```tsx
<ComponentErrorBoundary componentName="User Statistics">
  <UserStatsWidget />
</ComponentErrorBoundary>
```

**Usage - Minimal inline variant:**

```tsx
<ComponentErrorBoundary minimal componentName="Quick Stats">
  <QuickStatsRow />
</ComponentErrorBoundary>
```

**Usage with custom fallback:**

```tsx
<ComponentErrorBoundary
  componentName="Traffic Chart"
  onError={(error) => trackError(error)}
  fallback={({ error, resetErrorBoundary }) => (
    <div className="p-4 bg-amber-50 rounded">
      <p>Chart unavailable</p>
      <button onClick={resetErrorBoundary}>Reload Chart</button>
    </div>
  )}
>
  <DataChart />
</ComponentErrorBoundary>
```

**Fallback UI:** Inline error card showing component name, error message, retry button, and expandable technical details (minimal variant shows icon + title + retry only).

---

## withErrorBoundary HOC

Higher-order component for declaratively wrapping components with ComponentErrorBoundary without modifying JSX structure.

**File:** `libs/ui/patterns/src/error-boundary/withErrorBoundary.tsx`

**Import:**
```tsx
import { withErrorBoundary } from '@nasnet/ui/patterns';
```

**Signature:**

```tsx
function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: WithErrorBoundaryOptions
): React.ComponentType<P>
```

**Options:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `fallback` | `React.ReactNode \| function` | — | Custom fallback UI |
| `onError` | `(error: Error, errorInfo: React.ErrorInfo) => void` | — | Error callback |
| `componentName` | `string` | — | Display name (defaults to Component.displayName or Component.name) |
| `minimal` | `boolean` | `false` | Use minimal error display |
| `className` | `string` | — | Container class name |

**Usage - Basic:**

```tsx
const SafeWidget = withErrorBoundary(MyWidget);

// Use like a normal component
<SafeWidget data={data} />
```

**Usage - With options:**

```tsx
const SafeChart = withErrorBoundary(DataChart, {
  componentName: 'Traffic Chart',
  onError: (error) => analytics.trackError(error),
  minimal: true,
});
```

**Usage - useErrorBoundaryWrapper hook:**

Wrap multiple components with shared error boundary config:

```tsx
function DashboardWidgets() {
  const wrap = useErrorBoundaryWrapper({
    onError: (error) => logError(error),
    minimal: true,
  });

  return (
    <div className="grid grid-cols-3 gap-4">
      {wrap(<CPUWidget />, 'CPU Stats')}
      {wrap(<MemoryWidget />, 'Memory Stats')}
      {wrap(<NetworkWidget />, 'Network Stats')}
    </div>
  );
}
```

---

## Error UI Components

Layer 2 components for displaying errors in various contexts. These are used by error boundaries but can also be used standalone.

### ErrorCard

Inline error display card with retry action, expandable technical details, and multiple variants.

**File:** `libs/ui/patterns/src/error-card/ErrorCard.tsx`

**Import:**
```tsx
import { ErrorCard } from '@nasnet/ui/patterns';
```

**Props:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'error' \| 'warning' \| 'network' \| 'auth' \| 'not-found'` | `'error'` | Error category for styling/icon |
| `title` | `string` | — | Main error title (required) |
| `description` | `string` | — | Human-readable description |
| `technicalMessage` | `string` | — | Technical error message (in details) |
| `errorCode` | `string` | — | Error code badge (e.g., "N300") |
| `stackTrace` | `string` | — | Stack trace (dev mode only) |
| `onRetry` | `() => void` | — | Retry handler |
| `onSecondaryAction` | `() => void` | — | Secondary action handler |
| `secondaryActionLabel` | `string` | — | Secondary action button text |
| `onReport` | `() => void` | — | Issue report handler |
| `variant` | `'default' \| 'compact' \| 'minimal'` | `'default'` | Display variant |
| `autoFocus` | `boolean` | `false` | Auto-focus retry button |
| `className` | `string` | — | Additional class name |

**Usage - Default variant:**

```tsx
<ErrorCard
  type="network"
  title="Connection lost"
  description="Unable to reach the router. Check your network connection."
  errorCode="N300"
  technicalMessage="ECONNREFUSED 192.168.88.1:8728"
  onRetry={reconnect}
  onReport={reportIssue}
/>
```

**Usage - Compact variant (form submission):**

```tsx
<ErrorCard
  variant="compact"
  title="Update failed"
  description="Save operation timed out"
  onRetry={retry}
/>
```

**Usage - Minimal variant (inline, space-constrained):**

```tsx
<ErrorCard
  variant="minimal"
  type="warning"
  title="Partial data loaded"
  onRetry={refetch}
/>
```

---

### ErrorPage

Full-page error display for critical failures that prevent the entire page from functioning.

**File:** `libs/ui/patterns/src/error-page/ErrorPage.tsx`

**Import:**
```tsx
import { ErrorPage } from '@nasnet/ui/patterns';
```

**Props:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'error' \| 'network' \| 'unauthorized' \| 'not-found' \| 'server-error'` | `'error'` | Error type for default messaging |
| `statusCode` | `number` | — | HTTP status code to display |
| `title` | `string` | — | Custom error title |
| `description` | `string` | — | Custom error description |
| `technicalMessage` | `string` | — | Technical error message |
| `errorCode` | `string` | — | Error code identifier |
| `stackTrace` | `string` | — | Stack trace (dev only) |
| `onRetry` | `() => void` | — | Retry handler |
| `retryLabel` | `string` | `'Try Again'` | Retry button label |
| `showHomeButton` | `boolean` | `true` | Show home/dashboard button |
| `showBackButton` | `boolean` | `false` | Show back button |
| `onReport` | `() => void` | — | Report issue handler |
| `className` | `string` | — | Additional class name |
| `children` | `React.ReactNode` | — | Additional content below error |

**Usage - Generic error:**

```tsx
<ErrorPage
  variant="error"
  title="Application crashed"
  onRetry={() => window.location.reload()}
  showHomeButton
/>
```

**Usage - 404 Not Found:**

```tsx
<ErrorPage
  variant="not-found"
  statusCode={404}
  showHomeButton
  showBackButton
/>
```

**Usage - Server error with details:**

```tsx
<ErrorPage
  variant="server-error"
  statusCode={500}
  errorCode="S600"
  technicalMessage="Database connection failed"
  onRetry={refetch}
  onReport={reportError}
/>
```

**Usage - Network error:**

```tsx
<ErrorPage
  variant="network"
  title="Unable to connect to router"
  description="Please check your network and try again"
  retryLabel="Reconnect"
  onRetry={reconnect}
/>
```

---

### NetworkErrorDisplay

Specialized error display for network and connectivity issues with troubleshooting tips and auto-retry status.

**File:** `libs/ui/patterns/src/network-error/NetworkErrorDisplay.tsx`

**Import:**
```tsx
import { NetworkErrorDisplay } from '@nasnet/ui/patterns';
```

**Props:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'offline' \| 'timeout' \| 'connection-refused' \| 'dns-failed' \| 'server-error' \| 'unknown'` | `'unknown'` | Network error type |
| `title` | `string` | — | Custom title (overrides default) |
| `description` | `string` | — | Custom description |
| `technicalMessage` | `string` | — | Technical error message |
| `errorCode` | `string` | — | Error code |
| `onRetry` | `() => void` | — | Retry handler |
| `isRetrying` | `boolean` | `false` | Show auto-retry in progress |
| `retryAttempt` | `number` | — | Current retry attempt number |
| `maxRetries` | `number` | — | Max retry attempts |
| `nextRetryIn` | `number` | — | Seconds until next retry |
| `showTroubleshooting` | `boolean` | `false` | Show troubleshooting tips |
| `onOpenSettings` | `() => void` | — | Open network settings handler |
| `variant` | `'default' \| 'compact'` | `'default'` | Display variant |
| `className` | `string` | — | Additional class name |

**Usage - Basic offline error:**

```tsx
<NetworkErrorDisplay
  type="offline"
  onRetry={() => refetch()}
/>
```

**Usage - With auto-retry progress:**

```tsx
<NetworkErrorDisplay
  type="timeout"
  isRetrying
  retryAttempt={2}
  maxRetries={5}
  nextRetryIn={4}
  onRetry={manualRetry}
/>
```

**Usage - With troubleshooting:**

```tsx
<NetworkErrorDisplay
  type="connection-refused"
  showTroubleshooting
  errorCode="R200"
  technicalMessage="ECONNREFUSED 192.168.88.1:8728"
  onOpenSettings={openNetworkSettings}
/>
```

**Troubleshooting tips include:** Connection status verification, router restart suggestions, IP address verification, firewall checks, and multi-device testing.

**Network status integration:** When type is 'offline', the component detects when connection is restored and shows a "Connection restored" success state.

---

### FormSectionErrors

Form validation error summary for displaying section-level validation errors.

**File:** `libs/ui/patterns/src/form-section/FormSectionErrors.tsx`

**Import:**
```tsx
import { FormSectionErrors } from '@nasnet/ui/patterns';
```

**Props:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `errors` | `string[]` | — | Array of error messages |
| `className` | `string` | — | Additional class name |

**Usage:**

```tsx
<FormSectionErrors
  errors={[
    'IP address is invalid',
    'Subnet mask is required',
  ]}
/>
```

**Features:** Error count display, individual error list with bullets, semantic error styling (red color tokens), ARIA live region for screen readers.

---

## Error Recovery Patterns

### Retry Pattern

Implement exponential backoff for automated retry logic:

```tsx
function useRetryableQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3
) {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  const execute = React.useCallback(async () => {
    setIsRetrying(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      setRetryCount(0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      // Exponential backoff: 1s, 2s, 4s
      const backoffMs = Math.pow(2, retryCount) * 1000;

      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(r => r + 1);
          execute();
        }, backoffMs);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [queryFn, maxRetries, retryCount]);

  return { data, error, isRetrying, retryCount, execute };
}
```

### Fallback UI Pattern

Provide graceful fallback content while error is being handled:

```tsx
function DataTable() {
  return (
    <ComponentErrorBoundary
      componentName="Data Table"
      fallback={({ resetErrorBoundary }) => (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              Unable to load table data
            </p>
            <Button onClick={resetErrorBoundary} variant="outline" size="sm">
              Try again
            </Button>
          </CardContent>
        </Card>
      )}
    >
      <table>
        {/* table content */}
      </table>
    </ComponentErrorBoundary>
  );
}
```

### Error Logging and Reporting

Integrate with observability/telemetry:

```tsx
<AppErrorBoundary
  onError={(error, errorInfo) => {
    // Send to Sentry, Rollbar, or custom backend
    if (import.meta.env.PROD) {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    }
  }}
>
  <App />
</AppErrorBoundary>
```

### User-Friendly Error Messages

Always map technical errors to user-facing messages:

```tsx
function getTechnicalDescription(error: Error): string {
  if (error.message.includes('ECONNREFUSED')) {
    return 'Unable to connect to the router. Is it powered on?';
  }
  if (error.message.includes('timeout')) {
    return 'The connection took too long. Try again or check your network.';
  }
  if (error.message.includes('JSON')) {
    return 'The server sent an unexpected response format.';
  }
  return 'An unexpected error occurred. Please try again.';
}
```

---

## Integration Patterns

### Complete Page Setup

Nested error boundaries with Suspense:

```tsx
import { AppErrorBoundary, RouteErrorBoundary, ComponentErrorBoundary } from '@nasnet/ui/patterns';
import { Suspense } from 'react';

function App() {
  return (
    <AppErrorBoundary onError={logError}>
      <RouterProvider router={router}>
        <Layout />
      </RouterProvider>
    </AppErrorBoundary>
  );
}

function Layout() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<LoadingSkeleton />}>
        <Outlet />
      </Suspense>
    </RouteErrorBoundary>
  );
}

function RouterDetailsPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <ComponentErrorBoundary componentName="Router Info">
        <Suspense fallback={<CardSkeleton />}>
          <RouterInfoCard />
        </Suspense>
      </ComponentErrorBoundary>

      <ComponentErrorBoundary componentName="Traffic Stats">
        <Suspense fallback={<CardSkeleton />}>
          <TrafficStatsWidget />
        </Suspense>
      </ComponentErrorBoundary>

      <ComponentErrorBoundary componentName="Alerts">
        <Suspense fallback={<CardSkeleton />}>
          <AlertsPanel />
        </Suspense>
      </ComponentErrorBoundary>
    </div>
  );
}
```

### Apollo Client Error Handling

Combine error boundaries with Apollo Client error handling:

```tsx
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      console.error(`[GraphQL error]: ${message}`, extensions);
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

const client = new ApolloClient({
  link: ApolloLink.from([errorLink, httpLink]),
  cache: new InMemoryCache(),
});
```

Error boundaries catch render errors from components; Apollo error handling catches GraphQL/network errors from queries and mutations.

### Form Error Integration

Combine ComponentErrorBoundary with form validation errors:

```tsx
function DataForm() {
  const form = useForm({ resolver: zodResolver(schema) });

  return (
    <ComponentErrorBoundary componentName="Data Form">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form validation errors from React Hook Form */}
        <FormSectionErrors errors={Object.values(form.formState.errors).map(e => e?.message)} />

        {/* Form fields */}
        <input {...form.register('name')} />

        <button type="submit">Save</button>
      </form>
    </ComponentErrorBoundary>
  );
}
```

---

## Best Practices

1. **Hierarchy matters:** Always nest error boundaries (App → Route → Component).
2. **Meaningful names:** Provide componentName to help users understand which part failed.
3. **Retry buttons:** Include retry where possible; users expect to recover errors.
4. **Technical details:** Show details only in dev mode; hide in production for non-technical users.
5. **Logging:** Log all caught errors for debugging and monitoring.
6. **Test error states:** Use Storybook stories or error-throwing test components to verify error UI.
7. **Combine boundaries:** Use error boundaries with Suspense for complete error + loading state coverage.
8. **Error messages:** Write user-friendly error messages; map technical errors to actionable guidance.

---

## Cross-References

- **Suspense & Skeletons:** `patterns-status-and-data.md` (LoadingSkeleton component)
- **Primitives:** `primitives-reference.md` (Button, Card, AlertTriangle icons)
- **Design System:** `Docs/design/DESIGN_TOKENS.md` (error semantic colors: red for errors, info colors for network)
- **Architecture:** `Docs/architecture/frontend-architecture.md` (Error handling in state management)
- **Testing:** `Docs/architecture/implementation-patterns/testing-strategy-patterns.md` (Testing error boundaries)

