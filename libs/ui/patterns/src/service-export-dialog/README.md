# ServiceExportDialog

Platform-adaptive dialog for exporting service configurations as JSON or QR code.

## Features

- **JSON Export**: Downloadable JSON file with optional secret redaction
- **QR Code Export**: Scannable QR code (256x256 PNG, 2KB limit)
- **Secret Redaction**: Automatically redact passwords, API keys, and sensitive data
- **Routing Rules**: Optionally include device-to-service routing assignments
- **Platform Adaptive**: Optimized for Mobile, Tablet, and Desktop

## Usage

```tsx
import { ServiceExportDialog } from '@nasnet/ui/patterns/service-export-dialog';

function ServiceDetailPage() {
  const { data: instance } = useServiceInstance('router-1', 'instance-123');

  return (
    <ServiceExportDialog
      routerID="router-1"
      instance={instance}
      onExportComplete={(format, downloadURL) => {
        toast.success(`Exported as ${format.toUpperCase()}`);
        if (downloadURL) {
          window.open(downloadURL, '_blank');
        }
      }}
    />
  );
}
```

## Props

| Prop               | Type                      | Required | Description                        |
| ------------------ | ------------------------- | -------- | ---------------------------------- |
| `routerID`         | `string`                  | ✓        | Router ID for the export operation |
| `instance`         | `ServiceInstance`         | ✓        | Service instance to export         |
| `open`             | `boolean`                 |          | Controlled open state              |
| `onOpenChange`     | `(open: boolean) => void` |          | Callback when open state changes   |
| `onExportComplete` | `(format, url?) => void`  |          | Callback when export succeeds      |
| `trigger`          | `React.ReactNode`         |          | Custom trigger button              |

## Export Formats

### JSON Format

- Downloadable `.json` file
- Full service configuration including ports, VLAN, bind IP
- Optional routing rules
- Optional secret redaction
- 15-minute download URL expiry

### QR Code Format

- PNG image (256x256 pixels by default)
- Base64-encoded image data
- 2KB data limit (enforced by backend)
- Ideal for quick mobile-to-mobile sharing
- 15-minute download URL expiry

## Secret Redaction

When enabled, sensitive fields are replaced with `[REDACTED]`:

- Passwords
- API keys
- Private keys
- Auth tokens
- Any field marked as sensitive in the service manifest

Redacted fields require user input during import.

## Platform Presenters

### Mobile (<640px)

- Full-screen Sheet primitive
- 44px minimum touch targets
- Stacked vertical layout
- Bottom sheet with swipe-to-close

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

## Accessibility

- **WCAG AAA**: 7:1 contrast ratio
- **Touch Targets**: 44px minimum (mobile/tablet)
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Auto-focus on mount
- **Screen Readers**: ARIA labels and descriptions
- **Focus Trap**: Locks focus within dialog

## Architecture

Follows the **Headless + Platform Presenters** pattern:

```
useServiceExportDialog.ts   (Headless hook - all business logic)
    ↓
ServiceExportDialog.tsx     (Entry point - platform detection)
    ↓
├── ServiceExportDialogDesktop.tsx   (Desktop presenter)
├── ServiceExportDialogTablet.tsx    (Tablet presenter)
└── ServiceExportDialogMobile.tsx    (Mobile presenter)
```

## Examples

### Basic Usage

```tsx
<ServiceExportDialog
  routerID={routerId}
  instance={instance}
/>
```

### Custom Trigger

```tsx
<ServiceExportDialog
  routerID={routerId}
  instance={instance}
  trigger={
    <Button variant="ghost">
      <Share2 className="mr-2 h-4 w-4" />
      Share Service
    </Button>
  }
/>
```

### Controlled State

```tsx
const [open, setOpen] = useState(false);

<ServiceExportDialog
  routerID={routerId}
  instance={instance}
  open={open}
  onOpenChange={setOpen}
  onExportComplete={(format) => {
    toast.success(`Exported as ${format}`);
    setOpen(false);
  }}
/>;
```

## Related Components

- `ServiceImportDialog`: Import service configurations
- `AddressListExportDialog`: Export firewall address lists
- `AddressListImportDialog`: Import firewall address lists

## Testing

See `ServiceExportDialog.stories.tsx` for interactive examples and testing scenarios.
