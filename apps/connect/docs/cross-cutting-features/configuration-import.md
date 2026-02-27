# Configuration Import

The configuration import feature lets users apply RouterOS script commands (`.rsc` files) to a
router through a guided wizard. It also handles service configuration sharing — exporting a service
instance's config as JSON and importing it on another router.

**Key files:**

- `libs/features/configuration-import/src/components/ConfigurationImportWizard.tsx` — main wizard
- `libs/features/configuration-import/src/components/ConfigurationInput.tsx` — file/paste input
- `libs/features/configuration-import/src/components/ProtocolSelector.tsx` — protocol choice
- `libs/features/configuration-import/src/components/ExecutionProgress.tsx` — live progress
- `libs/features/configuration-import/src/hooks/useConfigurationCheck.ts` — onboarding trigger
- `libs/api-client/queries/src/services/useServiceSharing.ts` — service config import/export

**Cross-references:**

- See `service-marketplace.md` for service config import/export
- See `../data-fetching/graphql-hooks.md` for batch job hooks

---

## RouterOS Script Import Wizard

The `ConfigurationImportWizard` is a 3-step dialog for applying RouterOS commands to a router. It is
used:

- During onboarding (first connection to a new router)
- Manually via "Import Configuration" in the router panel

```typescript
interface ConfigurationImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  routerIp: string;
  credentials: { username: string; password: string };
  onSuccess?: () => void;
  onSkip?: () => void;
}
```

### Wizard Steps

```
[input] → [protocol] → [execute] → (complete)
```

Step indicators show numbered circles with green checkmarks for completed steps.

---

### Step 1: Configuration Input

Component: `ConfigurationInput`

Accepts RouterOS script content via:

- **Drag and drop** — drop a `.rsc` file onto the upload zone
- **File browser** — click to open file picker (accepts `.rsc` files)
- **Paste** — toggle to text area mode and paste script content directly

```typescript
interface ConfigurationInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}
```

Input modes (toggled by the user):

- `'upload'` — shows drop zone with upload icon
- `'paste'` — shows textarea for manual entry

Validation: non-empty content required before advancing to step 2.

---

### Step 2: Protocol Selection

Component: `ProtocolSelector`

Displays three protocol cards. Available protocols are fetched via `useEnabledProtocols(routerIp)`:

```typescript
const { api, ssh, telnet, isLoading } = useEnabledProtocols(routerIp);
```

| Protocol | Icon       | Description                                                |
| -------- | ---------- | ---------------------------------------------------------- |
| API      | Plug       | RouterOS API (port 8728/8729) — recommended for RouterOS 6 |
| SSH      | Terminal   | Secure Shell (port 22)                                     |
| Telnet   | MonitorDot | Telnet (port 23) — legacy, not recommended                 |

Disabled protocols (not enabled on the router) are shown grayed out with a tooltip. The recommended
protocol is highlighted.

```typescript
interface ProtocolSelectorProps {
  value: ExecutionProtocol | null;
  onChange: (protocol: ExecutionProtocol) => void;
  apiEnabled: boolean;
  sshEnabled: boolean;
  telnetEnabled: boolean;
  disabled?: boolean;
  isLoading?: boolean;
}
```

---

### Step 3: Execution Progress

Component: `ExecutionProgress`

After the user selects a protocol and clicks "Apply":

1. `useCreateBatchJob()` creates a batch job on the backend with the script content and selected
   protocol
2. `useBatchJob(jobId)` polls the job status
3. `ExecutionProgress` renders the live status

```typescript
interface ExecutionProgressProps {
  job: BatchJob | null;
  isLoading?: boolean;
  error?: Error | null;
  onCancel?: () => void;
  onRetry?: () => void;
  isCancelling?: boolean;
}
```

The batch job contains an array of commands parsed from the `.rsc` file. Each command shows:

- Status icon (pending / running / success / failed / skipped)
- Command text (truncated for readability)
- Error message if failed

A progress bar shows `completedCommands / totalCommands * 100%`.

### Batch Job Status Values

| Status      | Description                  |
| ----------- | ---------------------------- |
| `PENDING`   | Job created, not yet started |
| `RUNNING`   | Commands being executed      |
| `COMPLETED` | All commands succeeded       |
| `FAILED`    | One or more commands failed  |
| `CANCELLED` | User cancelled mid-execution |

On failure, the backend automatically rolls back successfully applied commands in reverse order (the
batch executor rollback mechanism).

---

## Step 4: Complete (Implicit)

When `job.status === 'COMPLETED'`:

- Wizard shows success state with checkmark animation
- `onSuccess()` callback is called (triggers refetch of router data)
- User can close the dialog

---

## Onboarding Trigger

`useConfigurationCheck` auto-opens the wizard on first connection to an unconfigured router:

```typescript
function RouterPanel({ routerId, routerIp }) {
  const { showWizard, closeWizard, needsConfiguration } = useConfigurationCheck(
    routerId,
    routerIp,
  );

  return (
    <>
      <ConfigurationImportWizard
        isOpen={showWizard}
        onClose={closeWizard}
        routerIp={routerIp}
        credentials={savedCredentials}
        onSuccess={handleSuccess}
        onSkip={closeWizard}
      />
      {/* Router panel content */}
    </>
  );
}
```

### Detection Logic

The hook checks if the router is "unconfigured" by fetching the RouterOS system note:

```typescript
const { data: noteData } = useSystemNote(routerIp);
const needsConfiguration = !noteData?.note.trim(); // empty note = unconfigured
```

The wizard is only shown once per router per session. The router store tracks
`isConfigurationChecked(routerId)` to prevent showing it again after the user closes or skips the
wizard.

```typescript
// Router store tracks checked state
const alreadyChecked = useRouterStore((state) => state.isConfigurationChecked)(routerId);
const markChecked = useRouterStore((state) => state.markConfigurationChecked);
```

---

## Service Configuration Import/Export

Separate from the RouterOS script import, service configurations (Tor, sing-box, etc.) can be shared
between routers as JSON packages.

All three operations come from `useServiceSharing()`:

```typescript
const { exportService, generateQR, importService } = useServiceSharing();
```

### Export as JSON

```typescript
const { exportService } = useExportService();

const result = await exportService({
  routerID: 'router-1',
  instanceID: 'instance-123',
  redactSecrets: true, // Mask passwords, keys, tokens
  includeRoutingRules: true, // Include PBR and routing config
});

if (result.data?.exportServiceConfig.success) {
  window.open(result.data.exportServiceConfig.downloadURL, '_blank');
}
```

The exported JSON is a "sharing package" containing:

- Service type and version
- Configuration fields (sensitive fields redacted if `redactSecrets: true`)
- Port allocations
- Routing rules (optional)

### Generate QR Code

For sharing to mobile apps or other routers without file transfer:

```typescript
const { generateQR } = useGenerateConfigQR();

const result = await generateQR({
  routerID: 'router-1',
  instanceID: 'instance-123',
  redactSecrets: true,
  includeRoutingRules: false,
  imageSize: 512, // pixels
});

const imgSrc = `data:image/png;base64,${result.data?.generateConfigQR.imageDataBase64}`;
```

### Import (Validate + Apply)

The import flow is two-phase: first validate (dry run), then apply:

```typescript
const { importService } = useImportService();

// Phase 1: Validate (dry run)
const validationResult = await importService({
  routerID: 'router-2',
  package: importedJSON,
  dryRun: true,
});

if (validationResult.data?.importServiceConfig.valid) {
  // Phase 2: Apply
  await importService({
    routerID: 'router-2',
    package: importedJSON,
    dryRun: false,
    // Fill in any redacted secrets
    redactedFieldValues: {
      password: userProvidedPassword,
    },
  });
}
```

On successful apply (non-dry-run), Apollo automatically refetches `GET_SERVICE_INSTANCES` and
`GET_SERVICE_INSTANCE` queries.

### Import Validation Errors

When `dryRun: true` and `valid: false`, the response contains validation errors explaining what's
wrong:

- Missing required fields (secrets that were redacted)
- Version incompatibility (service binary version mismatch)
- Port conflicts (requested ports already in use)
- Schema validation failures

The `ServiceImportDialog` component (from `@nasnet/ui/patterns`) wraps this two-phase flow into a
user-friendly dialog.

---

## Supported Import Formats

| Format                   | Usage                        | Hook                        |
| ------------------------ | ---------------------------- | --------------------------- |
| `.rsc` (RouterOS script) | Bulk router configuration    | `ConfigurationImportWizard` |
| JSON sharing package     | Service config transfer      | `useImportService`          |
| QR code                  | Mobile-friendly config share | `useGenerateConfigQR`       |

RouterOS `.rsc` files are plain text with one command per line (e.g.,
`/ip address add address=192.168.1.1/24 interface=ether1`). The batch executor parses these
line-by-line.
