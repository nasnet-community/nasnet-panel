# Form Utilities

This document covers the core form utility hooks and functions in `libs/core/forms/src/`.

## useZodForm

File: `libs/core/forms/src/useZodForm.ts`

A thin wrapper around `useForm` from React Hook Form that automatically wires in a Zod schema via
`zodResolver`. The primary advantage over calling `useForm` directly is that TypeScript infers form
field types from the schema — no manual type annotation required.

### Signature

```typescript
function useZodForm<T extends ZodSchema>(options: UseZodFormOptions<T>): UseFormReturn<z.infer<T>>;

interface UseZodFormOptions<T extends ZodSchema>
  extends Omit<UseFormProps<z.infer<T>>, 'resolver'> {
  schema: T; // required
}
```

### Usage

```typescript
import { z } from 'zod';
import { useZodForm } from '@nasnet/core/forms';
import { ipv4, port } from '@nasnet/core/forms/network-validators';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: ipv4,
  listenPort: port,
  enabled: z.boolean().default(true),
});

function MyForm() {
  const form = useZodForm({
    schema,
    defaultValues: {
      name: '',
      address: '',
      listenPort: 51820,
      enabled: true,
    },
    mode: 'onBlur',  // 'onBlur' is the default
  });

  const onSubmit = form.handleSubmit(async (data) => {
    // data is fully typed as z.infer<typeof schema>
    await save(data);
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...form.register('name')} />
      {form.formState.errors.name && (
        <p>{form.formState.errors.name.message}</p>
      )}
      <button disabled={form.formState.isSubmitting}>Save</button>
    </form>
  );
}
```

### Default Behaviour

- Validation mode defaults to `'onBlur'` (validates when a field loses focus)
- All other React Hook Form options pass through unchanged

---

## useFormPersistence

File: `libs/core/forms/src/useFormPersistence.ts`

Automatically saves form data to `sessionStorage` (default) on every change and restores it on
mount. Designed for long forms where the user might accidentally refresh or navigate away.

### Signature

```typescript
function useFormPersistence<T extends FieldValues>(
  options: UseFormPersistenceOptions<T>
): UseFormPersistenceResult;
```

### Options

| Option          | Type               | Default          | Description                        |
| --------------- | ------------------ | ---------------- | ---------------------------------- |
| `form`          | `UseFormReturn<T>` | required         | React Hook Form instance           |
| `storageKey`    | `string`           | required         | Unique key for storage             |
| `storage`       | `Storage`          | `sessionStorage` | Storage backend                    |
| `debounceMs`    | `number`           | `1000`           | Delay before writing (ms)          |
| `excludeFields` | `(keyof T)[]`      | `[]`             | Fields to exclude from persistence |

### Usage

```typescript
import { useZodForm, useFormPersistence } from '@nasnet/core/forms';

function WizardStep1() {
  const form = useZodForm({ schema, defaultValues });

  const { clearPersistence, hasSavedData, restore } = useFormPersistence({
    form,
    storageKey: 'vpn-wizard-step-1',
    excludeFields: ['password'],  // never persist sensitive fields
  });

  return (
    <>
      {hasSavedData() && (
        <Alert>Your previous progress has been restored.</Alert>
      )}
      <form>...</form>
    </>
  );
}
```

### Returned Methods

| Method               | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `clearPersistence()` | Remove saved data from storage                               |
| `hasSavedData()`     | Returns `true` if saved data exists                          |
| `restore()`          | Manually trigger restoration (called automatically on mount) |

### Important: Clear on Completion

Always call `clearPersistence()` when the form is successfully submitted to prevent stale data
appearing on the next visit:

```typescript
const onSubmit = form.handleSubmit(async (data) => {
  await save(data);
  persistence.clearPersistence(); // clean up after success
});
```

---

## useFormResourceSync

File: `libs/core/forms/src/useFormResourceSync.ts`

Bridges React Hook Form with the Universal State v2 8-layer model. Manages the Edit layer (form
draft), Optimistic layer, Validation layer, and Error layer in a unified way.

### Signature

```typescript
function useFormResourceSync<T extends FieldValues>(
  options: UseFormResourceSyncOptions<T> & { form: UseFormReturn<T> }
): UseFormResourceSyncReturn<T>;
```

### Options

| Option            | Type                         | Default  | Description                            |
| ----------------- | ---------------------------- | -------- | -------------------------------------- |
| `form`            | `UseFormReturn<T>`           | required | React Hook Form instance               |
| `sourceData`      | `T \| null`                  | required | Server data to sync with               |
| `resourceId`      | `string`                     | —        | For edit forms                         |
| `resourceVersion` | `string`                     | —        | For conflict detection                 |
| `onSave`          | `(data: T) => Promise<void>` | —        | Mutation function                      |
| `onSaveError`     | `(error: Error) => void`     | —        | Error callback                         |
| `onSourceChange`  | `(newSource: T) => void`     | —        | Called if source updates while editing |
| `autoReset`       | `boolean`                    | `true`   | Reset form when source changes         |
| `trackChanges`    | `boolean`                    | `true`   | Compute diff against source            |

### Usage

```typescript
import { useFormResourceSync, useZodForm } from '@nasnet/core/forms';
import { useResourceQuery } from '@nasnet/api-client/queries';

function EditWireGuardPeer({ peerId }: { peerId: string }) {
  const { data: peer } = useResourceQuery(peerId);
  const form = useZodForm({ schema, defaultValues: peer ?? {} });

  const { state, actions, canSave, changedFields, conflict } = useFormResourceSync({
    form,
    sourceData: peer,
    resourceId: peerId,
    resourceVersion: peer?.version,
    onSave: async (data) => {
      await updatePeer(peerId, data);
    },
    onSaveError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <form onSubmit={form.handleSubmit(() => actions.startSave())}>
      {conflict.hasConflict && (
        <Alert>
          Source data changed while you were editing.
          <Button onClick={() => actions.discardChanges()}>Discard my changes</Button>
          <Button onClick={() => actions.mergeSourceChanges(myMerger)}>Merge</Button>
        </Alert>
      )}
      {changedFields.length > 0 && (
        <Badge>{changedFields.length} unsaved changes</Badge>
      )}
      <FormFields />
      <Button type="submit" disabled={!canSave || state.isSaving}>
        {state.isSaving ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
```

### State Layers

The `state` object exposes the Universal State v2 layers:

| Property                 | Layer      | Description                         |
| ------------------------ | ---------- | ----------------------------------- |
| `state.source`           | Source     | Last data from backend              |
| `state.optimistic`       | Optimistic | Pending mutation response           |
| `state.edit`             | Edit       | Current form values                 |
| `state.validation`       | Validation | `isValid`, `isValidating`, `errors` |
| `state.error`            | Error      | Last mutation error                 |
| `state.isDirty`          | —          | Form has unsaved changes            |
| `state.isSaving`         | —          | Mutation in flight                  |
| `state.hasSourceChanged` | —          | Backend version changed during edit |

### Actions

| Action                           | Description                                  |
| -------------------------------- | -------------------------------------------- |
| `actions.startSave()`            | Execute save with optimistic update          |
| `actions.completeSave()`         | Mark save complete (source → current values) |
| `actions.handleSaveError(err)`   | Handle failure (clears optimistic)           |
| `actions.resetToSource()`        | Reset form to last server data               |
| `actions.discardChanges()`       | Reset and clear errors                       |
| `actions.applyOptimistic(data)`  | Manually apply optimistic state              |
| `actions.clearOptimistic()`      | Remove optimistic state                      |
| `actions.mergeSourceChanges(fn)` | Resolve conflict with custom merge function  |

---

## Backend Error Mapping

File: `libs/core/forms/src/mapBackendErrors.ts`

Utilities for translating backend validation errors into React Hook Form's error format.

### mapBackendErrorsToForm

Maps `ValidationError[]` (from the validation pipeline or a GraphQL response) to form field errors.
Supports nested paths like `peers.0.endpoint`.

```typescript
import { mapBackendErrorsToForm } from '@nasnet/core/forms';

const result = await validateMutation({ variables: { data } });
if (!result.isValid) {
  mapBackendErrorsToForm(result.errors, form.setError);
}
```

### clearServerErrors

Removes all errors with `type: 'server'` from the form. Call this before re-validating to remove
stale errors.

```typescript
import { clearServerErrors } from '@nasnet/core/forms';

// Before making a new API call
clearServerErrors(form.formState.errors, form.clearErrors);
```

### groupErrorsByField

Groups errors by field path for batch processing:

```typescript
import { groupErrorsByField } from '@nasnet/core/forms';

const grouped = groupErrorsByField(errors);
// Map { 'address' => [...], 'name' => [...] }
```

### combineFieldErrors

Joins multiple error messages for the same field into a single string:

```typescript
import { combineFieldErrors } from '@nasnet/core/forms';

const message = combineFieldErrors(grouped.get('email') ?? []);
// "Already exists. Invalid domain"
```
