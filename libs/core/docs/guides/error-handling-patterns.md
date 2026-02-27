---
sidebar_position: 8
title: Error Handling Patterns
---

# Error Handling Patterns in NasNetConnect

**Reference:** `libs/core/forms/src/` | Universal State v2 Layer 2 (Validation & Error Processing)

Error handling in NasNetConnect follows a multi-layered approach that bridges backend validation errors with frontend form field errors. This guide documents the error type hierarchy, mapping patterns, and best practices for displaying errors to users.

## Table of Contents

- [Error Type Hierarchy](#error-type-hierarchy)
- [Backend Error to Form Error Mapping](#backend-error-to-form-error-mapping)
- [i18n Error Messages](#i18n-error-messages)
- [Error Flow Through Validation Pipeline](#error-flow-through-validation-pipeline)
- [Error Display Patterns](#error-display-patterns)
- [Code Examples](#code-examples)
- [Testing Error Scenarios](#testing-error-scenarios)

---

## Error Type Hierarchy

NasNetConnect uses a structured error type system to handle validation failures at different levels. All error types are defined in `libs/core/forms/src/types.ts`.

### ValidationError

The primary error type for validation failures. Represents a single validation error that occurred during any stage of the validation pipeline.

```typescript
interface ValidationError {
  code: string;           // Machine-readable error code (e.g., 'PORT_CONFLICT')
  message: string;        // Human-readable error message for display
  fieldPath?: string;     // Nested field path (e.g., 'peers.0.endpoint', 'ipConfig.address')
  resourceUuid?: string;  // UUID of conflicting/related resource
  suggestedFix?: string;  // Optional suggestion for how to resolve the error
}
```

**Common Error Codes:**

| Code | Description | Example |
|------|-------------|---------|
| `PORT_IN_USE` | Port is already allocated | Port 22 is in use by SSH service |
| `IP_CONFLICT` | IP address already assigned | 192.168.1.1 is assigned to WAN interface |
| `VLAN_OVERLAP` | VLAN range overlaps with another | VLAN 100-110 overlaps with existing 105-115 |
| `NAME_DUPLICATE` | Resource name already exists | Bridge named "br-main" already exists |
| `INVALID_FORMAT` | Value doesn't match expected format | Email must contain @ symbol |
| `MISSING_DEPENDENCY` | Required dependency missing | VPN requires active WAN connection |
| `ROUTER_UNSUPPORTED` | Feature not supported on this router | Feature requires RouterOS v6.48+ |

**Example:**

```typescript
const error: ValidationError = {
  code: 'PORT_IN_USE',
  message: 'Port 22 is already in use by the SSH service',
  fieldPath: 'port',
  resourceUuid: 'ssh-service-uuid',
  suggestedFix: 'Change to port 2222 or disable the SSH service'
};
```

### ValidationWarning

Non-blocking warnings that indicate potential issues but don't prevent validation from passing. Warnings are raised when something might be problematic but is technically valid.

```typescript
interface ValidationWarning {
  code: string;      // Machine-readable warning code
  message: string;   // Human-readable message
  fieldPath?: string; // Optional field path
}
```

**Common Warning Codes:**

| Code | Description |
|------|-------------|
| `RISKY_SETTING` | Configuration could cause issues (e.g., disabling firewall) |
| `PERFORMANCE_IMPACT` | Change may impact performance (e.g., enabling packet inspection) |
| `DEPRECATION` | Feature is deprecated but still works |
| `UNUSUAL_VALUE` | Setting deviates significantly from common patterns |

**Example:**

```typescript
const warning: ValidationWarning = {
  code: 'RISKY_SETTING',
  message: 'Disabling the firewall will expose your network to threats',
  fieldPath: 'firewall.enabled'
};
```

### ResourceConflict

Detailed information about conflicts with other resources in the network. Provides context about what resource is conflicting and how.

```typescript
interface ResourceConflict {
  type: ConflictType;                    // Type of conflict: 'ip' | 'port' | 'vlan' | 'name' | 'other'
  fieldPath: string;                     // Field that has the conflict
  conflictingResourceUuid: string;        // UUID of the conflicting resource
  conflictingResourceName: string;        // Human-readable name of conflicting resource
  currentValue: string;                  // Value causing conflict
  conflictingValue: string;               // Value it conflicts with
  suggestedFix?: string;                  // How to resolve conflict
}
```

**Example:**

```typescript
const conflict: ResourceConflict = {
  type: 'port',
  fieldPath: 'port',
  conflictingResourceUuid: 'service-123',
  conflictingResourceName: 'VPN Service',
  currentValue: '1194',
  conflictingValue: '1194',
  suggestedFix: 'Use port 1195 or higher'
};
```

### ValidationStageResult

Result object from a single validation stage. Contains all errors, warnings, and metadata about that stage's execution.

```typescript
interface ValidationStageResult {
  stage: ValidationStage;        // Which stage: 'schema' | 'syntax' | 'cross-resource' | etc.
  status: ValidationStageStatus; // Status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
  readonly errors: readonly ValidationError[];     // Errors from this stage
  readonly warnings: readonly ValidationWarning[];  // Warnings from this stage
  durationMs?: number;           // Time taken to execute this stage (ms)
}
```

**Example:**

```typescript
const stageResult: ValidationStageResult = {
  stage: 'cross-resource',
  status: 'failed',
  errors: [
    {
      code: 'PORT_IN_USE',
      message: 'Port 1194 is already in use',
      fieldPath: 'port'
    }
  ],
  warnings: [],
  durationMs: 245
};
```

### ValidationResult

The complete validation result after all applicable stages have executed. This is what's returned from the validation pipeline.

```typescript
interface ValidationResult {
  isValid: boolean;                    // true if no errors occurred
  stages: ValidationStageResult[];      // Results from all executed stages
  errors: ValidationError[];            // Flattened list of all errors
  conflicts: ResourceConflict[];        // All cross-resource conflicts detected
}
```

**Example:**

```typescript
const result: ValidationResult = {
  isValid: false,
  stages: [
    { stage: 'schema', status: 'passed', errors: [], warnings: [] },
    { stage: 'syntax', status: 'passed', errors: [], warnings: [] },
    {
      stage: 'cross-resource',
      status: 'failed',
      errors: [{ code: 'PORT_IN_USE', message: 'Port is in use', fieldPath: 'port' }],
      warnings: []
    }
  ],
  errors: [{ code: 'PORT_IN_USE', message: 'Port is in use', fieldPath: 'port' }],
  conflicts: [{ type: 'port', fieldPath: 'port', conflictingResourceUuid: '...', ... }]
};
```

---

## Backend Error to Form Error Mapping

The `mapBackendErrors.ts` module provides utilities to convert backend validation errors into React Hook Form field errors. This bridges the gap between server-side validation and client-side form state.

### mapBackendErrorsToForm()

Maps an array of backend `ValidationError` objects to React Hook Form field errors.

```typescript
function mapBackendErrorsToForm<T extends FieldValues>(
  errors: ValidationError[],
  setError: UseFormSetError<T>
): void
```

**What it does:**

1. Iterates through each backend error
2. If the error has a `fieldPath`, sets that field as having a server-type error
3. Associates the error message with the field
4. Handles nested paths (e.g., `peers.0.endpoint`)

**Usage:**

```typescript
import { mapBackendErrorsToForm } from '@nasnet/core/forms';

function CreateVPNForm() {
  const form = useForm({ schema: vpnSchema });

  async function onSubmit(data) {
    const result = await createVPNMutation({ variables: { data } });

    // If validation failed on backend
    if (!result.isValid) {
      // Map backend errors to form fields
      mapBackendErrorsToForm(result.errors, form.setError);
      return;
    }

    // Success handling
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

**Key Points:**

- Only errors with a `fieldPath` are set on the form (root errors are logged separately)
- Error type is always `'server'` to distinguish from client-side validation
- Works with nested field paths automatically
- Non-destructive: doesn't clear existing field errors

### clearServerErrors()

Clears all server-type errors from the form before re-validation. Call this before making a new API call to prevent stale server errors.

```typescript
function clearServerErrors<T extends FieldValues>(
  errors: Record<string, { type?: string }>,
  clearErrors: UseFormClearErrors<T>
): void
```

**Usage:**

```typescript
import { clearServerErrors } from '@nasnet/core/forms';

async function onFieldChange(field: string) {
  // Clear previous server errors before revalidating
  clearServerErrors(form.formState.errors, form.clearErrors);

  // Re-validate with backend
  const result = await validateFieldMutation({ variables: { field, value } });

  if (!result.isValid) {
    mapBackendErrorsToForm(result.errors, form.setError);
  }
}
```

**Key Points:**

- Only clears errors with `type: 'server'`
- Preserves client-side validation errors
- Useful when user is actively editing a field with previous server errors
- Prevents stale errors from appearing after successful corrections

### toFormError()

Converts a single `ValidationError` to a React Hook Form error object.

```typescript
function toFormError(error: ValidationError): {
  type: string;
  message: string;
}
```

**Usage:**

```typescript
const backendError: ValidationError = {
  code: 'EMAIL_EXISTS',
  message: 'Email already registered'
};

const formError = toFormError(backendError);
// { type: 'server', message: 'Email already registered' }
```

### groupErrorsByField()

Groups errors by their `fieldPath` for batch processing or display.

```typescript
function groupErrorsByField(
  errors: ValidationError[]
): Map<string, ValidationError[]>
```

**Usage:**

```typescript
import { groupErrorsByField } from '@nasnet/core/forms';

const errors = [
  { fieldPath: 'email', message: 'Already exists' },
  { fieldPath: 'email', message: 'Invalid domain' },
  { fieldPath: 'name', message: 'Too short' }
];

const grouped = groupErrorsByField(errors);
// Map {
//   'email' => [error1, error2],
//   'name' => [error3]
// }

// Now display all errors for a field
grouped.get('email')?.forEach(err => console.log(err.message));
// "Already exists"
// "Invalid domain"
```

### combineFieldErrors()

Creates a single formatted error message from multiple errors on the same field.

```typescript
function combineFieldErrors(errors: ValidationError[]): string
```

**Usage:**

```typescript
import { combineFieldErrors } from '@nasnet/core/forms';

const errors = [
  { fieldPath: 'email', message: 'Already registered' },
  { fieldPath: 'email', message: 'Blocked domain' }
];

const message = combineFieldErrors(errors);
// "Already registered. Blocked domain"
```

**Key Points:**

- Empty array returns empty string
- Single error returns just that message
- Multiple errors joined with periods and spaces
- Useful for display in error messages or tooltips

---

## i18n Error Messages

Error messages support internationalization through the `error-messages.ts` module. Validation error codes map to translation keys for multi-language support.

### createZodErrorMap()

Creates a custom Zod error map that integrates with i18n. Maps Zod issue codes to translation keys.

```typescript
function createZodErrorMap(
  t: TranslateFunction = defaultTranslate
): ZodErrorMap
```

**The Translation Function:**

```typescript
type TranslateFunction = (
  key: string,
  params?: Record<string, string | number>
) => string;
```

**Usage with react-i18next:**

```typescript
import { useTranslation } from 'react-i18next';
import { createZodErrorMap } from '@nasnet/core/forms';

function MyForm() {
  const { t } = useTranslation('validation');

  // Option 1: Use locally
  const schema = z.string().email().parse(input, { errorMap: createZodErrorMap(t) });

  // Option 2: Set globally
  setGlobalErrorMap(t);
  const schema = z.string().email();
  schema.parse(input); // Uses the global error map
}
```

### DEFAULT_ERROR_MESSAGES

Pre-defined English error messages. Maps validation codes to human-readable strings.

```typescript
const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  'validation.required': 'This field is required',
  'validation.string.min': 'Must be at least {{min}} characters',
  'validation.string.max': 'Must be at most {{max}} characters',
  'validation.number.min': 'Must be at least {{min}}',
  'validation.number.max': 'Must be at most {{max}}',
  'validation.email.invalid': 'Please enter a valid email address',
  'validation.url.invalid': 'Please enter a valid URL',
  // ... 18 total default messages
};
```

**Template Variables:**

Messages support template interpolation using `{{variableName}}` syntax:

- `{{min}}`, `{{max}}` - for length/value constraints
- `{{length}}` - for exact length requirements
- `{{expected}}` - for type mismatch messages

**Example:**

```typescript
defaultTranslate('validation.string.min', { min: 5 });
// "Must be at least 5 characters"
```

### setGlobalErrorMap()

Sets the global Zod error map for all future schemas. Useful when you want all validation errors to use i18n.

```typescript
function setGlobalErrorMap(t?: TranslateFunction): void
```

**Usage:**

```typescript
import { setGlobalErrorMap } from '@nasnet/core/forms';
import { useTranslation } from 'react-i18next';

// In your app initialization
function App() {
  const { t } = useTranslation('validation');

  // Set once at app startup
  setGlobalErrorMap(t);

  return <Router>...</Router>;
}
```

### formatValidationError()

Utility function to safely format error objects for display. Handles various input types.

```typescript
function formatValidationError(
  error: string | { message: string } | undefined
): string
```

**Usage:**

```typescript
import { formatValidationError } from '@nasnet/core/forms';

// From string
formatValidationError('Email is invalid');
// "Email is invalid"

// From error object
formatValidationError({ message: 'Email is invalid' });
// "Email is invalid"

// From undefined/null
formatValidationError(undefined);
// ""
```

---

## Error Flow Through Validation Pipeline

Errors flow through the 7-stage validation pipeline, with different error types being generated at each stage:

### Stage 1: Schema (Client-Side)
- **Error Type:** Zod schema violations
- **Examples:** Type mismatches, missing required fields
- **Mapping:** Zod errors → ValidationError
- **Message Source:** i18n or default messages

### Stage 2: Syntax (Client-Side)
- **Error Type:** Format violations
- **Examples:** Invalid IP addresses, malformed email, bad CIDR notation
- **Mapping:** Syntax validators → ValidationError
- **Message Source:** Custom validators

### Stage 3: Cross-Resource (Backend)
- **Error Type:** Resource conflicts
- **Examples:** Duplicate IPs, port conflicts, name collisions
- **Mapping:** Backend conflict detection → ValidationError + ResourceConflict
- **Message Source:** Backend API

### Stage 4: Dependencies (Backend)
- **Error Type:** Missing or invalid dependencies
- **Examples:** WAN interface required but not active
- **Mapping:** Dependency graph analysis → ValidationError

### Stage 5: Network (Backend)
- **Error Type:** Network-level validation
- **Examples:** IP unreachable, VLAN unavailable
- **Mapping:** Network tests → ValidationError

### Stage 6: Platform (Backend)
- **Error Type:** Router capability issues
- **Examples:** Feature not supported on RouterOS version
- **Mapping:** Capability check → ValidationError

### Stage 7: Dry-Run (Backend)
- **Error Type:** Simulation failures
- **Examples:** Configuration would fail if applied
- **Mapping:** Dry-run results → ValidationError

**Error Propagation:**

```
Frontend Form
     ↓
[User Input]
     ↓
Stage 1-2: Client Validation
     ├─ Zod Errors → mapZodErrors()
     └─ → ValidationError[]
          ↓
[Display field errors]
     ↓
User submits
     ↓
Stage 3-7: Backend Validation
     ├─ GraphQL Response with errors
     └─ → mapBackendErrorsToForm()
          ↓
[Display server errors on fields]
     ↓
User corrects and resubmits
     ├─ clearServerErrors() called first
     └─ Cycle repeats
```

---

## Error Display Patterns

### Pattern 1: Field-Level Errors

Display errors directly on the form field where they occurred.

```tsx
function EmailField({ form }) {
  const error = form.formState.errors.email;

  return (
    <div>
      <input
        {...form.register('email')}
        aria-invalid={!!error}
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <span className="text-red-500 text-sm" role="alert">
          {error.message}
        </span>
      )}
    </div>
  );
}
```

### Pattern 2: Form-Level Error Summary

Show all errors at the top of the form for critical failures.

```tsx
function ValidationErrorSummary({ result }) {
  if (result.isValid) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
      <h3 className="font-bold text-red-900 mb-2">Validation Failed</h3>
      <ul className="space-y-1">
        {result.errors.map((err, i) => (
          <li key={i} className="text-red-700 text-sm">
            {err.fieldPath && <strong>{err.fieldPath}: </strong>}
            {err.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Pattern 3: Suggested Fixes

When an error has a `suggestedFix`, display it as actionable help.

```tsx
function ErrorWithSuggestion({ error }) {
  return (
    <div className="border-l-4 border-red-500 p-3 bg-red-50">
      <p className="font-semibold text-red-900">{error.message}</p>
      {error.suggestedFix && (
        <p className="text-sm text-red-700 mt-1">
          💡 Suggestion: {error.suggestedFix}
        </p>
      )}
    </div>
  );
}
```

### Pattern 4: Resource Conflict Display

When a conflict exists with another resource, show context.

```tsx
function ConflictDisplay({ conflict }) {
  return (
    <div className="border-l-4 border-amber-500 p-3 bg-amber-50">
      <p className="font-semibold text-amber-900">
        {conflict.type === 'port' && `Port ${conflict.currentValue}`}
        {conflict.type === 'ip' && `IP ${conflict.currentValue}`}
        {conflict.type === 'vlan' && `VLAN ${conflict.currentValue}`}
        {' is already in use by '}
        <strong>{conflict.conflictingResourceName}</strong>
      </p>
      <p className="text-sm text-amber-800 mt-1">
        Current value: {conflict.currentValue}
        {' | Conflicting value: '}
        {conflict.conflictingValue}
      </p>
      {conflict.suggestedFix && (
        <p className="text-sm text-amber-700 mt-2">
          Suggested: {conflict.suggestedFix}
        </p>
      )}
    </div>
  );
}
```

### Pattern 5: Warning Display

Display warnings as non-blocking alerts.

```tsx
function WarningAlert({ warning }) {
  return (
    <div className="border-l-4 border-yellow-500 p-3 bg-yellow-50">
      <p className="text-sm text-yellow-900">
        <strong>Warning:</strong> {warning.message}
      </p>
    </div>
  );
}
```

### Pattern 6: Clearing Errors on Field Edit

Clear server errors when user starts editing a field.

```tsx
function FieldWithErrorClearance({ form, fieldPath }) {
  return (
    <input
      {...form.register(fieldPath)}
      onFocus={() => {
        clearServerErrors(form.formState.errors, form.clearErrors);
      }}
    />
  );
}
```

---

## Code Examples

### Complete Form with Error Handling

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { mapBackendErrorsToForm, clearServerErrors } from '@nasnet/core/forms';

const schema = z.object({
  email: z.string().email('Invalid email'),
  port: z.number().min(1).max(65535),
  vpnName: z.string().min(1, 'Name required')
});

function CreateVPNForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur'
  });

  async function onSubmit(data) {
    try {
      const result = await createVPNMutation({ variables: { data } });

      if (!result.isValid) {
        mapBackendErrorsToForm(result.errors, form.setError);
        return;
      }

      // Success
      navigate('/vpn-list');
    } catch (error) {
      // Handle network errors
      form.setError('root', { message: 'Failed to create VPN' });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Server errors summary */}
      {form.formState.errors.root && (
        <div className="bg-red-50 p-3 rounded border border-red-200">
          {form.formState.errors.root.message}
        </div>
      )}

      {/* Email field */}
      <div>
        <label htmlFor="email">Email</label>
        <input
          {...form.register('email')}
          id="email"
          onFocus={() => clearServerErrors(form.formState.errors, form.clearErrors)}
        />
        {form.formState.errors.email && (
          <span className="text-red-500 text-sm">
            {form.formState.errors.email.message}
          </span>
        )}
      </div>

      {/* Port field */}
      <div>
        <label htmlFor="port">Port</label>
        <input
          {...form.register('port', { valueAsNumber: true })}
          id="port"
          type="number"
          onFocus={() => clearServerErrors(form.formState.errors, form.clearErrors)}
        />
        {form.formState.errors.port && (
          <span className="text-red-500 text-sm">
            {form.formState.errors.port.message}
          </span>
        )}
      </div>

      {/* VPN name */}
      <div>
        <label htmlFor="vpnName">VPN Name</label>
        <input
          {...form.register('vpnName')}
          id="vpnName"
          onFocus={() => clearServerErrors(form.formState.errors, form.clearErrors)}
        />
        {form.formState.errors.vpnName && (
          <span className="text-red-500 text-sm">
            {form.formState.errors.vpnName.message}
          </span>
        )}
      </div>

      <button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Creating...' : 'Create VPN'}
      </button>
    </form>
  );
}
```

### Using with Validation Pipeline

```tsx
import { useValidationPipeline } from '@nasnet/core/forms';
import type { ValidationResult } from '@nasnet/core/forms';

function WANConfigForm() {
  const form = useForm({ schema: wanSchema });
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const pipeline = useValidationPipeline({
    schema: wanSchema,
    strategy: 'high', // Full 7-stage validation for high-risk WAN changes
    resourceUuid: routerId,
    enabled: form.formState.isDirty
  });

  async function onValidate() {
    const result = await pipeline.validate(form.getValues());
    setValidationResult(result);

    if (!result.isValid) {
      // Display all errors
      result.errors.forEach(err => {
        if (err.fieldPath) {
          form.setError(err.fieldPath as any, {
            type: 'server',
            message: err.message
          });
        }
      });

      // Display conflicts
      if (result.conflicts.length > 0) {
        form.setError('root', {
          message: `${result.conflicts.length} conflicts detected`
        });
      }
    }
  }

  return (
    <form>
      {/* Validation progress */}
      <div className="space-y-1">
        {pipeline.stages.map(stage => (
          <div key={stage.stage} className="flex items-center gap-2">
            <span className="w-24 text-sm font-mono">{stage.stage}</span>
            <span className="text-xs text-gray-600">
              {stage.status === 'failed' ? '✗' : stage.status === 'passed' ? '✓' : '...'}
            </span>
            {stage.durationMs && (
              <span className="text-xs text-gray-500">({stage.durationMs}ms)</span>
            )}
          </div>
        ))}
      </div>

      {/* Fields */}
      {/* ... form fields ... */}

      <button
        type="button"
        onClick={onValidate}
        disabled={pipeline.isValidating}
      >
        Validate Configuration
      </button>

      {validationResult && (
        <div className={validationResult.isValid ? 'bg-green-50' : 'bg-red-50'} className="p-4 rounded mt-4">
          {validationResult.isValid ? (
            <p className="text-green-900">All validations passed!</p>
          ) : (
            <div>
              <p className="font-bold text-red-900 mb-2">Validation failed:</p>
              <ul className="space-y-1">
                {validationResult.errors.map((err, i) => (
                  <li key={i} className="text-red-700 text-sm">
                    {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
```

---

## Testing Error Scenarios

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import {
  mapBackendErrorsToForm,
  groupErrorsByField,
  combineFieldErrors
} from '@nasnet/core/forms';
import type { ValidationError } from '@nasnet/core/forms';

describe('Error Mapping', () => {
  it('should group errors by field', () => {
    const errors: ValidationError[] = [
      { fieldPath: 'email', message: 'Already exists', code: 'DUPLICATE' },
      { fieldPath: 'email', message: 'Invalid domain', code: 'INVALID_FORMAT' },
      { fieldPath: 'port', message: 'In use', code: 'PORT_IN_USE' }
    ];

    const grouped = groupErrorsByField(errors);

    expect(grouped.get('email')).toHaveLength(2);
    expect(grouped.get('port')).toHaveLength(1);
  });

  it('should combine multiple errors for same field', () => {
    const errors: ValidationError[] = [
      { fieldPath: 'email', message: 'Already exists', code: 'DUPLICATE' },
      { fieldPath: 'email', message: 'Invalid domain', code: 'INVALID_FORMAT' }
    ];

    const combined = combineFieldErrors(errors);

    expect(combined).toBe('Already exists. Invalid domain');
  });

  it('should handle nested field paths', () => {
    const errors: ValidationError[] = [
      { fieldPath: 'peers.0.endpoint', message: 'Invalid endpoint', code: 'INVALID_FORMAT' }
    ];

    const grouped = groupErrorsByField(errors);

    expect(grouped.has('peers.0.endpoint')).toBe(true);
  });
});
```

### Integration Test Example

```typescript
describe('Form Error Handling', () => {
  it('should map backend errors to form fields', async () => {
    const { result } = renderHook(() => useForm({ schema: testSchema }));

    const backendErrors: ValidationError[] = [
      { fieldPath: 'email', message: 'Email already registered', code: 'DUPLICATE' },
      { fieldPath: 'port', message: 'Port in use', code: 'PORT_IN_USE' }
    ];

    mapBackendErrorsToForm(backendErrors, result.current.setError);

    await waitFor(() => {
      expect(result.current.formState.errors.email?.message).toBe('Email already registered');
      expect(result.current.formState.errors.port?.message).toBe('Port in use');
    });
  });
});
```

---

## Best Practices

1. **Always provide fieldPath** - Errors without `fieldPath` should be displayed as form-level errors, not field-level
2. **Use suggestedFix generously** - Help users understand how to resolve conflicts
3. **Clear server errors on field edit** - Users expect errors to disappear when they start typing
4. **Group similar errors** - Use `groupErrorsByField()` when displaying multiple errors per field
5. **Distinguish error types** - Show conflicts differently from validation errors
6. **Localize messages** - Use i18n for user-facing error messages
7. **Handle nested paths** - Test with deeply nested field errors (e.g., `peers.0.endpoint`)
8. **Don't repeat errors** - Use `combineFieldErrors()` to avoid duplicate messages
9. **Display warnings prominently** - Don't bury non-blocking warnings in the UI
10. **Test error scenarios** - Include error cases in component tests

---

## Related Documentation

- [Validation Pipeline](./validation-pipeline.md) - Complete 7-stage validation flow
- [Form Architecture](../sub-libraries/forms.md) - Core forms library overview
- [i18n Flow](./internationalization-flow.md) - Internationalization patterns
