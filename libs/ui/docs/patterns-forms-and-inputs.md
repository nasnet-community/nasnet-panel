# Form System, Network Inputs & Steppers (Layer 2)

This document covers all Layer 2 pattern components related to forms, specialized inputs, and multi-step flows. These components live in `libs/ui/patterns/src/` and are exported from `@nasnet/ui/patterns`.

Cross-references:
- See `primitives-reference.md` for the base `Form`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` primitives from `@nasnet/ui/primitives`.
- See `multi-package-flows.md` for the full Apply-Confirm-Merge configuration pipeline where `ValidationProgress` is used end-to-end.

---

## Form Architecture

### Layer 1 Foundation

The primitives package (`@nasnet/ui/primitives`) provides unstyled, Radix-based form primitives:

- `Form`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage` — shadcn/ui form wrappers built on `@hookform/resolvers` context.
- These give you the raw semantic structure (label linkage, error regions, ARIA attributes) but carry no business logic.

Use Layer 1 primitives directly only when building entirely custom field layouts that do not need RHF integration helpers.

### Layer 2 Patterns

The patterns package adds two things on top of the primitives:

1. **RHF-integrated field wrappers** (`RHFFormField`, `FormArrayField`, `FormSubmitButton`, `FormFieldError`, `FormFieldDescription`) — components that connect to `useFormContext()` and own the Controller boilerplate.
2. **Structural components** (`FormField`, `FormSection`) — layout wrappers for consistent spacing, collapsibility, and section-level error summaries.

### React Hook Form + Zod Integration Pattern

Every form in the codebase follows this pattern:

```tsx
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RHFFormField,
  FormSubmitButton,
  FormSection,
} from '@nasnet/ui/patterns';

const schema = z.object({
  hostname: z.string().min(1, 'Required'),
  ipAddress: z.string().ip('Must be a valid IP'),
});

type FormValues = z.infer<typeof schema>;

function RouterForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { hostname: '', ipAddress: '' },
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormSection title="Router Identity">
          <RHFFormField name="hostname" label="Hostname" required />
          <RHFFormField name="ipAddress" label="IP Address" type="text" />
        </FormSection>
        <FormSubmitButton loadingText="Saving...">Save</FormSubmitButton>
      </form>
    </FormProvider>
  );
}
```

The `FormProvider` wraps everything so that `RHFFormField` and `FormSubmitButton` can call `useFormContext()` internally without needing `control` passed as a prop every time.

---

## RHFFormField System

### RHFFormField

**File:** `libs/ui/patterns/src/rhf-form-field/RHFFormField.tsx`

**Import:**
```tsx
import { RHFFormField, type RHFFormFieldProps, type FieldMode } from '@nasnet/ui/patterns';
```

**Props:**
```tsx
export type FieldMode = 'editable' | 'readonly' | 'hidden' | 'computed';

export interface RHFFormFieldProps<TFieldValues extends FieldValues = FieldValues> {
  /** Field name matching the form schema */
  name: Path<TFieldValues>;
  /** Label text */
  label: string;
  /** Help text/description — shown below input when no error */
  description?: string;
  /** Whether the field is required — shows asterisk */
  required?: boolean;
  /** Field display mode (default: 'editable') */
  mode?: FieldMode;
  /** Compute value from other fields when mode='computed' */
  computeFn?: (values: TFieldValues) => string | number;
  /** Input placeholder */
  placeholder?: string;
  /** Input type (default: 'text') */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  /** Additional CSS classes for the container */
  className?: string;
  /** Additional CSS classes for the input element */
  inputClassName?: string;
  /** Custom render function — receives field, error, fieldId, mode */
  renderInput?: (props: {
    field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>;
    error: string | undefined;
    fieldId: string;
    mode: FieldMode;
  }) => React.ReactNode;
  /** Children as alternative to renderInput */
  children?: React.ReactNode;
  /** Explicit RHF control instance (uses useFormContext by default) */
  control?: Control<TFieldValues>;
  /** Pre-resolved error string (overrides form state error) */
  error?: string;
  /** Hint text below field — shown when no error and no description */
  hint?: string;
}
```

**Field Modes:**

| Mode | Behavior |
|------|----------|
| `'editable'` | Normal interactive input |
| `'readonly'` | Input rendered as disabled/muted, cannot be edited |
| `'hidden'` | Component renders `null` — field is invisible |
| `'computed'` | Value derived from `computeFn(values)`, shown in muted italic style |

**Usage Examples:**

```tsx
// Standard text field
<RHFFormField
  name="username"
  label="Username"
  description="Lowercase letters and numbers only"
  required
/>

// Custom input rendering (e.g., Select)
<RHFFormField
  name="protocol"
  label="Protocol"
  renderInput={({ field }) => (
    <Select onValueChange={field.onChange} value={field.value}>
      <SelectTrigger><SelectValue placeholder="Select protocol" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="tcp">TCP</SelectItem>
        <SelectItem value="udp">UDP</SelectItem>
      </SelectContent>
    </Select>
  )}
/>

// Computed field derived from other values
<RHFFormField
  name="displayName"
  label="Display Name"
  mode="computed"
  computeFn={(values) => `${values.firstName} ${values.lastName}`}
/>

// Read-only field (shows but cannot edit)
<RHFFormField
  name="routerId"
  label="Router ID"
  mode="readonly"
/>
```

The component generates unique IDs internally via `React.useId()` and links label, description, and error via `aria-describedby` and `htmlFor`. Errors are extracted from `formState.errors` using dot-notation path traversal to support nested fields.

---

### FormFieldError

**File:** `libs/ui/patterns/src/rhf-form-field/FormFieldError.tsx`

**Import:**
```tsx
import { FormFieldError, type FormFieldErrorProps } from '@nasnet/ui/patterns';
```

**Props:**
```tsx
export interface FormFieldErrorProps {
  message?: string;
  id?: string;
  className?: string;
  showIcon?: boolean; // default: true
}
```

Renders an `AlertCircle` icon and error text with `role="alert"` and `aria-live="polite"`. Returns `null` when `message` is undefined or empty. Used internally by `RHFFormField` but can be used standalone for custom field implementations.

---

### FormFieldDescription

**File:** `libs/ui/patterns/src/rhf-form-field/FormFieldDescription.tsx`

**Import:**
```tsx
import { FormFieldDescription, type FormFieldDescriptionProps } from '@nasnet/ui/patterns';
```

**Props:**
```tsx
export interface FormFieldDescriptionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  showIcon?: boolean; // default: false — shows HelpCircle when true
}
```

Renders muted help text below a form field. Link it to the input via `aria-describedby={id}` for accessibility. Used internally by `RHFFormField` but available for standalone use in custom field implementations.

---

### FormSubmitButton

**File:** `libs/ui/patterns/src/rhf-form-field/FormSubmitButton.tsx`

**Import:**
```tsx
import { FormSubmitButton, type FormSubmitButtonProps } from '@nasnet/ui/patterns';
```

**Props:**
```tsx
export interface FormSubmitButtonProps extends Omit<ButtonProps, 'type'> {
  loadingText?: string;       // default: 'Submitting...'
  disableOnInvalid?: boolean; // default: false
}
```

Reads `isSubmitting` and `isValid` from `useFormContext()`. The button is automatically:
- Disabled when `isSubmitting` is true (prevents double submission).
- Shows a spinning `Loader2` icon with `loadingText` while submitting.
- Optionally disabled when the form has validation errors if `disableOnInvalid` is set.

```tsx
<FormSubmitButton loadingText="Applying changes..." disableOnInvalid>
  Apply Configuration
</FormSubmitButton>
```

---

### FormArrayField

**File:** `libs/ui/patterns/src/rhf-form-field/FormArrayField.tsx`

**Import:**
```tsx
import { FormArrayField, type FormArrayFieldProps } from '@nasnet/ui/patterns';
```

**Props:**
```tsx
export interface FormArrayFieldProps<TFieldValues extends FieldValues = FieldValues> {
  name: ArrayPath<TFieldValues>;
  label: string;
  description?: string;
  defaultItem: FieldArray<TFieldValues, ArrayPath<TFieldValues>>;
  maxItems?: number;          // default: 100
  minItems?: number;          // default: 0
  addButtonText?: string;     // default: 'Add'
  renderItem: (props: {
    index: number;
    remove: () => void;
    canRemove: boolean;
    fieldPrefix: string;
  }) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
}
```

Wraps `useFieldArray` with a UI for adding and removing dynamic items. The `renderItem` function receives `fieldPrefix` (e.g., `"peers.0"`) so nested `RHFFormField` components can use it directly:

```tsx
<FormArrayField
  name="peers"
  label="WireGuard Peers"
  defaultItem={{ publicKey: '', allowedIPs: '', endpoint: '' }}
  maxItems={10}
  addButtonText="Add Peer"
  renderItem={({ index, remove, canRemove, fieldPrefix }) => (
    <div className="space-y-2">
      <RHFFormField
        name={`${fieldPrefix}.publicKey` as any}
        label={`Peer ${index + 1} Public Key`}
        required
      />
      <RHFFormField
        name={`${fieldPrefix}.allowedIPs` as any}
        label="Allowed IPs"
        placeholder="0.0.0.0/0"
      />
      {canRemove && (
        <Button variant="ghost" size="sm" onClick={remove}>Remove</Button>
      )}
    </div>
  )}
/>
```

---

## FormField (Standalone Wrapper)

**File:** `libs/ui/patterns/src/form-field/form-field.tsx`

**Import:**
```tsx
import { FormField, type FormFieldProps } from '@nasnet/ui/patterns';
```

**Props:**
```tsx
export interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}
```

`FormField` is the non-RHF version. It clones its single child element and injects `id`, `aria-describedby`, and `aria-invalid` automatically. Use it when you control validation state yourself (e.g., with raw `useState` or a custom form library):

```tsx
<FormField
  label="API Key"
  description="Found in your router settings"
  error={apiKeyError}
  required
>
  <Input
    value={apiKey}
    onChange={(e) => setApiKey(e.target.value)}
  />
</FormField>
```

Note: When the child is not a single React element (e.g., you pass a fragment or multiple elements), `FormField` will render the children without ID injection. Pass `id` explicitly to the child in that case.

---

## FormSection

**File:** `libs/ui/patterns/src/form-section/FormSection.tsx`

**Import:**
```tsx
import { FormSection, type FormSectionProps } from '@nasnet/ui/patterns';
```

**Props:**
```tsx
export interface FormSectionProps {
  title: string;
  description?: string;
  collapsible?: boolean;      // default: false
  defaultOpen?: boolean;      // default: true (when collapsible)
  children: React.ReactNode;
  errors?: string[];          // Section-level error messages
  storageKey?: string;        // localStorage key for collapse state persistence
  helpId?: string;            // Help system integration
  className?: string;
  asFieldset?: boolean;       // Use fieldset/legend HTML (default: true for non-collapsible)
}
```

Groups related form fields under a titled section. When `collapsible` is true, an animated expand/collapse toggle is shown. Collapse state persists across navigations via `localStorage` when `storageKey` is provided (defaults to a slugified version of `title`).

The `errors` array renders a `FormSectionErrors` summary block above the fields — useful for section-level cross-field validation errors that do not belong to a specific field.

```tsx
<FormSection
  title="Network Settings"
  description="Configure the router's IP addressing"
  collapsible
  defaultOpen
  errors={networkErrors}
>
  <RHFFormField name="ipAddress" label="IP Address" required />
  <RHFFormField name="gateway" label="Default Gateway" />
  <RHFFormField name="dns" label="DNS Server" />
</FormSection>
```

The `useFormSection` hook drives collapse logic internally:
```tsx
// Used internally — not normally called from feature code
import { useFormSection } from '@nasnet/ui/patterns';

const { isExpanded, toggle, expand, collapse } = useFormSection({
  storageKey: 'network-settings',
  defaultOpen: true,
  collapsible: true,
});
```

---

## Network Inputs

All five network input components follow the same pattern: a headless hook containing all business logic, plus platform-specific presenters for Mobile and Desktop. The platform wrapper auto-detects breakpoint with `useMediaQuery` and renders the correct presenter.

Each is exported from `@nasnet/ui/patterns`:
```tsx
import {
  IPInput, useIPInput,
  SubnetInput, useSubnetInput,
  MACInput, useMACInput,
  PortInput, usePortInput,
  InterfaceSelector, useInterfaceSelector,
} from '@nasnet/ui/patterns';
```

All network inputs live under `libs/ui/patterns/src/network-inputs/`.

---

### IPInput

**Files:**
- `libs/ui/patterns/src/network-inputs/ip-input/ip-input.types.ts` — types
- `libs/ui/patterns/src/network-inputs/ip-input/use-ip-input.ts` — headless hook
- `libs/ui/patterns/src/network-inputs/ip-input/ip-input.tsx` — platform wrapper
- `libs/ui/patterns/src/network-inputs/ip-input/ip-input-desktop.tsx` — desktop presenter
- `libs/ui/patterns/src/network-inputs/ip-input/ip-input-mobile.tsx` — mobile presenter

**Component Props:**
```tsx
export interface IPInputProps {
  value?: string;
  onChange?: (value: string) => void;
  /** IP version: 'v4' (default), 'v6', or 'both' for auto-detect */
  version?: 'v4' | 'v6' | 'both';
  /** Show IP type badge (Private, Public, Loopback, etc.) */
  showType?: boolean;
  /** Allow CIDR suffix (e.g., 192.168.1.0/24) */
  allowCIDR?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
  name?: string;
  required?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  id?: string;
  'aria-describedby'?: string;
}
```

**Headless Hook Signature:**
```tsx
function useIPInput(config?: UseIPInputConfig): UseIPInputReturn

interface UseIPInputConfig {
  value?: string;
  onChange?: (value: string) => void;
  version?: 'v4' | 'v6' | 'both'; // default: 'v4'
  allowCIDR?: boolean;
}

interface UseIPInputReturn {
  value: string;             // Complete IP string
  segments: string[];        // 4 segments (IPv4) or 8 (IPv6)
  isValid: boolean;
  error: string | null;
  ipType: IPType | null;     // 'private' | 'public' | 'loopback' | 'link-local' | 'multicast' | 'broadcast' | 'unspecified'
  cidrPrefix: string;
  detectedVersion: 'v4' | 'v6' | null;
  segmentRefs: RefObject<HTMLInputElement | null>[];
  cidrRef: RefObject<HTMLInputElement | null>;
  setSegment: (index: number, value: string) => void;
  setCidrPrefix: (value: string) => void;
  setValue: (value: string) => void;
  handlePaste: (text: string, segmentIndex?: number) => void;
  handleKeyDown: (index: number, event: React.KeyboardEvent) => void;
  handleCidrKeyDown: (event: React.KeyboardEvent) => void;
  focusSegment: (index: number) => void;
  focusCidr: () => void;
  handleSegmentChange: (index: number, value: string, cursorPosition?: number) => void;
  segmentCount: number;      // 4 for IPv4, 8 for IPv6
  separator: string;         // '.' for IPv4, ':' for IPv6
  maxSegmentLength: number;  // 3 for IPv4, 4 for IPv6
}
```

**Validation rules:**
- IPv4 octets: 0–255, no leading zeros.
- IPv6 segments: up to 4 hex characters per segment.
- Auto-advances focus on separator key (`.` or `:`) or when segment reaches max length.
- Keyboard navigation: Arrow Left/Right moves between segments, Backspace moves back when empty, Home/End jump to first/last segment, `/` jumps to CIDR field.
- Paste detection: extracts a full IP from pasted text (e.g., pasting `192.168.1.100/24` populates all segments and CIDR).

**Desktop vs Mobile:**
- Desktop: Renders individual segment inputs separated by dots/colons, CIDR field appended with `/` separator.
- Mobile: Single text input with real-time normalization and validation feedback.

**Usage:**
```tsx
// In a regular form
<IPInput
  value={ipValue}
  onChange={setIpValue}
  showType
  allowCIDR={false}
/>

// Inside RHFFormField
<RHFFormField
  name="serverIp"
  label="Server IP"
  renderInput={({ field }) => (
    <IPInput
      value={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      version="v4"
    />
  )}
/>
```

---

### SubnetInput

**Files:**
- `libs/ui/patterns/src/network-inputs/subnet-input/subnet-input.types.ts`
- `libs/ui/patterns/src/network-inputs/subnet-input/use-subnet-input.ts`
- `libs/ui/patterns/src/network-inputs/subnet-input/subnet-input.tsx`
- `libs/ui/patterns/src/network-inputs/subnet-input/subnet-input-desktop.tsx`
- `libs/ui/patterns/src/network-inputs/subnet-input/subnet-input-mobile.tsx`

**Component Props:**
```tsx
export interface SubnetInputProps {
  value?: string;             // Full CIDR: '192.168.1.0/24'
  onChange?: (value: string) => void;
  showCalculations?: boolean; // Show host count, network addr, broadcast
  checkOverlap?: (cidr: string) => OverlapResult | null;
  disabled?: boolean;
  error?: string;
  label?: string;
  helpText?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
  name?: string;
  className?: string;
  onBlur?: () => void;
}
```

**Headless Hook Return:**
```tsx
interface UseSubnetInputReturn {
  value: string;             // Full CIDR (e.g., '192.168.1.0/24')
  ipPart: string;            // IP address portion
  prefixPart: number;        // Prefix length (0-32)
  isValid: boolean;
  error: string | null;
  networkInfo: SubnetInfo | null; // Calculated subnet info
  overlap: OverlapResult | null;  // Conflict detection result
  setIP: (ip: string) => void;
  setPrefix: (prefix: number) => void;
  setValue: (cidr: string) => void;
  clear: () => void;
  prefixOptions: PrefixOption[]; // Common prefixes for dropdown
}
```

The `SubnetInfo` structure returned in `networkInfo`:
```tsx
interface SubnetInfo {
  network: string;       // e.g., '192.168.1.0'
  firstHost: string | null;
  lastHost: string | null;
  broadcast: string;
  hostCount: number;
  prefix: number;
  mask: string;          // e.g., '255.255.255.0'
}
```

Pass a `checkOverlap` callback to enable real-time conflict detection against existing subnets:
```tsx
<SubnetInput
  value={subnet}
  onChange={setSubnet}
  showCalculations
  checkOverlap={(cidr) => detectConflictWith(existingSubnets, cidr)}
/>
```

**Desktop vs Mobile:**
- Desktop: IP input with prefix dropdown showing mask and host count. Collapsible calculations panel below.
- Mobile: Stacked layout, prefix shown as a numeric spinner. Calculations hidden behind a toggle.

---

### MACInput

**Files:**
- `libs/ui/patterns/src/network-inputs/mac-input/mac-input.types.ts`
- `libs/ui/patterns/src/network-inputs/mac-input/use-mac-input.ts`
- `libs/ui/patterns/src/network-inputs/mac-input/mac-input.tsx`
- `libs/ui/patterns/src/network-inputs/mac-input/mac-input-desktop.tsx`
- `libs/ui/patterns/src/network-inputs/mac-input/mac-input-mobile.tsx`

**Component Props:**
```tsx
export interface MACInputProps {
  value?: string;
  onChange?: (value: string) => void;
  /** Output format: 'colon' (AA:BB:CC:DD:EE:FF), 'dash' (AA-BB-CC-DD-EE-FF), 'dot' (AABB.CCDD.EEFF) */
  format?: 'colon' | 'dash' | 'dot'; // default: 'colon'
  /** Show vendor name from OUI prefix lookup */
  showVendor?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  name?: string;
  required?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  id?: string;
  'aria-describedby'?: string;
}
```

**Headless Hook Return:**
```tsx
interface UseMACInputReturn {
  value: string;         // Normalized MAC (in chosen format)
  isValid: boolean;
  error: string | null;
  vendor: string | null; // OUI vendor name when showVendor is true
  handleChange: (input: string) => void;
  setValue: (value: string) => void;
}
```

**Validation rules:**
- Accepts colon, dash, and dotted formats as input and normalizes to the configured output format.
- Valid MAC: 6 hex octets, each 0–FF.

**Desktop vs Mobile:**
- Desktop: Segmented hex octets separated by the chosen delimiter, vendor badge in corner.
- Mobile: Single normalized input with live vendor badge displayed below.

---

### PortInput

**Files:**
- `libs/ui/patterns/src/network-inputs/port-input/port-input.types.ts`
- `libs/ui/patterns/src/network-inputs/port-input/use-port-input.ts`
- `libs/ui/patterns/src/network-inputs/port-input/port-input.tsx`
- `libs/ui/patterns/src/network-inputs/port-input/port-input-desktop.tsx`
- `libs/ui/patterns/src/network-inputs/port-input/port-input-mobile.tsx`

**Component Props:**
```tsx
export interface PortInputProps {
  value?: number | string;
  onChange?: (value: number | string | null) => void;
  /** 'single' (default), 'range' (start-end), 'multi' (comma-separated) */
  mode?: 'single' | 'range' | 'multi';
  protocol?: 'tcp' | 'udp' | 'both';
  /** Show well-known service name for the port */
  showService?: boolean;
  /** Show autocomplete dropdown with common ports */
  showSuggestions?: boolean;
  serviceGroups?: ServiceGroup[];
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  helpText?: string;
  min?: number;    // default: 1
  max?: number;    // default: 65535
  className?: string;
  name?: string;
  required?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  id?: string;
  'aria-describedby'?: string;
}
```

**Headless Hook Return (abbreviated):**
```tsx
interface UsePortInputReturn {
  port: number | null;             // Parsed single port
  portRange: PortRange | null;     // { start, end } in range mode
  ports: number[];                 // Array in multi mode
  inputValue: string;
  rangeStartValue: string;
  rangeEndValue: string;
  displayValue: string;
  portCount: number;
  isValid: boolean;
  error: string | null;
  serviceName: string | null;      // Well-known service name
  protocol: 'tcp' | 'udp' | 'both';
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRangeStartChange: (value: string) => void;
  handleRangeEndChange: (value: string) => void;
  handleAddPort: (port: number) => void;
  handleRemovePort: (port: number) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  clear: () => void;
  handleBlur: () => void;
  handleFocus: () => void;
  suggestions: PortSuggestion[];
  showSuggestionsDropdown: boolean;
  selectedSuggestionIndex: number;
  handleSelectSuggestion: (port: number) => void;
  handleSelectServiceGroup: (group: ServiceGroup) => void;
  setShowSuggestionsDropdown: (show: boolean) => void;
  navigateSuggestion: (direction: 'up' | 'down') => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  rangeStartRef: React.RefObject<HTMLInputElement | null>;
  rangeEndRef: React.RefObject<HTMLInputElement | null>;
  suggestionsRef: React.RefObject<HTMLDivElement | null>;
}
```

**Suggestion categories:** `web`, `secure`, `database`, `messaging`, `mail`, `network`, `system`, `containers`, `mikrotik`, `recent`, `group`.

**Desktop vs Mobile:**
- Desktop: Full autocomplete dropdown with categorized suggestions, range shown as two adjacent fields.
- Mobile: Simplified input with a bottom sheet for suggestion browsing; range mode uses a spinner pair.

---

### InterfaceSelector

**Files:**
- `libs/ui/patterns/src/network-inputs/interface-selector/interface-selector.types.ts`
- `libs/ui/patterns/src/network-inputs/interface-selector/use-interface-selector.ts`
- `libs/ui/patterns/src/network-inputs/interface-selector/interface-selector.tsx`
- `libs/ui/patterns/src/network-inputs/interface-selector/interface-selector-desktop.tsx`
- `libs/ui/patterns/src/network-inputs/interface-selector/interface-selector-mobile.tsx`

**Component Props:**
```tsx
export interface InterfaceSelectorProps {
  routerId: string;
  value?: string | string[];    // Single ID or array for multi-select
  onChange?: (value: string | string[]) => void;
  multiple?: boolean;
  /** Restrict to specific interface types */
  types?: ('ethernet' | 'bridge' | 'vlan' | 'wireless' | 'vpn' | 'tunnel' | 'loopback')[];
  showStatus?: boolean;         // default: true
  showIP?: boolean;             // default: true
  excludeUsed?: boolean;        // Hide interfaces already in use
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  label?: string;
  className?: string;
  id?: string;
  'aria-describedby'?: string;
}
```

**Headless Hook Return:**
```tsx
interface UseInterfaceSelectorReturn {
  interfaces: RouterInterface[];
  filteredInterfaces: RouterInterface[];
  selectedValues: string[];
  isLoading: boolean;
  error: Error | null;
  searchQuery: string;
  typeFilter: InterfaceType | 'all';
  isOpen: boolean;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (type: InterfaceType | 'all') => void;
  setIsOpen: (open: boolean) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  getInterfaceById: (id: string) => RouterInterface | undefined;
  getDisplayValue: () => string;
  retry: () => void;
}
```

**Desktop vs Mobile:**
- Desktop: Searchable combobox dropdown with type-filter tabs and status indicators.
- Mobile: Full-screen bottom sheet with search, type filter pills, and item list.

```tsx
// Single interface selection
<InterfaceSelector
  routerId={routerId}
  value={selectedInterface}
  onChange={setSelectedInterface}
  types={['ethernet', 'bridge']}
  showStatus
/>

// Multi-select
<InterfaceSelector
  routerId={routerId}
  value={selectedInterfaces}
  onChange={setSelectedInterfaces}
  multiple
  excludeUsed
/>
```

---

## Firewall Rule Editors

All rule editors follow the same pattern: a platform-aware wrapper rendering a Desktop or Mobile presenter, backed by a headless hook. They open as dialog sheets over the current page.

### FilterRuleEditor

**File:** `libs/ui/patterns/src/filter-rule-editor/FilterRuleEditor.tsx`

**Import:**
```tsx
import { FilterRuleEditor, type FilterRuleEditorProps } from '@nasnet/ui/patterns';
```

**Props:**
```tsx
export interface FilterRuleEditorProps {
  routerId: string;
  initialRule?: Partial<FilterRule>;
  open: boolean;
  onClose: () => void;
  onSave: (rule: FilterRuleInput) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
  mode?: 'create' | 'edit';  // default: 'create'
  showChainDiagram?: boolean;
  addressLists?: string[];
  interfaceLists?: string[];
}
```

Key fields: chain (forward/input/output), action (accept/drop/reject/log), protocol, source/destination IP, source/destination port, in/out interface, connection state, comment. When `showChainDiagram` is true, the chain selector includes a visual packet-flow diagram.

```tsx
<FilterRuleEditor
  routerId={routerId}
  open={isEditorOpen}
  onClose={() => setEditorOpen(false)}
  onSave={handleSaveFilterRule}
  mode="create"
  showChainDiagram
  addressLists={addressListNames}
/>
```

---

### MangleRuleEditor

**File:** `libs/ui/patterns/src/mangle-rule-editor/MangleRuleEditor.tsx`

**Import:**
```tsx
import { MangleRuleEditor, type MangleRuleEditorProps } from '@nasnet/ui/patterns';
```

**Props:**
```tsx
export interface MangleRuleEditorProps {
  routerId: string;
  initialRule?: Partial<MangleRule>;
  open: boolean;
  onClose: () => void;
  onSave: (rule: MangleRuleInput) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
  mode?: 'create' | 'edit';
  showChainDiagram?: boolean;
  addressLists?: string[];
  interfaceLists?: string[];
}
```

Key fields shared with FilterRuleEditor plus: action (mark-connection, mark-packet, mark-routing), new-connection-mark, new-packet-mark, new-routing-mark, DSCP value (with a `DscpSelectorProps`-driven UI showing common use cases).

---

### RawRuleEditor

**File:** `libs/ui/patterns/src/raw-rule-editor/RawRuleEditor.tsx`

**Import:**
```tsx
import { RawRuleEditor, type RawRuleEditorProps } from '@nasnet/ui/patterns';
```

**Props:**
```tsx
export interface RawRuleEditorProps {
  routerId: string;
  initialRule?: Partial<RawRule>;
  open: boolean;
  onClose: () => void;
  onSave: (rule: RawRuleInput) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
  mode?: 'create' | 'edit';
  /** Show performance optimization tips */
  showPerformanceTips?: boolean;
  addressLists?: string[];
  interfaceLists?: string[];
}
```

Used for rules in the RAW table (pre-routing/output chains that bypass connection tracking). Chains are limited to `prerouting` and `output`. When `showPerformanceTips` is true, inline tips explain the connection-tracking bypass benefit.

---

### RateLimitRuleEditor

**File:** `libs/ui/patterns/src/rate-limit-rule-editor/RateLimitRuleEditor.tsx`

**Import:**
```tsx
import { RateLimitRuleEditor, type RateLimitRuleEditorProps } from '@nasnet/ui/patterns';
```

**Props:**
```tsx
export interface RateLimitRuleEditorProps {
  routerId: string;
  initialRule?: Partial<RateLimitRule>;
  open: boolean;
  onClose: () => void;
  onSave: (rule: RateLimitRuleInput) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
  mode?: 'create' | 'edit';
  addressLists?: string[];
}
```

Key fields: target address list, max rate (with unit selector: bps/kbps/Mbps), burst limit, burst threshold, burst time, comment. No chain diagram (rate limiting is address-list based, not chain-based).

---

## Schedule Editor

**File:** `libs/ui/patterns/src/schedule-editor/ScheduleEditor.tsx`

**Import:**
```tsx
import { ScheduleEditor, type ScheduleEditorProps } from '@nasnet/ui/patterns';
```

**Props:**
```tsx
export interface ScheduleEditorProps {
  routingID: string;
  initialSchedule?: Partial<ScheduleInput>;
  open: boolean;
  onClose: () => void;
  onSave: (schedule: ScheduleInput) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
  mode?: 'create' | 'edit';
  defaultTimezone?: string; // defaults to browser timezone
}
```

Backed by `useScheduleEditor` hook which integrates RHF + Zod validation. Supports cron expressions, recurring schedules (daily/weekly/monthly), one-time schedules, and timezone selection. The Desktop presenter shows a cron preview and a visual time-picker; the Mobile presenter uses a segmented picker with a bottom sheet for timezone.

```tsx
<ScheduleEditor
  routingID={routingId}
  open={isOpen}
  onClose={() => setOpen(false)}
  onSave={handleSaveSchedule}
  defaultTimezone="America/New_York"
/>
```

---

## Port Knock Sequence Form

**Files:**
- `libs/ui/patterns/src/port-knock-sequence-form/PortKnockSequenceForm.tsx`
- `libs/ui/patterns/src/port-knock-sequence-form/use-port-knock-sequence-form.ts`
- `libs/ui/patterns/src/port-knock-sequence-form/PortKnockSequenceFormDesktop.tsx`
- `libs/ui/patterns/src/port-knock-sequence-form/PortKnockSequenceFormMobile.tsx`

**Import:**
```tsx
import {
  PortKnockSequenceForm,
  type PortKnockSequenceFormProps,
  usePortKnockSequenceForm,
  type UsePortKnockSequenceFormReturn,
} from '@nasnet/ui/patterns';
```

**Component Props:**
```tsx
export interface PortKnockSequenceFormProps {
  formState: UsePortKnockSequenceFormReturn;
  isEditMode?: boolean;    // default: false
  isSubmitting?: boolean;  // default: false
  className?: string;
}
```

**Hook Return:**
```tsx
export interface UsePortKnockSequenceFormReturn {
  form: ReturnType<typeof useForm<PortKnockSequenceInput>>;
  knockPorts: KnockPort[];
  addKnockPort: () => void;
  removeKnockPort: (index: number) => void;
  reorderKnockPorts: (fromIndex: number, toIndex: number) => void;
  preview: RulePreview[];    // Generated firewall rule preview
  isLockoutRisk: boolean;    // True when sequence protects port 22 (SSH)
  onSubmit: (data: PortKnockSequenceInput) => void | Promise<void>;
}
```

The headless hook integrates RHF with `PortKnockSequenceSchema` from `@nasnet/core/types`. It detects SSH lockout risk when port 22 is included in the knock sequence and shows a warning in both presenters.

**Desktop vs Mobile:**
- Desktop: Two-column layout. Left: drag-and-drop sortable port list. Right: live firewall rule preview.
- Mobile: Card-based list with long-press reordering (no drag-and-drop). Preview behind a toggle.

```tsx
function PortKnockingPage({ routerId }: { routerId: string }) {
  const formState = usePortKnockSequenceForm({
    onSubmit: async (data) => {
      await savePortKnockSequence(routerId, data);
    },
  });

  return (
    <form onSubmit={formState.form.handleSubmit(formState.onSubmit)}>
      <PortKnockSequenceForm formState={formState} />
    </form>
  );
}
```

---

## FileUploadZone

**File:** `libs/ui/patterns/src/file-upload-zone/FileUploadZone.tsx`

**Import:**
```tsx
import { FileUploadZone, type FileUploadZoneProps } from '@nasnet/ui/patterns';
```

**Props:**
```tsx
export interface FileUploadZoneProps {
  /** Accepted file extensions (e.g., ['.conf', '.json', '.rsc']) */
  accept?: string[];
  /** Called with the selected/dropped File object */
  onFile: (file: File) => void;
  isLoading?: boolean;
  error?: string;
  maxSize?: number;   // bytes, default: 10MB (10 * 1024 * 1024)
  className?: string;
  disabled?: boolean;
}
```

Provides both drag-and-drop and click-to-browse file upload. Validates file type (against `accept` extension list) and file size (against `maxSize`) before calling `onFile`. Invalid files are silently rejected — show a validation message in the parent if needed.

States: default, drag-over (border highlights with primary color), loading (spinner), error (red border and error text).

```tsx
<FileUploadZone
  accept={['.rsc', '.conf', '.backup']}
  maxSize={5 * 1024 * 1024}  // 5MB
  onFile={async (file) => {
    const text = await file.text();
    parseConfig(text);
  }}
  isLoading={isUploading}
  error={uploadError}
/>
```

---

## Stepper System

The stepper system is a complete headless + presenter architecture for multi-step wizards. All pieces are exported from `@nasnet/ui/patterns`.

### Overview of pieces

| Export | Role |
|--------|------|
| `useStepper` | Core headless hook — all state and navigation |
| `useStepperKeyboard` | Keyboard navigation side-effect hook |
| `StepperProvider` / `useStepperContext` | Context for sharing stepper state without prop drilling |
| `getStepperAriaProps` / `getStepAriaProps` / `getStepPanelAriaProps` | ARIA attribute generators |
| `getStepAccessibleLabel` / `getStepChangeAnnouncement` | Screen reader text helpers |
| `VStepper` | Vertical sidebar layout (desktop) |
| `HStepper` | Horizontal header layout (tablet) |
| `CStepper` | Three-column content wizard (desktop with live preview) |
| `MiniStepper` | Mobile bottom-navigation layout |

---

### useStepper

**File:** `libs/ui/patterns/src/stepper/hooks/use-stepper.ts`

**Import:**
```tsx
import {
  useStepper,
  type StepConfig,
  type StepperConfig,
  type UseStepperReturn,
  type StepStatus,
  type StepErrors,
} from '@nasnet/ui/patterns';
```

**Configuration:**
```tsx
interface StepConfig {
  id: string;
  title: string;
  description?: string;
  validate?: (data: unknown) => Promise<ValidationResult>; // { valid: boolean; errors?: Record<string, string> }
  canSkip?: boolean;
  icon?: string;     // icon name for presenters
  metadata?: Record<string, unknown>;
}

interface StepperConfig {
  steps: StepConfig[];
  onComplete?: (stepData: Map<string, unknown>) => void | Promise<void>;
  onStepChange?: (fromIndex: number, toIndex: number) => void;
  validateOnChange?: boolean; // default: true
  initialStep?: number;       // default: 0
  initialStepData?: Map<string, unknown>;
  freeNavigation?: boolean;   // default: false — allow jumping to any step
}
```

**Return value:**
```tsx
interface UseStepperReturn {
  // Current state
  currentStep: StepConfig;
  currentIndex: number;
  steps: StepConfig[];
  completedSteps: Set<string>;
  skippedSteps: Set<string>;
  stepStates: Map<string, StepState>;

  // Navigation
  next: () => Promise<boolean>;   // validates then advances
  prev: () => void;               // goes back without validating
  goTo: (index: number) => Promise<boolean>;
  skip: () => boolean;            // only works if step.canSkip is true

  // Status flags
  isFirst: boolean;
  isLast: boolean;
  canProceed: boolean;
  isValidating: boolean;
  isCompleted: boolean;

  // Validation
  errors: StepErrors;             // errors for current step
  stepsWithErrors: string[];
  setStepErrors: (stepId: string, errors: StepErrors) => void;
  clearErrors: () => void;
  validate: () => Promise<boolean>;

  // Step data
  getStepData: <T = unknown>(stepId: string) => T | undefined;
  setStepData: (data: unknown) => void;
  getAllStepData: () => Map<string, unknown>;

  // Progress
  progress: number;      // 0-100
  completedCount: number;
  totalSteps: number;

  // Utilities
  canAccessStep: (index: number) => boolean;
  isStepCompleted: (stepId: string) => boolean;
  getStepStatus: (stepId: string) => StepStatus; // 'pending' | 'active' | 'completed' | 'error' | 'skipped'
  reset: () => void;
}
```

---

### useStepperKeyboard

**File:** `libs/ui/patterns/src/stepper/hooks/use-stepper-keyboard.ts`

**Import:**
```tsx
import { useStepperKeyboard, getStepperKeyboardHints } from '@nasnet/ui/patterns';
```

**Signature:**
```tsx
function useStepperKeyboard(
  stepper: UseStepperReturn,
  options?: {
    enabled?: boolean;
    containerRef?: React.RefObject<HTMLElement>;
  }
): void
```

Attaches keydown event listeners. Bindings:
- `ArrowLeft` / `ArrowUp` — previous step
- `ArrowRight` / `ArrowDown` — next step (if accessible)
- `Enter` — call `stepper.next()` (validates)
- `Home` — go to first step
- `End` — go to last accessible step
- `1`–`9` — jump to step by number
- `Escape` — clear current step errors

When `containerRef` is provided, events are scoped to that element; otherwise they are bound to `document`. Input fields within the container are not intercepted.

---

### Stepper Context

**File:** `libs/ui/patterns/src/stepper/stepper-context.tsx`

**Import:**
```tsx
import {
  StepperProvider,
  useStepperContext,
  useOptionalStepperContext,
} from '@nasnet/ui/patterns';
```

```tsx
// Wrap your stepper UI in StepperProvider
const stepper = useStepper(config);

<StepperProvider stepper={stepper}>
  <StepList />
  <StepContent />
  <StepNavigation />
</StepperProvider>

// Read stepper from context in any child
function StepNavigation() {
  const stepper = useStepperContext(); // throws if not in provider
  return (
    <div>
      <Button onClick={stepper.prev} disabled={stepper.isFirst}>Back</Button>
      <Button onClick={() => stepper.next()} disabled={stepper.isValidating}>
        {stepper.isLast ? 'Finish' : 'Next'}
      </Button>
    </div>
  );
}
```

`useOptionalStepperContext()` returns `null` instead of throwing when used outside a provider — useful for components that can be used inside or outside a wizard.

---

### ARIA Helpers

**File:** `libs/ui/patterns/src/stepper/hooks/use-stepper-aria.ts`

```tsx
import {
  getStepperAriaProps,
  getStepAriaProps,
  getStepPanelAriaProps,
  getStepAccessibleLabel,
  getStepChangeAnnouncement,
  getNavigationButtonAriaProps,
} from '@nasnet/ui/patterns';

// Container (tablist role)
const listProps = getStepperAriaProps(stepper, {
  id: 'setup-wizard',
  orientation: 'vertical',
  label: 'Setup steps',
});
// Returns: { role: 'tablist', 'aria-label': 'Setup steps', 'aria-orientation': 'vertical' }

// Individual step tab
const stepProps = getStepAriaProps(stepper, index, { stepperId: 'setup-wizard' });
// Returns: { role: 'tab', id: '...', 'aria-selected': boolean, ... }

// Step content panel
const panelProps = getStepPanelAriaProps(stepper, index, { stepperId: 'setup-wizard' });
// Returns: { role: 'tabpanel', id: '...', 'aria-labelledby': '...', tabIndex: ... }

// Screen reader label: "Step 2 of 3: LAN Setup, current step"
const label = getStepAccessibleLabel(stepper, index);

// Live region text: "Now on step 2 of 3: LAN Setup"
const announcement = getStepChangeAnnouncement(stepper);
```

---

### Layout Variants

#### VStepper (Vertical — Desktop Sidebar)

**File:** `libs/ui/patterns/src/stepper/components/v-stepper/`

**Props:**
```tsx
interface VStepperProps {
  stepper: UseStepperReturn;
  className?: string;
  width?: string | number;       // default: '256px'
  showDescriptions?: boolean;    // default: true
  showErrorCount?: boolean;      // default: false
  'aria-label'?: string;
}
```

Vertical step list with connector lines between items. Each item shows step number/icon, title, description, and status indicator. Clickable for completed steps. Used as the left panel of `CStepper`.

#### HStepper (Horizontal — Tablet Header)

**File:** `libs/ui/patterns/src/stepper/components/h-stepper/`

**Props:**
```tsx
interface HStepperProps {
  stepper: UseStepperReturn;
  className?: string;
  showTitles?: boolean;    // default: true
  useIcons?: boolean;      // default: true
  sticky?: boolean;        // default: true
  stickyOffset?: string;   // default: '0'
  allowSkipSteps?: boolean;
  onMenuClick?: () => void;
  showBackButton?: boolean; // default: true
  'aria-label'?: string;
}
```

Horizontal step indicator row. Steps shown as numbered circles connected by a progress bar. Collapses step titles on narrow viewports. Supports sticky positioning for wizard headers.

#### CStepper (Content — Desktop Three-Column)

**File:** `libs/ui/patterns/src/stepper/components/c-stepper/`

**Props:**
```tsx
interface CStepperProps {
  stepper: UseStepperReturn;
  stepContent: React.ReactNode;    // Form fields for current step
  previewContent?: React.ReactNode; // Live config preview (right panel)
  className?: string;
  previewTitle?: string;           // default: 'Preview'
  defaultShowPreview?: boolean;    // default: true (auto-collapses below 1280px)
  'aria-label'?: string;
  onPreviewToggle?: (visible: boolean) => void;
  sidebarWidth?: string | number;  // default: 280px
  previewWidth?: string | number;  // default: 320px
  showStepDescriptions?: boolean;  // default: true
  customNavigation?: React.ReactNode;
  navigationLabels?: {
    previous?: string;
    next?: string;
    complete?: string;
  };
}
```

Three-column layout: left sidebar (VStepper, 280px) + center content area (flexible) + right preview panel (320px, collapsible with Alt+P shortcut).

`CStepperPreview` is exported as a standalone panel for custom embedding:
```tsx
interface CStepperPreviewProps {
  children: React.ReactNode;
  title?: string;    // default: 'Preview'
  onClose: () => void;
  className?: string;
  width?: string | number;
}
```

#### MiniStepper (Mobile)

**File:** `libs/ui/patterns/src/stepper/components/mini-stepper/`

**Props:**
```tsx
interface MiniStepperProps {
  stepper: UseStepperReturn;
  stepContent: React.ReactNode;
  className?: string;
  onStepChange?: (step: StepConfig, index: number) => void;
  disableSwipe?: boolean;  // default: false
  'aria-label'?: string;
}
```

Mobile-optimized layout: top progress bar + current step title, full-width content area, fixed bottom bar with Back/Next buttons (44px height for touch targets). Supports swipe gestures to navigate (disable for forms with text inputs via `disableSwipe`).

---

### Complete Stepper Example

```tsx
import {
  useStepper,
  useStepperKeyboard,
  StepperProvider,
  CStepper,
  MiniStepper,
  type StepConfig,
} from '@nasnet/ui/patterns';
import { useRef } from 'react';

// Step validation with Zod
async function validateWAN(data: unknown) {
  const result = wanSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.errors.forEach((e) => {
      errors[e.path.join('.')] = e.message;
    });
    return { valid: false, errors };
  }
  return { valid: true };
}

const steps: StepConfig[] = [
  {
    id: 'wan',
    title: 'WAN Configuration',
    description: 'Set up your internet connection',
    icon: 'globe',
    validate: validateWAN,
  },
  {
    id: 'lan',
    title: 'LAN Setup',
    description: 'Configure local network',
    icon: 'network',
  },
  {
    id: 'dns',
    title: 'DNS Settings',
    description: 'Configure name resolution',
    icon: 'search',
    canSkip: true,
  },
  {
    id: 'review',
    title: 'Review & Apply',
    description: 'Review your configuration',
    icon: 'check',
  },
];

function SetupWizard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 640px)');

  const stepper = useStepper({
    steps,
    validateOnChange: true,
    onComplete: async (allData) => {
      const config = Object.fromEntries(allData);
      await applyConfiguration(config);
    },
    onStepChange: (from, to) => {
      analytics.track('wizard_step', { from, to });
    },
  });

  useStepperKeyboard(stepper, { containerRef });

  const stepContent = (
    <div>
      {stepper.currentStep.id === 'wan' && <WANForm stepper={stepper} />}
      {stepper.currentStep.id === 'lan' && <LANForm stepper={stepper} />}
      {stepper.currentStep.id === 'dns' && <DNSForm stepper={stepper} />}
      {stepper.currentStep.id === 'review' && <ReviewStep stepper={stepper} />}
    </div>
  );

  return (
    <StepperProvider stepper={stepper}>
      <div ref={containerRef} tabIndex={-1}>
        {isMobile ? (
          <MiniStepper stepper={stepper} stepContent={stepContent} />
        ) : (
          <CStepper
            stepper={stepper}
            stepContent={stepContent}
            previewContent={<ConfigPreview stepper={stepper} />}
            previewTitle="RouterOS Script"
            navigationLabels={{ complete: 'Apply Configuration' }}
          />
        )}
      </div>
    </StepperProvider>
  );
}

// Step component reading data via context
function WANForm({ stepper }: { stepper: UseStepperReturn }) {
  const form = useForm({ resolver: zodResolver(wanSchema) });

  // Save form data into stepper on change
  useEffect(() => {
    const sub = form.watch((values) => stepper.setStepData(values));
    return () => sub.unsubscribe();
  }, [form, stepper]);

  return (
    <FormProvider {...form}>
      <RHFFormField name="type" label="Connection Type" required />
      {stepper.errors['type'] && (
        <FormFieldError message={stepper.errors['type']} />
      )}
    </FormProvider>
  );
}
```

---

## ValidationProgress

**Files:**
- `libs/ui/patterns/src/validation-progress/ValidationProgress.tsx`
- `libs/ui/patterns/src/validation-progress/ValidationStage.tsx`
- `libs/ui/patterns/src/validation-progress/types.ts`

**Import:**
```tsx
import {
  ValidationProgress,
  ValidationStage,
  useValidationProgress,
  type ValidationProgressProps,
  type ValidationStageName,
  type ValidationStageStatus,
  type ValidationStageResult,
  type ValidationError,
  type ValidationWarning,
  type ValidationResult,
} from '@nasnet/ui/patterns';
```

### Types

```tsx
// The 7 stages in order
type ValidationStageName =
  | 'schema'          // 1. JSON schema / type validation
  | 'syntax'          // 2. RouterOS syntax checks
  | 'cross-resource'  // 3. Reference integrity across resources
  | 'dependencies'    // 4. Dependency ordering and cycles
  | 'network'         // 5. IP conflicts and subnet overlaps
  | 'platform'        // 6. RouterOS version capability checks
  | 'dry-run';        // 7. Simulated apply on test target

type ValidationStageStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

interface ValidationError {
  code: string;
  message: string;
  fieldPath?: string;       // e.g., 'interfaces.0.address'
  resourceUuid?: string;    // UUID of conflicting resource
  suggestedFix?: string;
}

interface ValidationWarning {
  code: string;
  message: string;
  fieldPath?: string;
}

interface ValidationStageResult {
  stage: ValidationStageName;
  status: ValidationStageStatus;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  durationMs?: number;
}
```

### ValidationProgress Component

**Props:**
```tsx
export interface ValidationProgressProps {
  stages?: ValidationStageResult[];
  /** Stages to show (defaults to all 7 in order) */
  visibleStages?: ValidationStageName[];
  /** Index of currently running stage (0-based) */
  currentStage?: number;
  isComplete?: boolean;
  isValid?: boolean;
  totalDurationMs?: number;
  /** Auto-expand failed stages on completion (default: true) */
  autoExpandFailed?: boolean;
  className?: string;
  compact?: boolean;
}
```

The component:
- Renders a header with animated status (spinning loader while running, check/X when complete).
- Shows an animated progress bar tracking stages passed / total.
- Lists all 7 stages with status icons; each stage row is clickable to expand error/warning details.
- Auto-expands failed stages when `autoExpandFailed` is true.
- Includes a `role="status" aria-live="polite"` region for screen reader announcements.
- Uses semantic tokens: `text-success` / `bg-error-light` / `border-error/20` — no hardcoded colors.

### useValidationProgress Hook

Returns state and imperatively-driven update functions:

```tsx
const {
  stages,
  currentStageIndex,
  isComplete,
  isValid,
  totalDurationMs,
  reset,
  startStage,    // marks a stage as 'running' and increments index
  completeStage, // sets final result for a stage
  finish,        // marks pipeline complete with pass/fail
} = useValidationProgress();
```

### Usage in Apply-Confirm-Merge Flow

```tsx
function ApplyConfigDialog({ onConfirm }: { onConfirm: () => void }) {
  const {
    stages, currentStageIndex, isComplete, isValid, totalDurationMs,
    reset, startStage, completeStage, finish,
  } = useValidationProgress();
  const [isRunning, setIsRunning] = useState(false);

  async function runValidation() {
    reset();
    setIsRunning(true);
    const start = Date.now();

    const pipeline: ValidationStageName[] = [
      'schema', 'syntax', 'cross-resource', 'dependencies', 'network', 'platform', 'dry-run',
    ];

    for (const stageName of pipeline) {
      startStage(stageName);
      try {
        const result = await validateStage(stageName, pendingChangeset);
        completeStage({
          stage: stageName,
          status: result.passed ? 'passed' : 'failed',
          errors: result.errors ?? [],
          warnings: result.warnings ?? [],
          durationMs: result.durationMs,
        });
        if (!result.passed) {
          finish(false, Date.now() - start);
          setIsRunning(false);
          return;
        }
      } catch (err) {
        completeStage({
          stage: stageName,
          status: 'failed',
          errors: [{ code: 'UNEXPECTED', message: String(err) }],
          warnings: [],
        });
        finish(false, Date.now() - start);
        setIsRunning(false);
        return;
      }
    }

    finish(true, Date.now() - start);
    setIsRunning(false);
  }

  return (
    <Dialog open>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Validate & Apply Configuration</DialogTitle>
        </DialogHeader>

        <ValidationProgress
          stages={stages}
          currentStage={currentStageIndex}
          isComplete={isComplete}
          isValid={isValid}
          totalDurationMs={totalDurationMs}
          autoExpandFailed
        />

        <DialogFooter className="gap-2">
          {!isRunning && !isComplete && (
            <Button onClick={runValidation}>Run Validation</Button>
          )}
          {isComplete && isValid && (
            <Button onClick={onConfirm}>Apply Changes</Button>
          )}
          {isComplete && !isValid && (
            <Button variant="outline" onClick={reset}>Fix Errors & Retry</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

See `multi-package-flows.md` for the complete Apply-Confirm-Merge flow that uses this component across the configuration pipeline.
