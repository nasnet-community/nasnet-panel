# Forms & Validation Library Reference

> Comprehensive guide to `@nasnet/core/forms` — the schema-driven forms library with 7-stage
> validation pipeline

## Table of Contents

1. [Overview](#overview)
2. [NasFormProvider Component](#nasformprovider-component)
3. [useZodForm Hook](#usezodform-hook)
4. [7-Stage Validation Pipeline](#7-stage-validation-pipeline)
5. [Network Validators](#network-validators)
6. [Network Utilities](#network-utilities)
7. [Schema Utilities](#schema-utilities)
8. [Form Persistence](#form-persistence)
9. [Wizard Persistence](#wizard-persistence)
10. [Form-Resource Sync](#form-resource-sync)
11. [Backend Error Mapping](#backend-error-mapping)
12. [Error Messages & i18n](#error-messages--i18n)
13. [Validation Strategy Configuration](#validation-strategy-configuration)

---

## Overview

The `@nasnet/core/forms` library provides a comprehensive forms system featuring:

- **Schema-driven forms** — Define forms with Zod schemas for type-safe validation
- **7-stage validation pipeline** — Progressive validation from schema → syntax → cross-resource →
  dependencies → network → platform → dry-run
- **Risk-based strategies** — Low (client-only) / Medium (backend validation) / High (full
  pipeline + preview + countdown)
- **Network validators** — 25+ pre-built validators for IPv4, MAC, CIDR, ports, VLAN IDs, etc.
- **Form persistence** — Auto-save form state with session/local storage
- **Wizard persistence** — Multi-step wizard support with step tracking and TTL
- **Universal State v2 integration** — Sync forms with router state (optimistic updates, conflict
  detection)
- **Locale-aware error messages** — i18n-aware error message translation

---

## NasFormProvider Component

The main form provider that wraps React Hook Form with Zod validation and the validation pipeline:

```typescript
interface NasFormProviderProps<T extends ZodSchema> {
  /** Zod schema for form validation */
  schema: T;

  /** Initial form values */
  defaultValues?: Partial<z.infer<T>>;

  /** Called when form is submitted */
  onSubmit: (data: z.infer<T>) => void | Promise<void>;

  /** Called when validation result changes */
  onValidationChange?: (result: ValidationResult | null) => void;

  /** Risk level: 'low' | 'medium' | 'high' */
  validationStrategy?: ValidationStrategy;

  /** Optional resource ID for backend validation context */
  resourceUuid?: string;

  /** Form children */
  children: React.ReactNode;
}
```

### Usage Example

```typescript
import { z } from 'zod';
import { NasFormProvider, useZodForm } from '@nasnet/core/forms';
import { networkValidators } from '@nasnet/core/forms';

const wireguardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  endpoint: networkValidators.ipWithPort,
  publicKey: networkValidators.wgKey,
  dns: networkValidators.ipv4.optional(),
});

function WireguardPeerForm() {
  const handleSubmit = async (data) => {
    await api.createWireguardPeer(data);
  };

  const handleValidationChange = (result) => {
    console.log('Validation result:', result);
  };

  return (
    <NasFormProvider
      schema={wireguardSchema}
      defaultValues={{
        name: '',
        endpoint: '',
        publicKey: '',
        dns: undefined,
      }}
      onSubmit={handleSubmit}
      onValidationChange={handleValidationChange}
      validationStrategy="medium"
    >
      <FormFields />
      <SubmitButton />
    </NasFormProvider>
  );
}
```

### useNasFormContext Hook

Access form context within provider:

```typescript
import { useNasFormContext } from '@nasnet/core/forms';

function FormDebugInfo() {
  const { validationStrategy, isSubmitting, validationResult } = useNasFormContext();

  return (
    <div>
      <p>Strategy: {validationStrategy}</p>
      <p>Submitting: {isSubmitting}</p>
      <p>Valid: {validationResult?.isValid}</p>
    </div>
  );
}
```

---

## useZodForm Hook

A wrapper around React Hook Form that integrates Zod schema validation:

```typescript
interface UseZodFormOptions<T extends ZodSchema>
  extends Omit<UseFormProps<z.infer<T>>, 'resolver'> {
  /** Zod schema for validation */
  readonly schema: T;
}

function useZodForm<T extends ZodSchema>(options: UseZodFormOptions<T>): UseFormReturn<z.infer<T>>;
```

### Usage Example

```typescript
import { z } from 'zod';
import { useZodForm } from '@nasnet/core/forms';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password too short'),
  rememberMe: z.boolean().default(false),
});

function LoginForm() {
  const form = useZodForm({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onBlur',  // Validate on blur
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const result = await loginUser(data);
    if (result.error) {
      form.setError('root', {
        type: 'submit',
        message: result.error,
      });
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...form.register('email')} placeholder="Email" />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}

      <input {...form.register('password')} type="password" placeholder="Password" />
      {form.formState.errors.password && (
        <span>{form.formState.errors.password.message}</span>
      )}

      <label>
        <input {...form.register('rememberMe')} type="checkbox" />
        Remember me
      </label>

      <button type="submit" disabled={form.formState.isSubmitting}>
        Login
      </button>

      {form.formState.errors.root && (
        <Alert type="error">{form.formState.errors.root.message}</Alert>
      )}
    </form>
  );
}
```

---

## 7-Stage Validation Pipeline

Progressive validation system with 7 stages, configurable by risk level:

### Validation Stages

```typescript
type ValidationStage =
  | 'schema' // Stage 1: Zod schema validation (local)
  | 'syntax' // Stage 2: Format and syntax checks
  | 'cross-resource' // Stage 3: Conflict detection (IPs, ports, names)
  | 'dependencies' // Stage 4: Field dependency validation
  | 'network' // Stage 5: Network connectivity checks
  | 'platform' // Stage 6: Router compatibility checks
  | 'dry-run'; // Stage 7: Backend dry-run execution
```

### Stage Results

Each stage produces:

```typescript
interface ValidationStageResult {
  stage: ValidationStage;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
  durationMs?: number;
}
```

### Risk-Level Configuration

Stages executed based on risk level:

```typescript
// Low-risk: Client-only (schema + syntax)
// Example: WiFi password, display name, comment
low: {
  stages: ['schema', 'syntax'],
  clientOnly: true,
  requiresConfirmation: false,
}

// Medium-risk: Schema + backend validation (no dry-run)
// Example: Firewall rules, DHCP settings, VPN peer
medium: {
  stages: ['schema', 'syntax', 'cross-resource', 'dependencies'],
  clientOnly: false,
  requiresConfirmation: false,
}

// High-risk: Full pipeline with dry-run + preview + countdown
// Example: WAN link changes, routing tables, VPN deletion
high: {
  stages: ['schema', 'syntax', 'cross-resource', 'dependencies', 'network', 'platform', 'dry-run'],
  clientOnly: false,
  requiresConfirmation: true,
  confirmationSteps: ['preview', 'countdown'],
}
```

### ValidationPipeline Class

Low-level orchestration of the validation pipeline:

```typescript
class ValidationPipeline {
  constructor(options: ValidationPipelineOptions, config: ValidationPipelineConfig);

  /**
   * Run the validation pipeline
   */
  async validate(
    resourceType: string,
    data: Record<string, unknown>,
    resourceId?: string,
    routerId?: string
  ): Promise<ValidationPipelineResult>;

  /**
   * Abort the running pipeline
   */
  abort(): void;
}
```

**Options:**

```typescript
interface ValidationPipelineOptions {
  /** Function to call backend validation API */
  validateFn: (request: ValidationRequest) => Promise<ValidationResponse>;

  /** Optional callbacks */
  onStageStart?: (stage: ValidationStageName) => void;
  onStageComplete?: (result: ValidationStageResult) => void;
  onProgress?: (current: number, total: number) => void;
}
```

**Configuration:**

```typescript
interface ValidationPipelineConfig {
  /** Risk level: 'low' | 'medium' | 'high' */
  riskLevel: RiskLevel;

  /** Stop on first error */
  stopOnError?: boolean;

  /** Stages to skip */
  skipStages?: ValidationStageName[];

  /** Include dry-run stage */
  includeDryRun?: boolean;
}
```

### useValidationPipeline Hook

React hook for validation pipeline with state management:

```typescript
interface UseValidationPipelineOptions<TFieldValues extends FieldValues> {
  /** Backend validation function */
  validateFn: (request: ValidationRequest) => Promise<ValidationResponse>;

  /** Resource type (e.g., 'wireguard-peer') */
  resourceType: string;

  /** Optional resource ID for edits */
  resourceId?: string;

  /** Optional router ID for context */
  routerId?: string;

  /** Risk level */
  riskLevel?: RiskLevel;

  /** Stop on error */
  stopOnError?: boolean;

  /** Stages to skip */
  skipStages?: ValidationStageName[];

  /** Include dry-run */
  includeDryRun?: boolean;

  /** React Hook Form setError for mapping errors */
  setError?: UseFormSetError<TFieldValues>;

  /** Callbacks */
  onComplete?: (result: ValidationPipelineResult) => void;
  onStageComplete?: (result: ValidationStageResult) => void;
}

function useValidationPipeline<TFieldValues extends FieldValues>(
  options: UseValidationPipelineOptions<TFieldValues>
): UseValidationPipelineReturn;
```

**Usage Example:**

```typescript
function WizardStep({ data, onNext }) {
  const form = useZodForm({ schema: stepSchema, defaultValues: data });

  const { state, validate, hasErrors } = useValidationPipeline({
    validateFn: api.validateWireguardPeer,
    resourceType: 'wireguard-peer',
    riskLevel: 'medium',
    setError: form.setError,
  });

  const handleSubmit = async (formData) => {
    const result = await validate(formData);

    if (result.isValid) {
      onNext(formData);
    } else {
      console.log('Errors:', result.errors);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {/* form fields */}
      {state.isValidating && <ProgressBar value={state.progress} />}
      <button disabled={state.isValidating || hasErrors}>
        Next
      </button>
    </form>
  );
}
```

---

## Network Validators

25+ pre-built Zod validators for network-specific types:

### Basic IP Validators

```typescript
// IPv4 address (e.g., "192.168.1.1")
ipv4.parse('192.168.1.1'); // ✓
ipv4.parse('256.1.1.1'); // ✗ (octet > 255)
ipv4.parse('192.168.001.1'); // ✗ (leading zero)

// IPv6 address (e.g., "2001:db8::1")
ipv6.parse('2001:db8::1'); // ✓
ipv6.parse('::1'); // ✓ (loopback)

// IP address (IPv4 or IPv6)
ipAddress.parse('192.168.1.1'); // ✓
ipAddress.parse('2001:db8::1'); // ✓
```

### MAC Address

```typescript
// Colon or hyphen separators
mac.parse('00:1A:2B:3C:4D:5E'); // ✓
mac.parse('00-1A-2B-3C-4D-5E'); // ✓
mac.parse('001A2B3C4D5E'); // ✗ (no separators)
```

### Network Notation

```typescript
// CIDR notation (IPv4)
cidr.parse('192.168.1.0/24'); // ✓
cidr.parse('192.168.1.0/33'); // ✗ (prefix > 32)

// CIDR notation (IPv6)
cidr6.parse('2001:db8::/32'); // ✓
cidr6.parse('2001:db8::/129'); // ✗ (prefix > 128)
```

### Port Validators

```typescript
// Single port number
port.parse(8080); // ✓
port.parse(0); // ✗ (< 1)
port.parse(65536); // ✗ (> 65535)

// Port as string
portString.parse('8080'); // ✓
portString.parse('0'); // ✗

// Port range
portRange.parse('8080'); // ✓ (single)
portRange.parse('80-443'); // ✓ (range)
portRange.parse('443-80'); // ✗ (start > end)

// Multiple ports (comma-separated)
multiPort.parse('80,443,8080'); // ✓
multiPort.parse('22, 80, 443'); // ✓ (spaces allowed)
multiPort.parse('80,65536'); // ✗ (port out of range)
```

### VLAN ID

```typescript
// VLAN ID (1-4094 per IEEE 802.1Q)
vlanId.parse(100); // ✓
vlanId.parse(4094); // ✓ (highest)
vlanId.parse(0); // ✗ (reserved)
vlanId.parse(4095); // ✗ (reserved)

// As string
vlanIdString.parse('100'); // ✓
vlanIdString.parse('0'); // ✗
```

### WireGuard & Crypto

```typescript
// WireGuard key (base64, 44 chars ending in '=')
wgKey.parse('jI6DYlg34+z6Q+q6d8YB5ibQwQAawamJBcht5xF24mE='); // ✓
wgKey.parse('AAAA'); // ✗ (too short)
```

### Domain Names

```typescript
// Hostname (RFC 1123)
hostname.parse('router'); // ✓
hostname.parse('my-router.local'); // ✓
hostname.parse('-invalid'); // ✗ (starts with hyphen)

// Domain name (requires TLD)
domain.parse('example.com'); // ✓
domain.parse('sub.example.co.uk'); // ✓
domain.parse('localhost'); // ✗ (no TLD)
domain.parse('example.c'); // ✗ (TLD too short)
```

### Interface & Comments

```typescript
// MikroTik interface name
interfaceName.parse('ether1'); // ✓
interfaceName.parse('vlan.100'); // ✓
interfaceName.parse('bridge-1'); // ✓
interfaceName.parse('_invalid'); // ✗ (starts with underscore)

// Comment (255 chars, no control chars)
comment.parse('This is a valid comment'); // ✓
comment.parse('a'.repeat(255)); // ✓
comment.parse('a'.repeat(256)); // ✗ (too long)
comment.parse('Comment\nwith newline'); // ✗ (control char)
```

### Time & Bandwidth

```typescript
// Duration string (s/m/h/d)
duration.parse('30s'); // ✓
duration.parse('5m'); // ✓
duration.parse('2h'); // ✓
duration.parse('7d'); // ✓
duration.parse('30'); // ✗ (missing unit)

// Bandwidth (optional unit: k/m/g)
bandwidth.parse('100'); // ✓
bandwidth.parse('100k'); // ✓
bandwidth.parse('1.5m'); // ✓
bandwidth.parse('1G'); // ✓
bandwidth.parse('100x'); // ✗ (invalid unit)
```

### Extended Validators (NAS-4A.3)

```typescript
// Subnet mask in dotted decimal
subnetMask.parse('255.255.255.0'); // ✓
subnetMask.parse('255.0.255.0'); // ✗ (non-contiguous)

// IP with port
ipWithPort.parse('192.168.1.1:8080'); // ✓
ipWithPort.parse('192.168.1.1'); // ✗ (missing port)

// IP range
ipRange.parse('192.168.1.1-192.168.1.100'); // ✓
ipRange.parse('192.168.1.100-192.168.1.1'); // ✗ (start > end)

// Private IP (RFC 1918)
privateIp.parse('192.168.1.1'); // ✓
privateIp.parse('10.0.0.1'); // ✓
privateIp.parse('8.8.8.8'); // ✗ (public)

// Public IP
publicIp.parse('8.8.8.8'); // ✓
publicIp.parse('192.168.1.1'); // ✗ (private)

// Multicast IP (224.0.0.0/4)
multicastIp.parse('224.0.0.1'); // ✓
multicastIp.parse('192.168.1.1'); // ✗

// Loopback IP (127.x.x.x)
loopbackIp.parse('127.0.0.1'); // ✓
loopbackIp.parse('192.168.1.1'); // ✗
```

### Bulk Import

```typescript
import { networkValidators } from '@nasnet/core/forms';

const schema = z.object({
  ipAddress: networkValidators.ipv4,
  port: networkValidators.port,
  vlan: networkValidators.vlanId,
  dns: networkValidators.ipv4.optional(),
});
```

---

## Network Utilities

Helper functions for IP manipulation and network calculations:

### IP Address Manipulation

```typescript
// Convert IPv4 string to 32-bit number
ipToLong('192.168.1.1'); // 3232235777
ipToLong('255.255.255.255'); // 4294967295

// Convert 32-bit number to IPv4 string
longToIp(3232235777); // '192.168.1.1'

// Check if IP is in subnet
isInSubnet('192.168.1.5', '192.168.1.0/24'); // true
isInSubnet('192.168.2.5', '192.168.1.0/24'); // false

// Get network information from CIDR
getSubnetInfo('192.168.1.0/24');
// {
//   networkAddress: '192.168.1.0',
//   broadcastAddress: '192.168.1.255',
//   subnetMask: '255.255.255.0',
//   prefixLength: 24,
//   firstUsableHost: '192.168.1.1',
//   lastUsableHost: '192.168.1.254',
//   usableHostCount: 254,
//   totalAddresses: 256
// }

// Individual network calculations
getNetworkAddress('192.168.1.50', '255.255.255.0'); // '192.168.1.0'
getBroadcastAddress('192.168.1.50', '255.255.255.0'); // '192.168.1.255'
getFirstUsableHost('192.168.1.0', '255.255.255.0'); // '192.168.1.1'
getLastUsableHost('192.168.1.0', '255.255.255.0'); // '192.168.1.254'
getUsableHostCount('192.168.1.0/24'); // 254
```

### Subnet Mask Conversion

```typescript
// CIDR to subnet mask
cidrToSubnetMask(24); // '255.255.255.0'
cidrToSubnetMask(16); // '255.255.0.0'

// Subnet mask to CIDR
subnetMaskToCidr('255.255.255.0'); // 24
subnetMaskToCidr('255.255.0.0'); // 16
```

### Subnet Overlap

```typescript
// Check if two subnets overlap
doSubnetsOverlap('192.168.1.0/24', '192.168.1.128/25'); // true (overlap)
doSubnetsOverlap('192.168.1.0/24', '192.168.2.0/24'); // false (no overlap)
```

### IP Classification

```typescript
// Check IP classification
isPrivateIp('192.168.1.1'); // true
isPublicIp('8.8.8.8'); // true
isLoopbackIp('127.0.0.1'); // true
isMulticastIp('224.0.0.1'); // true
isLinkLocalIp('169.254.1.1'); // true

// Classify IP
classifyIp('192.168.1.1'); // 'private'
classifyIp('8.8.8.8'); // 'public'
classifyIp('127.0.0.1'); // 'loopback'
classifyIp('224.0.0.1'); // 'multicast'
```

### Network Generation

```typescript
// Check for domestic link
hasDomesticLink(wanLinks); // boolean

// Generate networks for configuration
generateNetworks({
  baseNetworks: { Foreign: true, Domestic: true, VPN: true, Split: false },
  // ... returns available network combinations
});

// Get network names by type
getForeignNetworkNames(networks); // string[]
getDomesticNetworkNames(networks); // string[]
getVPNClientNetworks(networks); // string[]

// Get available base networks
getAvailableBaseNetworks(networks); // BaseNetworks
```

---

## Schema Utilities

Helper functions for working with Zod schemas:

```typescript
// Make all fields optional
makePartial(userSchema);
// { name?: string; email?: string }

// Merge two schemas
mergeSchemas(baseSchema, extensionSchema);
// Combined schema with all fields from both

// Pick specific fields
pickFields(schema, ['name', 'email']);
// Schema with only name and email

// Omit specific fields
omitFields(schema, ['password']);
// Schema without password field

// Optional string (transforms '' to undefined)
optionalString();

// Required string (min 1 character)
requiredString('This field is required');

// Number from string input (for form inputs)
numberFromString({ min: 0, max: 100, integer: true });

// Boolean from string input
booleanFromString();

// Conditional schema based on values
conditionalSchema((data) => data.type === 'custom', z.object({ customField: z.string() }));
```

---

## Form Persistence

Auto-save form data with recovery on page reload:

```typescript
interface UseFormPersistenceOptions<T extends FieldValues> {
  /** React Hook Form instance */
  form: UseFormReturn<T>;

  /** Unique storage key */
  storageKey: string;

  /** Storage implementation (defaults to sessionStorage) */
  storage?: Storage;

  /** Debounce delay in ms (default: 1000) */
  debounceMs?: number;

  /** Fields to exclude from persistence */
  excludeFields?: (keyof T)[];
}

function useFormPersistence<T extends FieldValues>(
  options: UseFormPersistenceOptions<T>
): UseFormPersistenceResult;
```

### Usage Example

```typescript
import { useZodForm, useFormPersistence } from '@nasnet/core/forms';

function SetupWizardStep1() {
  const form = useZodForm({
    schema: step1Schema,
    defaultValues: { name: '', address: '' },
  });

  const persistence = useFormPersistence({
    form,
    storageKey: 'setup-wizard-step-1',
    storage: sessionStorage,
    debounceMs: 1000,
  });

  useEffect(() => {
    if (persistence.hasSavedData()) {
      // Auto-restored on component mount
      alert('Your progress has been restored');
    }
  }, []);

  const handleNext = async (data) => {
    // Proceed to next step
    persistence.clearPersistence(); // Clear when done
  };

  return (
    <form onSubmit={form.handleSubmit(handleNext)}>
      {/* form fields */}
    </form>
  );
}
```

### Methods

```typescript
// Clear persisted data
persistence.clearPersistence();

// Check if data exists
persistence.hasSavedData(); // boolean

// Manually restore (auto-called on mount)
persistence.restore(); // boolean (true if restored)
```

---

## Wizard Persistence

Multi-step wizard state management with progress tracking:

```typescript
interface UseWizardPersistenceOptions<TStepData> {
  /** Unique storage key */
  storageKey: string;

  /** Array of step IDs in order */
  stepIds: string[];

  /** Initial step (default: first) */
  initialStep?: string | number;

  /** Storage implementation (default: sessionStorage) */
  storage?: Storage;

  /** TTL in ms (default: 24 hours) */
  ttlMs?: number;

  /** Callbacks */
  onRestore?: (state: WizardPersistedState<TStepData>) => void;
  onExpire?: () => void;
}

function useWizardPersistence<TStepData extends Record<string, FieldValues>>(
  options: UseWizardPersistenceOptions<TStepData>
): UseWizardPersistenceReturn<TStepData>;
```

### Usage Example

```typescript
type VPNWizardData = {
  basic: { name: string; description: string };
  network: { address: string; port: number };
  security: { password: string; twoFactor: boolean };
};

function VPNWizard() {
  const wizard = useWizardPersistence<VPNWizardData>({
    storageKey: 'vpn-setup-wizard',
    stepIds: ['basic', 'network', 'security'],
    ttlMs: 60 * 60 * 1000, // 1 hour
  });

  if (wizard.wasRestored) {
    return <Alert>Progress restored from last session</Alert>;
  }

  return (
    <>
      <ProgressBar value={wizard.progress} />

      {wizard.currentStep === 'basic' && (
        <BasicStep
          data={wizard.getStepData('basic')}
          onNext={(data) => {
            wizard.setStepData('basic', data);
            wizard.completeStep('basic');
            wizard.nextStep();
          }}
        />
      )}

      {wizard.currentStep === 'network' && (
        <NetworkStep
          data={wizard.getStepData('network')}
          onNext={(data) => {
            wizard.setStepData('network', data);
            wizard.completeStep('network');
            wizard.nextStep();
          }}
        />
      )}

      {wizard.currentStep === 'security' && (
        <SecurityStep
          data={wizard.getStepData('security')}
          onSubmit={(data) => {
            wizard.setStepData('security', data);
            wizard.completeStep('security');

            // Submit all data
            const allData = wizard.getAllStepData();
            api.createVPN(allData);

            // Clear persistence when done
            wizard.clearPersistence();
          }}
        />
      )}
    </>
  );
}
```

### Available Methods

```typescript
// Get/set step data
wizard.getStepData('basic'); // VPNWizardData['basic'] | undefined
wizard.setStepData('basic', data); // void

// Step navigation
wizard.nextStep(); // Go to next step
wizard.prevStep(); // Go to previous step
wizard.goToStep('network'); // Jump to specific step

// Step completion
wizard.completeStep('basic'); // Mark step as done
wizard.isStepCompleted('basic'); // boolean
wizard.canGoToStep('network'); // boolean

// State information
wizard.currentStep; // 'basic' | 'network' | 'security'
wizard.currentStepIndex; // 0 | 1 | 2
wizard.progress; // 0-100
wizard.completedSteps; // string[]
wizard.isFirstStep; // boolean
wizard.isLastStep; // boolean
wizard.wasRestored; // boolean

// Metadata
wizard.setMetadata({ userId: '123' }); // Store custom data
wizard.state.metadata; // Metadata object

// Reset/clear
wizard.reset(); // Reset to initial state
wizard.clearPersistence(); // Delete all persisted data
wizard.getAllStepData(); // Get combined data from all steps
```

---

## Form-Resource Sync

Synchronize React Hook Form with Universal State v2 (8-layer state model):

```typescript
interface UseFormResourceSyncOptions<T extends FieldValues> {
  /** Source data from backend */
  sourceData: T | null;

  /** Unique resource identifier */
  resourceId?: string;

  /** Resource version for conflict detection */
  resourceVersion?: string;

  /** Callback when saving */
  onSave?: (data: T) => Promise<void> | void;

  /** Callback on save error */
  onSaveError?: (error: Error) => void;

  /** Callback when source changes */
  onSourceChange?: (newSource: T) => void;

  /** Auto-reset when source changes */
  autoReset?: boolean;

  /** Track changed fields */
  trackChanges?: boolean;
}

function useFormResourceSync<T extends FieldValues>(
  form: UseFormReturn<T>,
  options: UseFormResourceSyncOptions<T>
): UseFormResourceSyncReturn<T>;
```

### State Layers (Universal State v2)

```typescript
interface FormResourceState<T> {
  /** Layer 1: Source data from backend */
  source: T | null;

  /** Layer 4: Optimistic state for pending mutations */
  optimistic: T | null;

  /** Layer 5: Current edit draft in the form */
  edit: T | null;

  /** Layer 6: Validation results */
  validation: {
    isValid: boolean;
    isValidating: boolean;
    errors: ValidationError[];
  };

  /** Layer 7: Error state */
  error: Error | null;

  // Computed state
  isDirty: boolean;
  isSaving: boolean;
  hasSourceChanged: boolean;
}
```

### Usage Example

```typescript
import { useZodForm, useFormResourceSync } from '@nasnet/core/forms';
import { useQuery } from '@apollo/client';

function InterfaceEditor({ interfaceId }: { interfaceId: string }) {
  // Query the interface
  const { data, refetch } = useQuery(GET_INTERFACE, {
    variables: { id: interfaceId },
  });

  const form = useZodForm({
    schema: interfaceSchema,
    defaultValues: data?.interface || {},
  });

  // Sync form with resource
  const sync = useFormResourceSync(form, {
    sourceData: data?.interface || null,
    resourceId: interfaceId,
    resourceVersion: data?.interface?.version,
    onSave: async (formData) => {
      await api.updateInterface(interfaceId, formData);
    },
    onSourceChange: (newSource) => {
      // Handle external changes
      console.log('Interface updated externally:', newSource);
    },
    autoReset: true,
    trackChanges: true,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    sync.actions.startSave();
    try {
      await sync.actions.applyOptimistic(data);
      await sync.actions.completeSave();
    } catch (error) {
      sync.actions.handleSaveError(error as Error);
    }
  });

  return (
    <>
      {sync.state.hasSourceChanged && (
        <Alert>
          This resource was modified elsewhere.
          <button onClick={() => sync.actions.resetToSource()}>
            Reload
          </button>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* form fields */}
      </form>

      <div>
        <p>Changed fields: {sync.changedFields.join(', ')}</p>
        <p>Dirty: {sync.state.isDirty}</p>
        <p>Saving: {sync.state.isSaving}</p>
        <button
          onClick={() => sync.actions.discardChanges()}
          disabled={!sync.state.isDirty}
        >
          Discard
        </button>
      </div>
    </>
  );
}
```

### Actions

```typescript
// Apply source data
sync.actions.applySource(newData);

// Optimistic updates (immediate UI feedback)
sync.actions.applyOptimistic(optimisticData);
sync.actions.clearOptimistic();

// Save operations
sync.actions.startSave();
sync.actions.completeSave();
sync.actions.handleSaveError(error);

// Reset and discard
sync.actions.resetToSource();
sync.actions.discardChanges();

// Conflict resolution
sync.actions.mergeSourceChanges((source, edit) => ({
  ...source,
  ...edit,
  // Custom merge logic
}));
```

---

## Backend Error Mapping

Convert backend validation errors to React Hook Form errors:

```typescript
// Map errors from backend validation
mapBackendErrorsToForm(errors, form.setError);

// Clear server-type errors
clearServerErrors(form.formState.errors, form.clearErrors);

// Convert single error
toFormError(backendError);
// { type: 'server', message: 'Email already exists' }

// Group errors by field
groupErrorsByField(errors);
// { email: [error1], password: [error2] }

// Combine multiple errors per field
combineFieldErrors(errorsByField);
// { email: { type: 'server', message: 'Email already exists' } }
```

### Usage Example

```typescript
const result = await validateMutation({ variables: { data } });

if (!result.isValid) {
  // Map backend errors to form fields
  mapBackendErrorsToForm(result.errors, form.setError);
}
```

---

## Error Messages & i18n

Custom Zod error messages with i18n support:

```typescript
import { createZodErrorMap, setGlobalErrorMap } from '@nasnet/core/forms';
import { useTranslation } from '@nasnet/core/i18n';

function FormSetup() {
  const { t } = useTranslation('validation');

  // Create error map with translations
  const errorMap = createZodErrorMap(t);

  // Set globally (affects all Zod parsing in app)
  z.setErrorMap(errorMap);

  // Or use per-schema
  const schema = z.string().min(1);
  const result = schema.safeParse('', { errorMap });
}
```

### Default Error Messages

```typescript
{
  'validation.required': 'This field is required',
  'validation.string.min': 'Must be at least {{min}} characters',
  'validation.string.max': 'Must be at most {{max}} characters',
  'validation.string.email': 'Please enter a valid email address',
  'validation.number.min': 'Must be at least {{min}}',
  'validation.number.max': 'Must be at most {{max}}',
  'validation.number.int': 'Must be a whole number',
  // ... etc
}
```

### Custom Error Messages

Define custom error messages in translation files:

**locales/en/validation.json:**

```json
{
  "validation": {
    "ipv4": "Invalid IPv4 address",
    "mac": "Invalid MAC address format",
    "wireguard_key": "Invalid WireGuard key",
    "custom.peer_name": "Peer name must be unique"
  }
}
```

Then use in schemas:

```typescript
const peerSchema = z.object({
  name: z
    .string()
    .min(1)
    .refine(
      async (val) => {
        const exists = await checkPeerExists(val);
        return !exists;
      },
      { message: t('validation.custom.peer_name') }
    ),
});
```

---

## Validation Strategy Configuration

Risk-based validation configuration:

```typescript
export const VALIDATION_CONFIGS: Record<ValidationStrategy, ValidationConfig> = {
  low: {
    stages: ['schema', 'syntax'],
    clientOnly: true,
    requiresConfirmation: false,
  },
  medium: {
    stages: ['schema', 'syntax', 'cross-resource', 'dependencies'],
    clientOnly: false,
    requiresConfirmation: false,
  },
  high: {
    stages: [
      'schema',
      'syntax',
      'cross-resource',
      'dependencies',
      'network',
      'platform',
      'dry-run',
    ],
    clientOnly: false,
    requiresConfirmation: true,
    confirmationSteps: ['preview', 'countdown'],
  },
};
```

### Stage Labels

```typescript
export const STAGE_LABELS: Record<ValidationStage, string> = {
  schema: 'Schema Validation',
  syntax: 'Format Check',
  'cross-resource': 'Conflict Detection',
  dependencies: 'Dependencies',
  network: 'Network Availability',
  platform: 'Router Compatibility',
  'dry-run': 'Simulation',
};
```

### Choosing Risk Level

**Low Risk** (WiFi password, display name, comment):

- User-facing text fields
- Simple input validation
- No backend impact
- Fast response needed

**Medium Risk** (Firewall rules, DHCP settings, VPN peer config):

- Network configuration
- Could conflict with other resources
- Backend validation needed
- No dry-run required

**High Risk** (WAN link changes, routing tables, VPN deletion):

- System-critical changes
- Could break connectivity
- Requires dry-run + preview
- Needs explicit confirmation countdown

---

## Best Practices

### 1. **Use NasFormProvider for Standard Forms**

```typescript
// Preferred
<NasFormProvider
  schema={schema}
  onSubmit={handleSubmit}
  validationStrategy="medium"
>
  {/* form fields */}
</NasFormProvider>

// Only use useZodForm directly for simple forms without validation pipeline
const form = useZodForm({ schema });
```

### 2. **Validate Based on Risk**

```typescript
// Low-risk: Just use Zod
<NasFormProvider
  schema={simpleSchema}
  validationStrategy="low"
  onSubmit={handleSubmit}
>
  {/* No backend calls */}
</NasFormProvider>

// Medium-risk: Schema + backend validation
<NasFormProvider
  schema={networSchema}
  validationStrategy="medium"
  onSubmit={handleSubmit}
>
  {/* Backend validates for conflicts */}
</NasFormProvider>

// High-risk: Full validation + preview + countdown
<NasFormProvider
  schema={criticalSchema}
  validationStrategy="high"
  onSubmit={handleSubmit}
>
  {/* Full pipeline with dry-run */}
</NasFormProvider>
```

### 3. **Use Form Persistence for Wizards**

```typescript
// Multi-step wizard
const wizard = useWizardPersistence({
  storageKey: 'setup-wizard',
  stepIds: ['step1', 'step2', 'step3'],
});

// Single-step form with recovery
const persistence = useFormPersistence({
  form,
  storageKey: 'complex-form',
});
```

### 4. **Handle Backend Errors Properly**

```typescript
const handleSubmit = async (data) => {
  try {
    const result = await api.validate(data);
    if (!result.isValid) {
      mapBackendErrorsToForm(result.errors, form.setError);
      return;
    }
    await api.save(data);
  } catch (error) {
    form.setError('root', {
      type: 'submit',
      message: 'Failed to save',
    });
  }
};
```

### 5. **Sync with Resource State**

```typescript
// Use form-resource sync for editor forms
const sync = useFormResourceSync(form, {
  sourceData: currentResource,
  resourceId: resourceId,
  onSave: api.updateResource,
  trackChanges: true,
});

// Show dirty state and conflict warnings
{sync.state.isDirty && <SaveButton />}
{sync.state.hasSourceChanged && <ConflictAlert />}
```

---

## References

- **Validation Pipeline Architecture:**
  `Docs/architecture/implementation-patterns/data-validation-patterns.md`
- **Universal State v2:** `Docs/architecture/data-architecture.md`
- **React Hook Form Docs:** https://react-hook-form.com/
- **Zod Docs:** https://zod.dev/
