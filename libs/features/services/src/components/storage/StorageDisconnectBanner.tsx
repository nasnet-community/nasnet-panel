/**
 * StorageDisconnectBanner Component
 * @description Persistent alert banner displayed when configured external storage disconnects.
 * Shows affected services and prompts user to reconnect the device.
 *
 * @features
 * - Prominent destructive styling for critical state
 * - Lists affected services with truncation at 5 items
 * - Dismissible with persistent warning until reconnection
 * - ARIA live region for screen reader announcements
 * - Auto-resets when storage reconnects
 *
 * @see NAS-8.20: External Storage Management
 * @see Docs/design/COMPREHENSIVE_COMPONENT_CHECKLIST.md - section 7 (Accessibility)
 */

import * as React from 'react';
import { useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

import {
  Alert,
  AlertTitle,
  AlertDescription,
  Button,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import { useStorageSettings } from './useStorageSettings';

/**
 * StorageDisconnectBanner component props
 */
export interface StorageDisconnectBannerProps {
  /** Optional CSS class name for custom styling */
  className?: string;

  /** Optional callback fired when banner is dismissed by user */
  onDismiss?: () => void;
}

/**
 * StorageDisconnectBanner component
 * @description Shows persistent warning when configured external storage becomes unavailable
 * @param {StorageDisconnectBannerProps} props - Component props
 * @returns {React.ReactNode | null} Rendered alert or null if dismissed/connected
 */
function StorageDisconnectBannerComponent({
  className,
  onDismiss,
}: StorageDisconnectBannerProps) {
  const { config, usage } = useStorageSettings();

  const [dismissed, setDismissed] = React.useState(false);

  /**
   * Compute list of affected services (services using external storage)
   */
  const affectedServices = React.useMemo(() => {
    if (!usage?.features) return [];
    return usage.features
      .filter((feature) => feature.location === 'external')
      .map((feature) => feature.featureName);
  }, [usage?.features]);

  /**
   * Handle user dismissal of banner (warning persists until reconnection)
   */
  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  // Reset dismissed state when storage reconnects
  React.useEffect(() => {
    setDismissed(false);
  }, [config?.isAvailable]);

  // Don't show if dismissed or no external path configured
  if (dismissed || !config?.path) {
    return null;
  }

  const displayServices = affectedServices.slice(0, 5);
  const remainingCount = Math.max(0, affectedServices.length - 5);

  return (
    <Alert
      variant="destructive"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn('relative', className)}
    >
      <AlertTriangle className="h-5 w-5" aria-hidden="true" />

      <AlertTitle className="text-lg font-semibold pr-8 font-display">
        External Storage Disconnected
      </AlertTitle>

      <AlertDescription className="space-y-component-sm">
        <p>
          Storage at{' '}
          <code className="relative rounded-[var(--semantic-radius-button)] bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {config.path}
          </code>{' '}
          is no longer available.
        </p>

        {affectedServices.length > 0 && (
          <div>
            <p className="font-medium mb-component-sm">
              Affected services ({affectedServices.length}):
            </p>
            <ul className="list-disc list-inside space-y-component-sm pl-2">
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

        <p className="text-sm font-medium border-t border-error/30 pt-component-sm mt-component-sm">
          Reconnect the storage device to restore service functionality.
        </p>
      </AlertDescription>

      {/* Dismiss Button: Icon-only with aria-label */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDismiss}
        className="absolute top-4 right-4 min-h-[44px] min-w-[44px] p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Dismiss alert (warning persists until storage reconnects)"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </Alert>
  );
}

/**
 * Exported StorageDisconnectBanner with React.memo() optimization
 */
export const StorageDisconnectBanner = React.memo(StorageDisconnectBannerComponent);
StorageDisconnectBanner.displayName = 'StorageDisconnectBanner';
