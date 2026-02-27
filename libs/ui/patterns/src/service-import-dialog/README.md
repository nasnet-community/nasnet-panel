# ServiceImportDialog

Platform-adaptive dialog for importing service configurations from JSON files or QR codes.

## Features

- **Multi-step Wizard**: select → validate → resolve → importing → complete
- **JSON Import**: Upload or paste JSON configuration files
- **7-Stage Validation**: Schema, syntax, cross-resource, dependency, conflict, capability, dry-run
- **Conflict Resolution**: Skip, rename, or replace conflicting services
- **Secret Handling**: Prompt for redacted sensitive fields
- **Device Filtering**: Optionally filter routing rules by device MAC
- **Platform Adaptive**: Optimized for Mobile, Tablet, and Desktop

## Usage

```tsx
import { ServiceImportDialog } from '@nasnet/ui/patterns/service-import-dialog';

function ServiceManagementPage() {
  return (
    <ServiceImportDialog
      routerID="router-1"
      onImportComplete={(instanceID) => {
        toast.success(`Imported ${instanceID} successfully`);
      }}
    />
  );
}
```

## Props

| Prop               | Type                           | Required | Description                      |
| ------------------ | ------------------------------ | -------- | -------------------------------- |
| `routerID`         | `string`                       | ✓        | Router ID to import into         |
| `open`             | `boolean`                      |          | Controlled open state            |
| `onOpenChange`     | `(open: boolean) => void`      |          | Callback when open state changes |
| `onImportComplete` | `(instanceID: string) => void` |          | Callback when import succeeds    |
| `trigger`          | `React.ReactNode`              |          | Custom trigger button            |

## Import Flow

### Step 1: Select

- Upload JSON file (drag-and-drop or file picker)
- Paste JSON content into textarea
- Client-side validation with Zod

### Step 2: Validate

- Backend validation (dry-run mode)
- 7-stage validation pipeline
- Returns errors, warnings, conflicts, and redacted fields

### Step 3: Resolve

- Display validation errors
- Prompt for redacted field values (passwords, API keys)
- Conflict resolution strategy selection
- Device filter selection (optional)

### Step 4: Importing

- Execute actual import (dry-run=false)
- Progress indicator (0-100%)
- Create service instance on router

### Step 5: Complete

- Success confirmation
- Display created instance name
- Option to import another

## Validation Stages

1. **Schema Validation**: JSON structure matches expected format
2. **Syntax Validation**: Field types and values are correct
3. **Cross-Resource Validation**: References to other resources are valid
4. **Dependency Validation**: Required features and dependencies exist
5. **Conflict Detection**: Check for port/name/VLAN conflicts
6. **Capability Validation**: Router supports required features
7. **Dry-Run Test**: Simulate import without making changes

## Conflict Resolution Strategies

### Skip

- Don't import if conflicts exist
- Safest option (no changes)

### Rename

- Automatically rename conflicting service
- Appends suffix (e.g., "Tor Exit Node (2)")

### Replace

- Delete existing service and import new one
- **Destructive** - requires confirmation

## Secret Redaction

Exported configurations can redact sensitive fields:

- Passwords
- API keys
- Private keys
- Auth tokens

During import, users are prompted to provide values for redacted fields.

## Platform Presenters

### Mobile (<640px)

- Full-screen Sheet primitive
- 44px minimum touch targets
- Stacked vertical layout
- Bottom sheet with swipe-to-close
- Simplified validation error display

### Tablet (640-1024px)

- Dialog primitive with touch-friendly spacing
- 44px minimum touch targets
- Vertical button stacking
- Hybrid mobile/desktop approach

### Desktop (>1024px)

- Standard Dialog primitive
- Dense horizontal layouts
- Keyboard shortcuts (Enter/Escape)
- Mouse-optimized interactions
- Detailed validation error list

## Accessibility

- **WCAG AAA**: 7:1 contrast ratio
- **Touch Targets**: 44px minimum (mobile/tablet)
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Auto-focus on mount, focus trap
- **Screen Readers**: ARIA labels and descriptions
- **Progress Announcements**: Screen reader updates during import

## Architecture

Follows the **Headless + Platform Presenters** pattern:

```
useServiceImportDialog.ts   (Headless hook - all business logic)
    ↓
ServiceImportDialog.tsx     (Entry point - platform detection)
    ↓
├── ServiceImportDialogDesktop.tsx   (Desktop presenter)
├── ServiceImportDialogTablet.tsx    (Tablet presenter)
└── ServiceImportDialogMobile.tsx    (Mobile presenter)
```

## Examples

### Basic Usage

```tsx
<ServiceImportDialog routerID="router-1" />
```

### Custom Trigger

```tsx
<ServiceImportDialog
  routerID="router-1"
  trigger={
    <Button variant="ghost">
      <Upload className="mr-2 h-4 w-4" />
      Import Service
    </Button>
  }
/>
```

### Controlled State

```tsx
const [open, setOpen] = useState(false);

<ServiceImportDialog
  routerID="router-1"
  open={open}
  onOpenChange={setOpen}
  onImportComplete={(instanceID) => {
    toast.success(`Imported ${instanceID}`);
    setOpen(false);
  }}
/>;
```

## Related Components

- `ServiceExportDialog`: Export service configurations
- `AddressListImportDialog`: Import firewall address lists
- `AddressListExportDialog`: Export firewall address lists

## Testing

See `ServiceImportDialog.stories.tsx` for interactive examples and testing scenarios.
