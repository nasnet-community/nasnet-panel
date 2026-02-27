---
sidebar_position: 13
title: Performance Patterns
---

# Performance Patterns in NasNetConnect

**Reference:** `libs/core/utils/src/hooks/` | `libs/core/forms/src/` | Performance Optimization
Patterns

NasNetConnect implements several performance optimization patterns across form handling, data
scrolling, and validation pipelines. This guide documents these patterns and their practical
applications.

## Table of Contents

- [useAutoScroll Hook](#useautoscroll-hook)
- [Form Persistence Caching](#form-persistence-caching)
- [Validation Pipeline Optimization](#validation-pipeline-optimization)
- [Bundle Size Considerations](#bundle-size-considerations)
- [Memoization Patterns](#memoization-patterns)
- [Code Examples](#code-examples)

---

## useAutoScroll Hook

The `useAutoScroll` hook manages automatic scrolling behavior for scrollable containers like log
viewers and real-time data streams. It uses performance-optimized techniques to avoid layout
thrashing and ensures smooth scrolling.

### Architecture

The hook implements:

- **requestAnimationFrame (rAF)** for scroll event handling instead of raw events
- **Passive event listeners** for improved scroll performance
- **Efficient state tracking** of bottom position and new entry count

```typescript
import { useAutoScroll } from '@nasnet/core/utils/hooks';

function LogViewer() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: logs } = useSystemLogs();
  const { isAtBottom, newEntriesCount, scrollToBottom } = useAutoScroll({
    scrollRef,
    data: logs || [],
  });

  return (
    <div ref={scrollRef} className="overflow-auto h-96">
      {logs?.map(log => <LogEntry key={log.id} entry={log} />)}
      {!isAtBottom && newEntriesCount > 0 && (
        <button onClick={scrollToBottom} className="sticky bottom-0">
          Scroll to bottom ({newEntriesCount} new)
        </button>
      )}
    </div>
  );
}
```

### Performance Optimizations

#### requestAnimationFrame for Scroll Events

Instead of handling scroll events directly:

```typescript
// Bad - fires on every scroll pixel
element.addEventListener('scroll', handleScroll);

// Good - batches scroll handling to animation frames
let rafId: number | null = null;

const handleScroll = () => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }
  rafId = requestAnimationFrame(() => {
    const atBottom = checkIsAtBottom();
    setIsAtBottom(atBottom);
  });
};

element.addEventListener('scroll', handleScroll, { passive: true });
```

**Benefits:**

- Scroll events are debounced to 60 FPS (or viewport refresh rate)
- Prevents layout thrashing from rapid DOM reads/writes
- Previous rAF callback is cancelled if user scrolls again before it fires

#### Passive Event Listeners

```typescript
// Passive: true means the listener won't call preventDefault()
element.addEventListener('scroll', handleScroll, { passive: true });
```

**Impact:** Allows browser to optimize scroll performance, knowing it won't be blocked.

### Key Features

**Auto-scroll to bottom when user is at bottom:**

```typescript
// If user is already at the bottom and new data arrives
// The hook instantly scrolls to bottom
if (isAtBottom && hasNewEntries) {
  scrollToBottom('instant'); // Instant scroll on load
  scrollToBottom('smooth'); // Smooth scroll on updates
}
```

**Track new entries when user scrolls up:**

```typescript
// User manually scrolls up (away from bottom)
// The hook tracks how many new entries arrived
// Display "5 new entries" button
if (!isAtBottom && hasNewEntries) {
  setNewEntriesCount((prev) => prev + newCount);
}
```

**Manual scroll control:**

```typescript
const { scrollToBottom } = useAutoScroll({ /* ... */ });

// User clicks "Scroll to bottom" button
<button onClick={scrollToBottom}>Scroll to bottom</button>
```

### Options

```typescript
export interface UseAutoScrollOptions {
  scrollRef: RefObject<HTMLElement>; // Ref to scrollable container
  data: unknown[]; // Data array to watch
  enabled?: boolean; // Enable/disable (default: true)
  threshold?: number; // Pixels from bottom (default: 100)
}
```

**Threshold Explanation:**

The `threshold` option defines how close to the bottom the user must be for auto-scroll to trigger.
Default is 100 pixels:

```typescript
const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
const isAtBottom = distanceFromBottom <= threshold; // 100px buffer
```

### Return Type

```typescript
export interface UseAutoScrollReturn {
  isAtBottom: boolean; // User is scrolled to bottom
  newEntriesCount: number; // Count of new entries since scroll paused
  scrollToBottom: () => void; // Scroll to bottom immediately
}
```

---

## Form Persistence Caching

The `useFormPersistence` hook saves form state to browser storage (sessionStorage by default) for
recovery after page reload. This is critical for long wizard flows where users might accidentally
refresh or navigate away.

### How It Works

```typescript
import { useFormPersistence } from '@nasnet/core/forms';

function WizardStep() {
  const form = useZodForm({ schema, defaultValues });
  const { clearPersistence, hasSavedData, restore } = useFormPersistence({
    form,
    storageKey: 'wizard-step-1',
    debounceMs: 1000,  // Save after 1 second of inactivity
    excludeFields: ['password'],  // Don't save sensitive fields
  });

  return (
    <>
      {hasSavedData() && (
        <Alert>Restored your previous progress on this step</Alert>
      )}
      <form>
        {/* form fields */}
      </form>
      <button onClick={() => {
        // When wizard completes, clear saved data
        clearPersistence();
        navigateNext();
      }}>
        Next Step
      </button>
    </>
  );
}
```

### Debouncing Strategy

Forms are saved with **debouncing** to avoid excessive storage writes:

```typescript
const debounceMs = 1000; // Default

// User types quickly
form.watch((values) => {
  clearTimeout(timeoutRef.current);

  // Wait 1 second after user stops typing
  timeoutRef.current = setTimeout(() => {
    storage.setItem(storageKey, JSON.stringify(filtered));
  }, debounceMs);
});
```

**Benefits:**

- Saves battery life (fewer storage writes)
- Reduces UI jank from synchronous storage access
- Handles rapid user input efficiently

### Excluding Sensitive Fields

```typescript
useFormPersistence({
  form,
  storageKey: 'form-key',
  excludeFields: ['password', 'apiKey', 'authToken'],
});
```

Fields in `excludeFields` are never written to storage:

```typescript
const filterValues = (values) => {
  const filtered = { ...values };
  excludeFields.forEach((field) => {
    delete filtered[field];
  });
  return filtered;
};
```

### Auto-Restore on Mount

Saved form data is automatically restored when the component mounts:

```typescript
useEffect(() => {
  restore(); // Called automatically in useFormPersistence
}, [restore]);
```

Restore only happens once (tracked via `hasRestoredRef`):

```typescript
const restore = useCallback((): boolean => {
  if (!storage || hasRestoredRef.current) return false;

  const saved = storage.getItem(storageKey);
  if (!saved) return false;

  try {
    const parsed = JSON.parse(saved) as T;
    form.reset(parsed, { keepDefaultValues: true });
    hasRestoredRef.current = true;
    return true;
  } catch {
    storage.removeItem(storageKey); // Clear invalid data
    return false;
  }
}, [form, storageKey, storage]);
```

### Return Methods

```typescript
{
  clearPersistence: () => void;    // Clear saved data and timeout
  hasSavedData: () => boolean;     // Check if storage has data
  restore: () => boolean;          // Restore from storage (called auto)
}
```

---

## Validation Pipeline Optimization

The validation pipeline optimizes performance by:

- **Skipping unnecessary stages** based on risk level
- **Aborting pending validation** when new input arrives
- **Debouncing async validation** to reduce API calls

### Risk-Based Stage Skipping

```typescript
export const RISK_LEVEL_STAGES: Record<RiskLevel, ValidationStageName[]> = {
  low: ['schema', 'syntax'], // Only fast client-side checks
  medium: ['schema', 'syntax', 'cross-resource', 'dependencies'],
  high: ['schema', 'syntax', 'cross-resource', 'dependencies', 'network', 'platform', 'dry-run'],
};
```

**Low-risk operations** (display name, WiFi password) skip 5 backend stages:

```typescript
// Changing WiFi password
const validation = useValidationPipeline({
  riskLevel: 'low', // Only stages 1-2
  // Skip expensive cross-resource, network, platform, dry-run checks
});
```

**High-risk operations** (VPN configuration, firewall rules) run all 7 stages:

```typescript
// Configuring VPN endpoint
const validation = useValidationPipeline({
  riskLevel: 'high', // All stages 1-7
  // Run full validation suite
});
```

### Async Validation Debouncing

```typescript
export interface UseAsyncValidationOptions<T extends ZodSchema> {
  schema: T;
  validateFn: async (value: unknown) => string | null;
  debounceMs?: number;  // Default: 300ms
}
```

The `debounceMs` option prevents excessive API calls during rapid input:

```typescript
// User types email quickly: a@b.c -> a@b.co -> a@b.com
// Only the final a@b.com triggers async validation after 300ms pause

const asyncValidation = useAsyncValidation({
  schema: z.string().email(),
  validateFn: checkEmailExists,
  debounceMs: 500,  // Wait 500ms for user to stop typing
});

<input onChange={e => asyncValidation.validate(e.target.value)} />
```

### Request Cancellation

Previous async validation requests are cancelled if user types again:

```typescript
const validate = useCallback(
  (value: unknown) => {
    // Cancel previous request
    abortControllerRef.current?.abort();

    // Start new validation
    abortControllerRef.current = new AbortController();

    // If request is still pending when new input arrives, abort it
    const asyncError = await validateFn(value, {
      signal: abortControllerRef.current.signal,
    });
  },
  [
    /* dependencies */
  ]
);
```

**Benefit:** Prevents race conditions where slow network requests complete out of order.

---

## Bundle Size Considerations

`libs/core` is designed for minimal bundle impact:

### No React Dependencies in Core

`libs/core/types/` and `libs/core/utils/` have zero React dependencies:

```typescript
// @nasnet/core/types - Pure TypeScript, no React
export interface ValidationError {
  /* ... */
}

// @nasnet/core/utils - Pure functions, can be used anywhere
export function getReducedMotionPreference(): boolean {
  /* ... */
}
```

**Benefits:**

- Can be imported in non-React contexts
- Tree-shaking friendly
- Smaller bundle when only using utilities

### Granular Imports

Import specific functions instead of barrel exports:

```typescript
// Good - only imports useAutoScroll
import { useAutoScroll } from '@nasnet/core/utils/hooks/useAutoScroll';

// Less optimal - could tree-shake unused hooks
import { useAutoScroll } from '@nasnet/core/utils';

// Bad - imports entire utils + deps
import * as utils from '@nasnet/core/utils';
const scroll = utils.useAutoScroll;
```

### Module Organization

```
libs/core/
├── types/
│   ├── firewall/
│   │   ├── filter-rule.types.ts
│   │   ├── nat-rule.types.ts
│   │   └── ...
│   └── resource/
├── utils/
│   ├── hooks/
│   │   ├── useAutoScroll.ts        (independent)
│   │   ├── useReducedMotion.ts     (independent)
│   │   └── ...
│   └── ...
└── forms/
    ├── useFormPersistence.ts        (can import types only)
    ├── useAsyncValidation.ts        (can import types only)
    └── ...
```

Each module is independently tree-shakeable.

---

## Memoization Patterns

### Dependency Graph Caching

For complex dependency graphs, cache computed results:

```typescript
// Don't recompute on every render
const dependencyCache = useMemo(
  () => computeDependencyGraph(resources),
  [resources] // Only recompute if resources change
);
```

### Well-Known Ports Lookup

Port registry uses a Map for O(1) lookups instead of array search:

```typescript
// Efficient: O(1) lookup
const portMap = new Map(wellKnownPorts.map((p) => [p.number, p]));
const port = portMap.get(22); // SSH

// Inefficient: O(n) lookup
const port = wellKnownPorts.find((p) => p.number === 22);
```

### When to Cache vs Compute

| Scenario                                | Strategy                         |
| --------------------------------------- | -------------------------------- |
| Expensive computation, stable inputs    | **useMemo** to cache result      |
| Frequently accessed, rarely updated     | **Map-based lookup** or **Set**  |
| Simple transformation, frequent changes | **Compute on demand** (no cache) |
| Long operation list, filtering needed   | **Filter once, cache results**   |

---

## Code Examples

### Log Viewer with Performance Optimization

```typescript
import { useAutoScroll } from '@nasnet/core/utils/hooks';
import { useQuery } from '@apollo/client';

function LogViewer() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data, loading, error } = useQuery(GET_SYSTEM_LOGS, {
    variables: { limit: 1000 },
    pollInterval: 5000,  // Poll every 5 seconds
  });

  const { isAtBottom, newEntriesCount, scrollToBottom } = useAutoScroll({
    scrollRef,
    data: data?.logs || [],
    threshold: 100,  // Scroll to bottom if within 100px
  });

  return (
    <div className="relative h-96">
      <div ref={scrollRef} className="overflow-auto h-full">
        {data?.logs.map(log => (
          <div key={log.id} className="font-mono text-sm">
            {log.timestamp} {log.message}
          </div>
        ))}
      </div>

      {!isAtBottom && newEntriesCount > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-0 left-0 right-0 bg-primary text-white py-2"
        >
          {newEntriesCount} new log entries - Scroll to bottom
        </button>
      )}
    </div>
  );
}
```

### Wizard with Form Persistence

```typescript
import { useFormPersistence } from '@nasnet/core/forms';
import { useZodForm } from '@nasnet/core/forms';

function VPNConfigWizard() {
  const [step, setStep] = useState(1);
  const form = useZodForm({ schema: vpnConfigSchema });
  const persistence = useFormPersistence({
    form,
    storageKey: `vpn-wizard-step-${step}`,
    debounceMs: 1000,
    excludeFields: ['privateKey'],  // Don't save sensitive fields
  });

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    const success = await submitWizard(form.getValues());
    if (success) {
      // Clear saved data when wizard completes
      persistence.clearPersistence();
      navigateToDashboard();
    }
  };

  return (
    <div>
      {persistence.hasSavedData() && (
        <Alert variant="info">
          Restored your previous progress on step {step}
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(handleNext)}>
        {step === 1 && <EndpointStep form={form} />}
        {step === 2 && <AuthStep form={form} />}
        {step === 3 && <ReviewStep form={form} />}

        <div className="flex justify-between">
          <button onClick={() => setStep(step - 1)}>Previous</button>
          <button
            onClick={step === 3 ? handleComplete : handleNext}
          >
            {step === 3 ? 'Complete' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

### High-Risk Validation with Async Debounce

```typescript
import { useAsyncValidation } from '@nasnet/core/forms';

function VLANConfigForm() {
  const asyncValidation = useAsyncValidation({
    schema: z.object({
      vlanId: z.number().min(1).max(4094),
    }),
    validateFn: async (vlanId) => {
      // Check if VLAN is already allocated
      const isAllocated = await checkVlanAllocation(vlanId);
      return isAllocated ? 'VLAN is already in use' : null;
    },
    debounceMs: 500,  // Wait for user to stop typing
  });

  return (
    <div>
      <input
        type="number"
        placeholder="VLAN ID (1-4094)"
        onChange={e => {
          const value = parseInt(e.target.value);
          asyncValidation.validate(value);
        }}
      />

      {asyncValidation.isValidating && <Spinner />}
      {asyncValidation.error && (
        <Alert variant="error">{asyncValidation.error}</Alert>
      )}
    </div>
  );
}
```

---

## Related Guides

- **Validation Pipeline:** See `libs/core/docs/guides/validation-pipeline.md`
- **Form Handling:** See `libs/core/docs/guides/form-patterns.md`
- **Bundle Size:** See `Docs/architecture/implementation-patterns/performance-patterns.md`
