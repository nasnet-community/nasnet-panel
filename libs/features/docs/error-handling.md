# Error Handling Architecture

**File:** `libs/features/docs/error-handling.md`

NasNetConnect implements a comprehensive 3-tier error boundary system for resilient frontend error handling and graceful error recovery. This document covers the hierarchy, implementation patterns, and integration guidelines.

## Overview

The error handling architecture provides **graceful degradation** through nested error boundaries:

- **Tier 1 (AppErrorBoundary):** Catches catastrophic failures that escape all other boundaries. Shows full-page error UI with reload and error reporting options.
- **Tier 2 (RouteErrorBoundary):** Isolates errors to specific routes. Errors don't affect other routes or the main layout. Auto-resets on route change.
- **Tier 3 (ComponentErrorBoundary):** Isolates errors to individual components/widgets. Shows inline error cards that don't disrupt surrounding UI.

**Philosophy:** Errors are caught as close as possible to their source. Only errors that escape a boundary bubble up to the next level. This prevents a single component error from crashing the entire application.

## Three-Tier Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ AppErrorBoundary (Outermost)                                │
│ ├─ Catches: Catastrophic failures, provider initialization  │
│ ├─ Scope: Entire application                                │
│ ├─ Display: Full-page error UI with reload/home buttons     │
│ └─ Action: Reload application                               │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ RouteErrorBoundary (Middle)                            │ │
│  │ ├─ Catches: Route-level render errors                  │ │
│  │ ├─ Scope: Single route/page                            │ │
│  │ ├─ Display: Error message with navigation options      │ │
│  │ ├─ Action: Retry (reset boundary) or navigate away     │ │
│  │ └─ Auto-reset: When pathname changes                   │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ ComponentErrorBoundary (Innermost)               │  │ │
│  │  │ ├─ Catches: Component-level render errors        │  │ │
│  │  │ ├─ Scope: Single widget/feature                  │  │ │
│  │  │ ├─ Display: Inline error card                    │  │ │
│  │  │ └─ Action: Retry (reset boundary)                │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Error Flow:** Component error → caught by nearest boundary → fallback UI → user action (retry/navigate) → attempt recovery or escalate to parent boundary.

## Base ErrorBoundary

Located: `libs/ui/patterns/src/error-boundary/ErrorBoundary.tsx`

The foundation class component that all other boundaries build upon. Implements React's error boundary lifecycle methods.

### Key Methods

```typescript
// getDerivedStateFromError: Synchronously called when an error is caught
// Updates state so the next render shows fallback UI
static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
  return { hasError: true, error };
}

// componentDidCatch: Called after an error is caught
// Receives error and component stack trace
override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
  this.setState({ errorInfo });
  if (import.meta.env.DEV) {
    console.group('[ErrorBoundary] Caught error');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }
  this.props.onError?.(error, errorInfo);
}

// resetErrorBoundary: Called to recover from an error state
resetErrorBoundary = (): void => {
  this.props.onReset?.();
  this.setState({
    hasError: false,
    error: null,
    errorInfo: null,
  });
};
```

### Props

| Prop | Type | Purpose |
|------|------|---------|
| `children` | `ReactNode` | Components to protect |
| `fallback` | `ReactNode \| (props) => ReactNode` | UI to show on error (static or render prop) |
| `onError` | `(error, info) => void` | Callback when error is caught (logging/telemetry) |
| `onReset` | `() => void` | Callback when boundary resets |
| `resetKey` | `string \| number` | Change to auto-reset (useful for route changes) |

### Features

- Catches render errors, lifecycle method errors, constructor errors
- Configurable fallback UI (static component or render function)
- Reset capability for retry functionality
- Error logging with component stack
- Key-based reset for route changes

## AppErrorBoundary

Located: `libs/ui/patterns/src/error-boundary/AppErrorBoundary.tsx`

The outermost boundary for catching catastrophic failures that escape all other boundaries (provider initialization errors, unrecoverable crashes).

### Features

- Full-page error display (centers error message with white card on error background)
- Reload Application button (hard page reload via `window.location.reload()`)
- Try Again button (resets boundary state)
- Go to Dashboard button (navigates to home)
- Report Issue button (copies error details to clipboard for debugging)
- Technical details panel (always visible in dev mode, collapsible in production)
- Structured logging with timestamp, URL, user agent

### Integration Example

```typescript
// In main.tsx or root app wrapper
<AppErrorBoundary onError={logToTelemetry}>
  <ApolloProvider client={apolloClient}>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </ApolloProvider>
</AppErrorBoundary>
```

### When It Fires

This boundary catches errors that occur:
- During provider initialization
- In event handlers not caught by other boundaries
- In async errors that become synchronous (rare)
- Critical framework errors

**Example:** If Apollo Client initialization fails, `AppErrorBoundary` will catch it and display the full-page error UI instead of a blank page.

## RouteErrorBoundary

Located: `libs/ui/patterns/src/error-boundary/RouteErrorBoundary.tsx`

Route-level error boundary for per-route isolation. Automatically resets when the route changes using TanStack Router's `useLocation` hook.

### Features

- Route-level error isolation (one route's error doesn't affect others)
- Auto-reset on pathname change (via `resetKey`)
- TanStack Router integration (can be used as errorComponent)
- User-friendly error display with navigation options
- Network error detection (contextual messaging)
- Detailed error inspection panel (dev mode)

### RouteErrorDisplay Component

Can be used both as a fallback in `RouteErrorBoundary` and as a TanStack Router `errorComponent`:

```typescript
export interface RouteErrorDisplayProps {
  error: Error;
  reset?: () => void;
  className?: string;
}

export function RouteErrorDisplay({ error, reset, className }: RouteErrorDisplayProps) {
  // Render user-friendly error with retry/navigation options
}
```

### Integration with TanStack Router

#### Route-level errorComponent

```typescript
// In a specific route file (apps/connect/src/routes/router/$id.tsx)
export const Route = createFileRoute('/router/$id')({
  errorComponent: ({ error, reset }) => (
    <RouteErrorDisplay error={error} reset={reset} />
  ),
});
```

#### Layout-level boundary

```typescript
// In a layout route (apps/connect/src/routes/_layout.tsx)
export const Route = createFileRoute('/_layout')({
  component: () => (
    <RouteErrorBoundary>
      <Outlet />
    </RouteErrorBoundary>
  ),
});
```

### Auto-Reset Behavior

```typescript
const location = useLocation();
const resetKey = location.pathname;  // Changes when route changes
// ErrorBoundary.componentDidUpdate checks if resetKey changed and calls resetErrorBoundary()
```

When the user navigates to a different route, the `pathname` changes, triggering the boundary reset and clearing the error state.

## ComponentErrorBoundary

Located: `libs/ui/patterns/src/error-boundary/ComponentErrorBoundary.tsx`

The innermost boundary for individual components/widgets. Shows inline error cards that don't disrupt surrounding UI.

### InlineErrorCard Component

Displays errors in a compact card format with optional detail expansion:

```typescript
interface InlineErrorCardProps {
  error: Error;
  reset?: () => void;
  componentName?: string;
  className?: string;
  minimal?: boolean;  // Minimal inline variant
}
```

**Default variant:** Card with icon, title, description, retry button, and expandable details.

**Minimal variant:** Single-line inline alert with icon and minimal footprint.

### Features

- Inline error display (doesn't disrupt page layout)
- Minimal mode for compact presentations
- Memoized component to prevent unnecessary re-renders
- Retry button for user-initiated recovery
- Expandable technical details panel
- Component name context in error message

### Usage Example

```typescript
// Basic usage with default card style
<ComponentErrorBoundary componentName="User Statistics">
  <UserStatsWidget />
</ComponentErrorBoundary>

// Minimal inline variant
<ComponentErrorBoundary minimal componentName="Quick Stats">
  <QuickStatsRow />
</ComponentErrorBoundary>

// With custom fallback
<ComponentErrorBoundary
  fallback={<MyCustomErrorState />}
  onError={(error) => logError(error)}
>
  <DataChart />
</ComponentErrorBoundary>
```

## withErrorBoundary HOC

Located: `libs/ui/patterns/src/error-boundary/withErrorBoundary.tsx`

Higher-order component for wrapping components with error boundaries without modifying component JSX.

### Signature

```typescript
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): React.ComponentType<P>

export interface WithErrorBoundaryOptions {
  fallback?: React.ReactNode | ((props: ErrorBoundaryFallbackProps) => React.ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  componentName?: string;
  minimal?: boolean;
  className?: string;
}
```

### Usage Examples

```typescript
// Basic usage
const SafeWidget = withErrorBoundary(Widget);
<SafeWidget data={data} />

// With options
const SafeChart = withErrorBoundary(DataChart, {
  componentName: 'Traffic Chart',
  onError: (error) => analytics.trackError(error),
  minimal: true,
});

// With custom fallback
const SafeUserCard = withErrorBoundary(UserCard, {
  fallback: ({ error, resetErrorBoundary }) => (
    <div className="p-4 bg-amber-50 rounded">
      <p>User information unavailable</p>
      <button onClick={resetErrorBoundary}>Refresh</button>
    </div>
  ),
});
```

### useErrorBoundaryWrapper Hook

Utility hook to wrap multiple components with consistent error boundary configuration:

```typescript
export function useErrorBoundaryWrapper(
  options: Omit<ComponentErrorBoundaryProps, 'children' | 'componentName'> = {}
) {
  return React.useCallback(
    (children: React.ReactNode, componentName?: string) => (
      <ComponentErrorBoundary {...options} componentName={componentName}>
        {children}
      </ComponentErrorBoundary>
    ),
    [options]
  );
}

// Usage
function DashboardWidgets() {
  const wrapWithErrorBoundary = useErrorBoundaryWrapper({
    onError: (error) => logError(error),
    minimal: true,
  });

  return (
    <div className="grid grid-cols-3 gap-4">
      {wrapWithErrorBoundary(<CPUWidget />, 'CPU Stats')}
      {wrapWithErrorBoundary(<MemoryWidget />, 'Memory Stats')}
      {wrapWithErrorBoundary(<NetworkWidget />, 'Network Stats')}
    </div>
  );
}
```

## TanStack Router Error Integration

Located: `apps/connect/src/routes/__root.tsx`

The root route defines error and not-found components for app-wide error handling.

### Root Route Configuration

```typescript
function RootErrorComponent({ error }: { error: Error }) {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" role="alert" aria-live="assertive">
      <div className="max-w-md p-8 bg-card text-card-foreground rounded-lg shadow-lg border border-border">
        <h1 className="text-2xl font-bold text-error mb-4">{t('errors.applicationError')}</h1>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="min-h-[44px] px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-hover"
        >
          {t('actions.reloadApplication')}
        </button>
        {import.meta.env.DEV && (
          <pre className="mt-4 p-4 bg-muted rounded text-xs overflow-auto text-foreground">
            {error.stack}
          </pre>
        )}
      </div>
    </div>
  );
}

function NotFoundComponent() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted">{t('errors.notFound')}</h1>
        <p className="text-xl text-muted-foreground mt-4">{t('errors.pageNotFound')}</p>
        <a
          href="/"
          className="mt-6 inline-block min-h-[44px] px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          {t('actions.goHome')}
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFoundComponent,
});
```

### Error Handling Flow in Router

1. **Route render error:** Router catches via `errorComponent`
2. **Unmatched path:** Router catches via `notFoundComponent`
3. **Async errors in async route options:** Router catches and passes to `errorComponent`
4. **Unhandled errors:** Bubble up to `AppErrorBoundary` (if wrapped)

## Error Display Patterns

### ErrorDisplay Component

Located: `apps/connect/src/app/pages/network/components/ErrorDisplay.tsx`

Shows user-friendly error messages with retry option:

```typescript
export interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
}

export const ErrorDisplay = React.memo(function ErrorDisplay({
  error,
  onRetry
}: ErrorDisplayProps) {
  return (
    <div className="container mx-auto px-page-mobile md:px-page-tablet lg:px-page-desktop">
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-error/10 border border-error/30 rounded-card-sm p-6 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-error" />
          <h2 className="text-xl font-semibold text-error">Failed to load</h2>
          <p className="text-muted-foreground text-sm">{error.message}</p>
          {onRetry && (
            <button onClick={onRetry} className="mt-4 px-4 py-3 bg-primary text-primary-foreground rounded-lg">
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
```

### Toast Notifications

Transient errors are shown via toast notifications from the notification store:

```typescript
// From apollo-error-link.ts
useNotificationStore.getState().addNotification({
  type: 'error',
  title: 'Network error',
  message: 'Unable to reach the server.',
});
```

### Inline Error States

Form validation errors are displayed inline next to fields:

```typescript
// From react-hook-form integration
{errors.address && (
  <span className="text-sm text-error">{errors.address.message}</span>
)}
```

## GraphQL Error Handling

Located: `libs/api-client/core/src/apollo/apollo-error-link.ts`

Centralized error handling for GraphQL and network errors with integration to auth and notification stores.

### Error Categories

**GraphQL Errors** (from server response)
- `UNAUTHENTICATED`: Clears auth store, shows session expired notification
- `FORBIDDEN`: Shows permission denied notification
- `NOT_FOUND`: Shows not found notification
- `VALIDATION_FAILED`: Passed to form validation handlers

**Network Errors** (connection/HTTP issues)
- `401 Unauthorized`: Clears auth, redirects to login
- `403 Forbidden`: Shows permission denied notification
- Generic network error: Shows connectivity notification

### Error Logging

Errors are logged with structured format:

```typescript
logGraphQLError(operation.operationName, error, {
  path: path?.join('.'),
  variables: operation.variables,
});

logNetworkError(operation.operationName, networkError, {
  statusCode,
  variables: operation.variables,
});
```

### Error Policies

Apollo Client's `errorPolicy` controls how GraphQL errors are handled:

- `none` (default): Errors cause entire operation to fail
- `ignore`: Errors are silently ignored
- `all`: Both data and errors are returned

Configuration in useQuery/useMutation hooks:

```typescript
const { data, error } = useQuery(QUERY, {
  errorPolicy: 'all',  // Get both data and errors
});
```

## Error Flow Diagram

```
Component renders with error
           ↓
Nearest ComponentErrorBoundary catches
    ↓                          ↓
Success: Reset & continue   Failure: Escalate
                                 ↓
            Nearest RouteErrorBoundary catches
                ↓                          ↓
            Success: Reset         Failure: Escalate
            on route change            ↓
                            AppErrorBoundary catches
                                ↓
                    Full-page error UI
                    Reload or reset app
```

## Testing Error Boundaries

Located: `libs/ui/patterns/src/error-boundary/ErrorBoundary.test.tsx`

### Test Patterns

**Force an error in a component:**
```typescript
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}
```

**Test fallback renders:**
```typescript
it('renders fallback when error occurs', () => {
  render(
    <ErrorBoundary fallback={<div>Error occurred</div>}>
      <ThrowingComponent />
    </ErrorBoundary>
  );

  expect(screen.getByText('Error occurred')).toBeInTheDocument();
});
```

**Test error callback:**
```typescript
it('calls onError callback when error occurs', () => {
  const onError = vi.fn();

  render(
    <ErrorBoundary fallback={<div>Error</div>} onError={onError}>
      <ThrowingComponent />
    </ErrorBoundary>
  );

  expect(onError).toHaveBeenCalledTimes(1);
});
```

**Test recovery via reset:**
```typescript
it('resets error state when resetErrorBoundary is called', () => {
  function TestComponent() {
    const [shouldThrow, setShouldThrow] = React.useState(true);

    return (
      <ErrorBoundary
        fallback={({ resetErrorBoundary }) => (
          <button
            onClick={() => {
              setShouldThrow(false);
              resetErrorBoundary();
            }}
          >
            Reset
          </button>
        )}
      >
        <ThrowingComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );
  }

  render(<TestComponent />);
  fireEvent.click(screen.getByText('Reset'));
  expect(screen.getByText('No error')).toBeInTheDocument();
});
```

**Test key-based reset:**
```typescript
it('resets when resetKey changes', () => {
  function TestComponent() {
    const [key, setKey] = React.useState(0);
    const [shouldThrow, setShouldThrow] = React.useState(true);

    return (
      <>
        <button onClick={() => {
          setShouldThrow(false);
          setKey((k) => k + 1);
        }}>
          Change Key
        </button>
        <ErrorBoundary resetKey={key} fallback={<div>Error</div>}>
          <ThrowingComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      </>
    );
  }

  render(<TestComponent />);
  fireEvent.click(screen.getByText('Change Key'));
  expect(screen.getByText('No error')).toBeInTheDocument();
});
```

## Best Practices

1. **Choose the right boundary:** Wrap components at the logical scope where you want to isolate errors.
2. **Provide context:** Use `componentName` to help users understand what failed.
3. **Add onError callbacks:** Log errors for debugging and monitoring.
4. **Test error states:** Always test the fallback UI rendering.
5. **User-friendly messages:** Avoid technical jargon in error messages.
6. **Recovery paths:** Always provide retry or navigation options.
7. **Accessibility:** Use `role="alert"` and `aria-live="polite"` on error displays.

## Cross-References

- **Document 15: Routing & Route Errors** - TanStack Router error components (`errorComponent`, `notFoundComponent`)
- **Document 12: API Client Architecture** - GraphQL error handling, Apollo Client error link
- **Document 14: Testing Strategy** - Error boundary testing patterns with Vitest and React Testing Library
- **Design Tokens & Accessibility** - Error color tokens, WCAG AAA contrast ratios for error displays
