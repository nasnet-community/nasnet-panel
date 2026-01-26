# Error Handling Patterns

## Hierarchical Error System

```typescript
// Error hierarchy
class RouterError extends Error {
  code: string;
  category: ErrorCategory;
  recoverable: boolean;
  context: Record<string, unknown>;

  constructor(message: string, options: RouterErrorOptions) {
    super(message);
    this.code = options.code;
    this.category = options.category;
    this.recoverable = options.recoverable ?? false;
    this.context = options.context ?? {};
  }
}

type ErrorCategory =
  | 'platform'   // Platform-specific errors
  | 'protocol'   // Protocol-level errors (SSH, API, etc.)
  | 'network'    // Network connectivity errors
  | 'validation' // Data validation errors
  | 'auth'       // Authentication/authorization errors
  | 'resource'   // Resource state errors
  | 'internal';  // Internal system errors

// Specific error types
class PlatformError extends RouterError {
  platform: PlatformType;
  nativeError?: unknown;
}

class ProtocolError extends RouterError {
  protocol: Protocol;
  connectionId?: string;
}

class ValidationError extends RouterError {
  field?: string;
  value?: unknown;
  constraint?: string;
}

// Error codes
const ErrorCodes = {
  // Platform errors (P1xx)
  P100: 'PLATFORM_NOT_SUPPORTED',
  P101: 'CAPABILITY_NOT_AVAILABLE',
  P102: 'VERSION_TOO_OLD',
  P103: 'PACKAGE_MISSING',

  // Protocol errors (R2xx)
  R200: 'CONNECTION_FAILED',
  R201: 'CONNECTION_TIMEOUT',
  R202: 'PROTOCOL_ERROR',
  R203: 'ALL_PROTOCOLS_FAILED',

  // Network errors (N3xx)
  N300: 'HOST_UNREACHABLE',
  N301: 'DNS_RESOLUTION_FAILED',
  N302: 'NETWORK_TIMEOUT',

  // Validation errors (V4xx)
  V400: 'SCHEMA_VALIDATION_FAILED',
  V401: 'REFERENCE_NOT_FOUND',
  V402: 'CIRCULAR_DEPENDENCY',
  V403: 'CONFLICT_DETECTED',

  // Auth errors (A5xx)
  A500: 'AUTH_FAILED',
  A501: 'INSUFFICIENT_PERMISSIONS',
  A502: 'SESSION_EXPIRED',

  // Resource errors (S6xx)
  S600: 'RESOURCE_NOT_FOUND',
  S601: 'RESOURCE_LOCKED',
  S602: 'INVALID_STATE_TRANSITION',
  S603: 'DEPENDENCY_NOT_READY',
};
```

## Frontend Error Boundary

```typescript
// libs/ui/patterns/src/error-boundary/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { toast } from '@nasnet/ui/primitives';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<Props> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Log to monitoring service
    console.error('[ErrorBoundary]', error);
    toast.error('Something went wrong. Please try again.');
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## GraphQL Error Extensions

```typescript
// libs/api-client/core/src/links/error.ts
import { onError } from "@apollo/client/link/error";
import { toast } from '@nasnet/ui/primitives';

export const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      // Handle validation errors specifically
      if (extensions?.code === 'VALIDATION_ERROR') {
        // Form libraries handle these via response inspection
        return;
      }

      console.error(`[GraphQL error]: Message: ${message}, Code: ${extensions?.code}`);
      toast.error(message);
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    toast.error('Network error. Check your connection.');
  }
});
```

## Retry with Exponential Backoff

```go
type RetryConfig struct {
    MaxAttempts     int
    InitialDelay    time.Duration
    MaxDelay        time.Duration
    Multiplier      float64
    Jitter          float64
    RetryableErrors []string
}

var DefaultRetryConfig = RetryConfig{
    MaxAttempts:  3,
    InitialDelay: 100 * time.Millisecond,
    MaxDelay:     10 * time.Second,
    Multiplier:   2.0,
    Jitter:       0.1,
}

func WithRetry[T any](
    ctx context.Context,
    config RetryConfig,
    fn func() (T, error),
) (T, error) {
    var lastErr error
    delay := config.InitialDelay

    for attempt := 1; attempt <= config.MaxAttempts; attempt++ {
        result, err := fn()
        if err == nil {
            return result, nil
        }

        if !isRetryable(err, config.RetryableErrors) {
            return result, err
        }

        lastErr = err

        if attempt < config.MaxAttempts {
            // Apply jitter
            jitteredDelay := delay + time.Duration(
                float64(delay) * config.Jitter * (rand.Float64()*2 - 1),
            )

            select {
            case <-ctx.Done():
                return *new(T), ctx.Err()
            case <-time.After(jitteredDelay):
            }

            // Increase delay for next attempt
            delay = time.Duration(float64(delay) * config.Multiplier)
            if delay > config.MaxDelay {
                delay = config.MaxDelay
            }
        }
    }

    return *new(T), fmt.Errorf("max retries exceeded: %w", lastErr)
}
```

---
