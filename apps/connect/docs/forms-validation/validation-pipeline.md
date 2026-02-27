# Validation Pipeline

The validation pipeline (`libs/core/forms/src/validation-pipeline/`) orchestrates multi-stage
validation that combines local Zod schema checks with backend network-aware checks. The number of
stages that run depends on how risky the operation is.

## The 7 Stages

```
Stage 1: schema        ← local Zod validation (always runs)
Stage 2: syntax        ← format checks beyond Zod (server-side)
Stage 3: cross-resource ← dependency and conflict detection
Stage 4: dependencies  ← checks that referenced resources exist
Stage 5: network       ← IP collision, routing loop detection
Stage 6: platform      ← RouterOS version compatibility checks
Stage 7: dry-run       ← attempt the operation without committing
```

## Risk Levels

The `riskLevel` setting selects which stages to run. This prevents unnecessarily slow validation for
trivial changes.

| Risk level | Stages run                                           |
| ---------- | ---------------------------------------------------- |
| `low`      | `schema`, `syntax`                                   |
| `medium`   | `schema`, `syntax`, `cross-resource`, `dependencies` |
| `high`     | All 7 stages                                         |

**Guidelines for choosing risk level:**

- `low` — read-only forms, cosmetic changes (renaming, adding a tag)
- `medium` — configuration changes with potential cross-resource effects (DHCP pool change, DNS
  server update)
- `high` — network topology changes, new VPN tunnels, firewall rule modifications, anything that
  could interrupt connectivity

## Stage Status Values

Each stage reports one of:

| Status    | Meaning                                                      |
| --------- | ------------------------------------------------------------ |
| `pending` | Queued but not yet started                                   |
| `running` | Currently executing                                          |
| `passed`  | Completed with no errors                                     |
| `failed`  | One or more errors found                                     |
| `skipped` | Not in scope for the current risk level, or pipeline aborted |

## ValidationPipeline Class

File: `libs/core/forms/src/validation-pipeline/ValidationPipeline.ts`

```typescript
import { createValidationPipeline } from '@nasnet/core/forms';

// Create a pipeline
const pipeline = createValidationPipeline(
  async (request) => {
    // Call the backend validate mutation
    const result = await validateMutation({ variables: { ...request } });
    return result.data.validate;
  },
  { riskLevel: 'high', stopOnError: false, includeDryRun: true },
  {
    onStageStart: (stage) => console.log(`Starting: ${stage}`),
    onStageComplete: (result) => updateUI(result),
    onProgress: (current, total) => setProgress(current / total),
  }
);

// Run validation
const result = await pipeline.validate(
  'wireguard-peer', // resourceType
  formData, // form values
  existingPeerId, // resourceId (undefined for create)
  routerId // router context
);

if (!result.isValid) {
  // Map errors to form fields
  Object.entries(result.fieldErrors).forEach(([field, errors]) => {
    form.setError(field, { type: errors[0].code, message: errors[0].message });
  });
}
```

## ValidationPipelineConfig

```typescript
interface ValidationPipelineConfig {
  riskLevel: 'low' | 'medium' | 'high';
  stopOnError?: boolean; // default: false (run all stages)
  skipStages?: ValidationStageName[];
  stageTimeout?: number; // ms per stage
  includeDryRun?: boolean; // default: false (dry-run stage only when true)
}
```

## ValidationPipelineResult

```typescript
interface ValidationPipelineResult {
  isValid: boolean;
  stages: ValidationStageResult[]; // one per stage
  errors: ValidationError[]; // all errors across all stages
  warnings: ValidationError[];
  totalDurationMs: number;
  fieldErrors: Record<string, ValidationError[]>; // keyed by form field path
}
```

## ValidationError Shape

```typescript
interface ValidationError {
  code: string; // e.g., 'IP_COLLISION', 'E001'
  message: string; // human-readable
  fieldPath?: string; // e.g., 'address', 'peers.0.publicKey'
  severity: 'error' | 'warning';
  stage: ValidationStageName;
  suggestions?: string[];
  relatedResources?: string[];
}
```

## Mapping Errors to React Hook Form

Use `mapToFormErrors` to convert pipeline field errors to React Hook Form's `setError` format:

```typescript
import { mapToFormErrors } from '@nasnet/core/forms';

const result = await pipeline.validate('wireguard-peer', formData);
if (!result.isValid) {
  const formErrors = mapToFormErrors(result.fieldErrors);
  // { publicKey: { type: 'INVALID_KEY', message: 'Key must be 44 chars' } }
  Object.entries(formErrors).forEach(([field, error]) => {
    form.setError(field as FieldPath<FormData>, error);
  });
}
```

## useValidationPipeline Hook

The `useValidationPipeline` hook (`libs/core/forms/src/useValidationPipeline.ts`) provides a
React-integrated version:

```typescript
import { useValidationPipeline } from '@nasnet/core/forms';

function MyForm() {
  const pipeline = useValidationPipeline({
    schema: mySchema,
    strategy: 'medium',
    resourceUuid: existingResourceId,
    enabled: true,
  });

  // pipeline.validate(data) — trigger validation
  // pipeline.stages       — array of stage results for progress UI
  // pipeline.isValid      — overall validity
  // pipeline.errors       — all errors
  // pipeline.conflicts    — cross-resource conflicts
}
```

## Aborting a Running Pipeline

```typescript
const pipeline = createValidationPipeline(validateFn, config);

// Start validation
const validationPromise = pipeline.validate('interface', data);

// Abort if user navigates away
pipeline.abort();

// The result will show remaining stages as 'skipped'
const result = await validationPromise;
```

## Backend Request Format

The pipeline sends a single request to the backend for all non-schema stages:

```typescript
interface ValidationRequest {
  resourceType: string;
  resourceId?: string;
  data: Record<string, unknown>;
  stages: ValidationStageName[];
  routerId?: string;
}
```

The backend processes all requested stages and returns results in a single `ValidationResponse`.
This avoids multiple round-trips for high-risk validations.
