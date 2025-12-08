/**
 * Hardware Card Component
 * Displays routerboard hardware details with copy-to-clipboard functionality
 */

import { Card, CardContent, CardHeader, CardTitle, Button, Skeleton } from '@nasnet/ui/primitives';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { RouterboardInfo } from '@nasnet/core/types';

export interface HardwareCardProps {
  /**
   * Routerboard hardware information
   */
  data?: RouterboardInfo | null;

  /**
   * Loading state indicator
   */
  isLoading?: boolean;

  /**
   * Error occurred during fetch
   */
  error?: Error | null;
}

/**
 * Skeleton loading state for hardware card
 */
function SkeletonState() {
  return (
    <Card className="rounded-card-sm md:rounded-card-lg shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Hardware Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

/**
 * Fallback message when hardware details are unavailable
 */
function FallbackState() {
  return (
    <Card className="rounded-card-sm md:rounded-card-lg shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Hardware Details</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Hardware details not available for this device
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Detail row with label and value
 */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-mono text-slate-900 dark:text-slate-50">{value}</span>
    </div>
  );
}

/**
 * Serial number row with copy-to-clipboard button
 */
function SerialNumberRow({ serialNumber }: { serialNumber: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(serialNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy serial number:', err);
    }
  };

  return (
    <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Serial Number</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-slate-900 dark:text-slate-50">{serialNumber}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-button hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          onClick={handleCopy}
          aria-label="Copy serial number"
        >
          {copied ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Copy className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Hardware Card Component
 * Displays routerboard hardware details including serial number, firmware versions, and revision
 *
 * @example
 * ```tsx
 * import { HardwareCard } from '@nasnet/ui/patterns';
 * import { useRouterboard } from '@nasnet/api-client/queries';
 *
 * function Dashboard() {
 *   const { data, isLoading, error } = useRouterboard();
 *
 *   return <HardwareCard data={data} isLoading={isLoading} error={error} />;
 * }
 * ```
 */
export function HardwareCard({ data, isLoading = false, error = null }: HardwareCardProps) {
  // Show skeleton while loading
  if (isLoading) {
    return <SkeletonState />;
  }

  // Show fallback if error or no data
  if (error || !data) {
    return <FallbackState />;
  }

  // Check if factory firmware is different from current
  const showFactoryFirmware = data.factoryFirmware !== data.currentFirmware;

  return (
    <Card className="rounded-card-sm md:rounded-card-lg shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Hardware Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 pt-0">
        <SerialNumberRow serialNumber={data.serialNumber} />
        <DetailRow label="Model" value={data.model} />
        <DetailRow label="Firmware" value={data.currentFirmware} />
        {showFactoryFirmware && (
          <DetailRow label="Factory Firmware" value={data.factoryFirmware} />
        )}
        <DetailRow label="Revision" value={data.revision} />
      </CardContent>
    </Card>
  );
}
