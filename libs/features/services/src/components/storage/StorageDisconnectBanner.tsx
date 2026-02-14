/**
 * StorageDisconnectBanner Component
 * Persistent alert when external storage disconnects
 *
 * Features:
 * - Prominent warning styling
 * - Lists affected services
 * - Dismissible (but warning persists until reconnection)
 * - Accessible with ARIA live region
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
import { cn } from '@nasnet/ui/utils';

import { useStorageSettings } from './useStorageSettings';

/**
 * StorageDisconnectBanner props
 */
export interface StorageDisconnectBannerProps {
  /** Optional className for styling */
  className?: string;

  /** Optional callback when banner is dismissed */
  onDismiss?: () => void;
}

/**
 * StorageDisconnectBanner component
 * Shows warning when configured external storage is disconnected
 */
export function StorageDisconnectBanner({
  className,
  onDismiss,
}: StorageDisconnectBannerProps) {
  const { config, usage } = useStorageSettings();

  const [dismissed, setDismissed] = React.useState(false);

  /**
   * Get list of affected services (services that were using external storage)
   */
  const affectedServices = React.useMemo(() => {
    if (!usage?.features) return [];
    return usage.features
      .filter((feature) => feature.location === 'external')
      .map((feature) => feature.featureName);
  }, [usage?.features]);

  /**
   * Handle dismiss
   */
  const handleDismiss = React.useCallback(() => {
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
      variant="warning"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn('relative', className)}
    >
      <AlertTriangle className="h-5 w-5" />

      <AlertTitle className="text-lg font-semibold pr-8">
        External Storage Disconnected
      </AlertTitle>

      <AlertDescription className="space-y-3">
        <p>
          Storage at{' '}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {config.path}
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

      {/* Dismiss Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDismiss}
        className="absolute top-4 right-4 h-6 w-6 p-0"
        aria-label="Dismiss alert (warning will persist until storage reconnects)"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}
