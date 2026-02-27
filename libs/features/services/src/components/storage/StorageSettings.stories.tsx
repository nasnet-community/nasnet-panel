/**
 * StorageSettings Storybook Stories
 *
 * StorageSettings is a platform-adaptive container that delegates to
 * StorageSettingsDesktop or StorageSettingsMobile based on the viewport.
 * Both presenters are driven entirely by the `useStorageSettings` headless
 * hook which calls live GraphQL queries.
 *
 * Because the hook depends on an Apollo provider and live network calls,
 * these stories use the lightweight StorageUsageBar + StorageDisconnectBanner
 * primitives to showcase each UI state in isolation without mocking the
 * entire Apollo stack.
 *
 * @see NAS-8.20: External Storage Management
 * @see ADR-018: Headless + Platform Presenters Pattern
 */

import * as React from 'react';

import { HardDrive, AlertTriangle, RefreshCw, Info } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';

import { StorageUsageBar } from './StorageUsageBar';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const GB = (n: number) => (n * 1024 * 1024 * 1024).toString();

// ---------------------------------------------------------------------------
// Reusable mock card components
// ---------------------------------------------------------------------------

interface MockConfigCardProps {
  status: 'configured' | 'disconnected' | 'unconfigured';
  hasStorage?: boolean;
  scanning?: boolean;
  configuring?: boolean;
}

function MockConfigCard({
  status,
  hasStorage = true,
  scanning = false,
  configuring = false,
}: MockConfigCardProps) {
  const badgeVariant =
    status === 'disconnected' ? 'error'
    : status === 'configured' ? 'default'
    : 'secondary';

  const badgeLabel =
    status === 'disconnected' ? 'Disconnected'
    : status === 'configured' ? 'Configured'
    : 'Not Configured';

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive
              className="h-5 w-5"
              aria-hidden="true"
            />
            <CardTitle>Storage Configuration</CardTitle>
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Badge variant={badgeVariant as any}>{badgeLabel}</Badge>
        </div>
        <CardDescription>Offload service binaries to USB/disk to save flash memory</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasStorage && (
          <div className="bg-muted flex items-center gap-2 rounded-md p-3">
            <AlertTriangle
              className="text-warning h-5 w-5"
              aria-hidden="true"
            />
            <p className="text-muted-foreground text-sm">
              No external storage detected. Connect a USB drive or disk.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="mock-storage-enabled">Enable External Storage</Label>
            <Info
              className="text-muted-foreground h-4 w-4"
              aria-hidden="true"
            />
          </div>
          <Switch
            id="mock-storage-enabled"
            checked={status === 'configured' || status === 'disconnected'}
            disabled={!hasStorage || configuring}
            aria-label="Enable external storage"
          />
        </div>

        {hasStorage && (
          <div className="space-y-2">
            <Label htmlFor="mock-mount-select">Storage Location</Label>
            <Select
              defaultValue="/mnt/usb1"
              disabled={configuring}
            >
              <SelectTrigger id="mock-mount-select">
                <SelectValue placeholder="Select mount point" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="/mnt/usb1">/mnt/usb1 — 6.2 GB free (vfat)</SelectItem>
                <SelectItem value="/mnt/sda1">/mnt/sda1 — 28.1 GB free (ext4)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          disabled={scanning}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${scanning ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {scanning ? 'Scanning...' : 'Scan for Storage Devices'}
        </Button>
      </CardContent>
    </Card>
  );
}

interface MockUsageCardProps {
  externalPercent?: number;
  flashPercent?: number;
}

function MockUsageCard({ externalPercent = 55, flashPercent = 72 }: MockUsageCardProps) {
  const extTotal = GB(16);
  const extUsed = Math.round(parseInt(extTotal, 10) * (externalPercent / 100)).toString();
  const flashTotal = GB(0.128); // 128 MB flash
  const flashUsed = Math.round(parseInt(flashTotal, 10) * (flashPercent / 100)).toString();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Storage Usage</CardTitle>
        <CardDescription>Current storage consumption across flash and external</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>External Storage (/mnt/usb1)</Label>
          <StorageUsageBar
            usagePercent={externalPercent}
            totalBytes={extTotal}
            usedBytes={extUsed}
          />
        </div>
        <div className="space-y-2">
          <Label>Flash Memory (/flash)</Label>
          <StorageUsageBar
            usagePercent={flashPercent}
            totalBytes={flashTotal}
            usedBytes={flashUsed}
            showWarning={flashPercent >= 80}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

// Use MockConfigCard as the story component since StorageSettings itself
// requires a live Apollo client. The stories below document each UI state.
const meta: Meta<typeof MockConfigCard> = {
  title: 'Features/Services/Storage/StorageSettings',
  component: MockConfigCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
\`StorageSettings\` is the platform-adaptive root component for external storage
configuration. It auto-selects between \`StorageSettingsMobile\` and
\`StorageSettingsDesktop\` based on the active viewport.

**Key UI states covered in these stories:**
| State | Description |
|-------|-------------|
| Not Configured | No USB/disk set up yet |
| Configured | External storage active and healthy |
| Disconnected | Storage was configured but is now missing |
| No Hardware | No external storage detected at all |
| Scanning | Scanning bus for new devices |

The desktop presenter uses a two-column layout (config left / usage right)
with collapsible sections for service breakdown and advanced mount details.
The mobile presenter stacks everything vertically with 44 px touch targets.
        `.trim(),
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MockConfigCard>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * No external storage configured yet — the toggle is off and no path selected.
 */
export const NotConfigured: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <MockConfigCard
        status="unconfigured"
        hasStorage
      />
      <MockUsageCard
        externalPercent={0}
        flashPercent={48}
      />
    </div>
  ),
};

/**
 * External storage is configured and connected — normal operation.
 */
export const ConfiguredAndConnected: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <MockConfigCard
        status="configured"
        hasStorage
      />
      <MockUsageCard
        externalPercent={55}
        flashPercent={30}
      />
    </div>
  ),
};

/**
 * Storage was configured but the device has been physically removed.
 * The banner fires and the badge turns red.
 */
export const Disconnected: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="border-warning bg-warning/10 text-warning-foreground flex items-start gap-3 rounded-lg border p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">External Storage Disconnected</p>
          <p className="mt-1 text-sm">
            Storage at <code className="bg-muted rounded px-1">/mnt/usb1</code> is no longer
            available. Services using external storage may be unavailable.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <MockConfigCard
          status="disconnected"
          hasStorage={false}
        />
        <MockUsageCard
          externalPercent={0}
          flashPercent={78}
        />
      </div>
    </div>
  ),
};

/**
 * No external hardware detected at all — toggle is disabled and a
 * "plug in a USB drive" prompt is shown.
 */
export const NoHardwareDetected: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <MockConfigCard
        status="unconfigured"
        hasStorage={false}
      />
      <MockUsageCard
        externalPercent={0}
        flashPercent={65}
      />
    </div>
  ),
};

/**
 * Device scan in progress — the button shows a spinner and is disabled.
 */
export const Scanning: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <MockConfigCard
        status="unconfigured"
        hasStorage
        scanning
      />
      <MockUsageCard
        externalPercent={0}
        flashPercent={52}
      />
    </div>
  ),
};

/**
 * Flash nearly full (≥80%) while external is healthy — warns in orange.
 */
export const FlashWarning: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <MockConfigCard
        status="configured"
        hasStorage
      />
      <MockUsageCard
        externalPercent={42}
        flashPercent={87}
      />
    </div>
  ),
};
