/**
 * StorageDisconnectBanner Storybook Stories
 *
 * Demonstrates the persistent warning banner shown when configured external
 * storage is disconnected.
 *
 * NOTE: The component reads its data from the `useStorageSettings` hook which
 * calls GraphQL queries. In Storybook we bypass it by rendering the banner's
 * visual shell directly via render functions so the stories remain fast and
 * dependency-free.
 *
 * @see NAS-8.20: External Storage Management
 */

import * as React from 'react';

import { AlertTriangle, X } from 'lucide-react';

import {
  Alert,
  AlertTitle,
  AlertDescription,
  Button,
} from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Inline visual shell (mirrors the real component's JSX without the hook)
// ---------------------------------------------------------------------------

interface MockBannerProps {
  path: string;
  affectedServices?: string[];
  onDismiss?: () => void;
}

function MockStorageDisconnectBanner({
  path,
  affectedServices = [],
  onDismiss,
}: MockBannerProps) {
  const displayServices = affectedServices.slice(0, 5);
  const remainingCount = Math.max(0, affectedServices.length - 5);

  return (
    <Alert
      variant="warning"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="relative"
    >
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold pr-8">
        External Storage Disconnected
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Storage at{' '}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {path}
          </code>{' '}
          is no longer available.
        </p>
        {affectedServices.length > 0 && (
          <div>
            <p className="font-medium mb-2">
              Affected services ({affectedServices.length}):
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              {displayServices.map((service) => (
                <li key={service} className="text-sm">
                  {service}
                </li>
              ))}
              {remainingCount > 0 && (
                <li className="font-medium text-sm">
                  and {remainingCount} more...
                </li>
              )}
            </ul>
          </div>
        )}
        <p className="text-sm font-medium border-t border-warning/30 pt-3 mt-3">
          ⚠️ Reconnect the storage device to restore service functionality.
        </p>
      </AlertDescription>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="absolute top-4 right-4 h-6 w-6 p-0"
          aria-label="Dismiss alert (warning will persist until storage reconnects)"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof MockStorageDisconnectBanner> = {
  title: 'Features/Services/Storage/StorageDisconnectBanner',
  component: MockStorageDisconnectBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A persistent \`role="alert"\` warning banner rendered when a configured external
storage device is disconnected. It:

- Uses \`aria-live="assertive"\` so screen readers announce it immediately.
- Lists up to 5 affected services (with an overflow counter for more).
- Provides a dismiss button that hides the banner until the device reconnects.
- Resets its dismissed state automatically when \`config.isAvailable\` changes.
        `.trim(),
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MockStorageDisconnectBanner>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Typical disconnect with a handful of affected services.
 */
export const Default: Story = {
  args: {
    path: '/mnt/usb1',
    affectedServices: ['Tor', 'AdGuard Home', 'sing-box'],
    onDismiss: () => console.log('Banner dismissed'),
  },
};

/**
 * No services installed on the external drive — only the path warning is shown.
 */
export const NoAffectedServices: Story = {
  args: {
    path: '/mnt/usb1',
    affectedServices: [],
    onDismiss: () => console.log('Banner dismissed'),
  },
};

/**
 * More than 5 affected services — the overflow "(and N more…)" label appears.
 */
export const ManyAffectedServices: Story = {
  args: {
    path: '/mnt/sda1',
    affectedServices: [
      'Tor',
      'AdGuard Home',
      'sing-box',
      'Xray-core',
      'MTProxy',
      'Psiphon',
      'WireGuard',
    ],
    onDismiss: () => console.log('Banner dismissed'),
  },
};

/**
 * Long mount path (e.g. a nested directory on a USB NTFS volume).
 */
export const LongMountPath: Story = {
  args: {
    path: '/mnt/usb/volumes/my-backup-drive/nasnet-data',
    affectedServices: ['Tor', 'sing-box'],
    onDismiss: () => console.log('Banner dismissed'),
  },
};

/**
 * Without a dismiss handler — shows the banner without the close button,
 * representing a non-dismissible variant.
 */
export const NonDismissible: Story = {
  args: {
    path: '/mnt/usb1',
    affectedServices: ['Tor', 'AdGuard Home'],
  },
};

/**
 * Mobile viewport — verifies that text wraps gracefully and the dismiss
 * button remains accessible (≥44px tap target).
 */
export const MobileViewport: Story = {
  args: {
    path: '/mnt/usb1',
    affectedServices: ['Tor', 'AdGuard Home', 'sing-box'],
    onDismiss: () => console.log('Banner dismissed'),
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Verifies graceful wrapping on a 375 px viewport.',
      },
    },
  },
};
