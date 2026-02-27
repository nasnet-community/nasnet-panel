# Forms and Validation Overview

NasNetConnect uses React Hook Form for form state management and Zod for schema-driven validation.
These two libraries are integrated through a set of utilities in `libs/core/forms/src/`.

## Core Stack

| Library                   | Role                                                             |
| ------------------------- | ---------------------------------------------------------------- |
| `react-hook-form`         | Uncontrolled form state, field registration, submission handling |
| `zod`                     | Schema definition and synchronous validation                     |
| `@hookform/resolvers/zod` | Bridges Zod schemas into React Hook Form's resolver interface    |

## Standard Form Pattern

The standard pattern for any form in the codebase is:

```typescript
import { z } from 'zod';
import { useZodForm } from '@nasnet/core/forms';
import { ipv4, port } from '@nasnet/core/forms/network-validators';

// 1. Define schema with Zod
const schema = z.object({
  name: z.string().min(1, 'Name is required').max(64),
  address: ipv4,
  listenPort: port,
  enabled: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

// 2. Create form with useZodForm
function WireGuardForm() {
  const form = useZodForm({
    schema,
    defaultValues: {
      name: '',
      address: '',
      listenPort: 51820,
      enabled: true,
    },
    mode: 'onBlur',  // default
  });

  // 3. Handle submission
  const handleSubmit = form.handleSubmit(async (data: FormData) => {
    await createWireGuard(data);
  });

  return (
    <form onSubmit={handleSubmit}>
      <input {...form.register('name')} />
      {form.formState.errors.name && (
        <span>{form.formState.errors.name.message}</span>
      )}
      <button type="submit" disabled={form.formState.isSubmitting}>
        Save
      </button>
    </form>
  );
}
```

## NasFormProvider (High-Level API)

For forms that require backend validation, use `NasFormProvider`. It wraps the above pattern and
wires in the validation pipeline automatically:

```typescript
import { NasFormProvider } from '@nasnet/core/forms';

function WireGuardForm() {
  return (
    <NasFormProvider
      schema={schema}
      defaultValues={{ name: '', address: '', listenPort: 51820 }}
      onSubmit={async (data) => await createWireGuard(data)}
      validationStrategy="high"   // 'low' | 'medium' | 'high'
      resourceUuid={existingId}   // for edit forms
    >
      <FormFields />
      <FormSubmitButton />
    </NasFormProvider>
  );
}
```

`NasFormProvider` (`libs/core/forms/src/NasFormProvider.tsx`):

- Initialises React Hook Form with `zodResolver`
- Runs the validation pipeline on submit for `medium` and `high` strategies
- Maps backend validation errors back to form fields via `mapBackendErrorsToForm`
- Exposes `useNasFormContext()` for child components to read `isSubmitting` and `validationResult`

## Validation Modes

| Mode               | When triggered                                                   |
| ------------------ | ---------------------------------------------------------------- |
| `onBlur` (default) | Validate each field when the user leaves it                      |
| `onChange`         | Validate on every keystroke (expensive, avoid for complex forms) |
| `onSubmit`         | Only validate when the form is submitted                         |
| `all`              | `onChange` + `onBlur`                                            |

`useZodForm` defaults to `onBlur`.

## Form Utilities Available

| Utility                  | File                       | Purpose                                  |
| ------------------------ | -------------------------- | ---------------------------------------- |
| `useZodForm`             | `useZodForm.ts`            | RHF + Zod integration hook               |
| `NasFormProvider`        | `NasFormProvider.tsx`      | High-level form provider with pipeline   |
| `useFormPersistence`     | `useFormPersistence.ts`    | Persist form data to sessionStorage      |
| `useFormResourceSync`    | `useFormResourceSync.ts`   | Sync form with Universal State v2 layers |
| `useWizardPersistence`   | `useWizardPersistence.ts`  | Multi-step wizard state and persistence  |
| `useValidationPipeline`  | `useValidationPipeline.ts` | Low-level pipeline hook                  |
| `mapBackendErrorsToForm` | `mapBackendErrors.ts`      | Map server errors to RHF fields          |
| `clearServerErrors`      | `mapBackendErrors.ts`      | Remove stale server errors               |
| Network validators       | `network-validators.ts`    | 20+ Zod schemas for IP, ports, etc.      |
| Schema utilities         | `schema-utils.ts`          | Common Zod schema compositions           |
| Error messages           | `error-messages.ts`        | Standardised validation message strings  |
| `useAsyncValidation`     | `useAsyncValidation.ts`    | Debounced async field validation         |

## Import Path

```typescript
// Core form utilities
import { useZodForm, NasFormProvider, useFormPersistence } from '@nasnet/core/forms';

// Network validators
import { ipv4, cidr, port, mac } from '@nasnet/core/forms/network-validators';
import { networkValidators } from '@nasnet/core/forms/network-validators';

// Validation pipeline
import { ValidationPipeline, createValidationPipeline } from '@nasnet/core/forms';
```

## Related Documents

- [Validation Pipeline](./validation-pipeline.md) — the 7-stage backend validation flow
- [Network Validators](./network-validators.md) — all 20+ Zod schemas for network types
- [Form Utilities](./form-utilities.md) — useZodForm, useFormPersistence, useFormResourceSync
- [Wizard Forms](./wizard-forms.md) — multi-step forms with persistence
- [`../cross-cutting-features/change-set-system.md`](../cross-cutting-features/change-set-system.md)
  — how form submissions interact with change sets
