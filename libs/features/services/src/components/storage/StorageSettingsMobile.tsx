/**
 * StorageSettingsMobile Component
 * Mobile presenter for storage configuration (<640px)
 *
 * Features:
 * - Stacked vertical layout
 * - 44px touch targets (h-11 class)
 * - Full-width buttons
 * - Progressive disclosure (Essential → Common → Advanced)
 *
 * @see NAS-8.20: External Storage Management
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */

import * as React from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import {
  ChevronDown,
  ChevronUp,
  HardDrive,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Label,
  Switch,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import { useStorageSettings } from './useStorageSettings';
import { StorageUsageBar } from './StorageUsageBar';
import { StorageDisconnectBanner } from './StorageDisconnectBanner';

/**
 * StorageSettingsMobile props
 */
export interface StorageSettingsMobileProps {
  /** Optional className for styling */
  className?: string;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: string): string {
  const num = BigInt(bytes);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = Number(num);
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * StorageSettingsMobile component
 * Mobile-optimized storage settings UI
 */
export const StorageSettingsMobile = React.memo(function StorageSettingsMobile({ className }: StorageSettingsMobileProps) {
  const {
    externalMounts,
    flashStorage,
    usage,
    config,
    isStorageDetected,
    isStorageConfigured,
    isStorageConnected,
    isStorageDisconnected,
    usagePercent,
    flashUsagePercent,
    isSpaceWarning,
    isSpaceCritical,
    isSpaceFull,
    showCommon,
    setShowCommon,
    showAdvanced,
    setShowAdvanced,
    handleEnableStorage,
    handleDisableStorage,
    handleScanStorage,
    loading,
    configuring,
    scanning,
  } = useStorageSettings();

  const [selectedMount, setSelectedMount] = React.useState<string>('');

  // Auto-select first mount when detected
  React.useEffect(() => {
    if (externalMounts.length > 0 && !selectedMount) {
      setSelectedMount(externalMounts[0].path);
    }
  }, [externalMounts, selectedMount]);

  return (
    <div className={cn('flex flex-col gap-4 p-4', className)}>
      {/* Disconnect Warning Banner */}
      {isStorageDisconnected && <StorageDisconnectBanner />}

      {/* Essential Section: Storage Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" aria-hidden="true" />
            <CardTitle>External Storage</CardTitle>
          </div>
          <CardDescription>
            Offload service binaries to USB/disk to save flash memory
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Label>Status</Label>
            <Badge
              variant={
                isStorageDisconnected
                  ? 'error'
                  : isStorageConfigured
                  ? 'default'
                  : 'secondary'
              }
              className="h-11 px-4"
            >
              {isStorageDisconnected
                ? 'Disconnected'
                : isStorageConfigured
                ? 'Configured'
                : 'Not Configured'}
            </Badge>
          </div>

          {/* Detection Status */}
          {!isStorageDetected && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                No external storage detected. Connect a USB drive or disk.
              </p>
            </div>
          )}

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between h-11">
            <Label htmlFor="storage-enabled">Enable External Storage</Label>
            <Switch
              id="storage-enabled"
              checked={isStorageConfigured}
              disabled={!isStorageDetected || configuring}
              aria-label="Enable external storage"
              onCheckedChange={(enabled) => {
                if (enabled && selectedMount) {
                  handleEnableStorage(selectedMount);
                } else {
                  handleDisableStorage(false);
                }
              }}
            />
          </div>

          {/* Mount Point Selector */}
          {isStorageDetected && (
            <div className="space-y-2">
              <Label htmlFor="mount-select">Storage Location</Label>
              <Select
                value={selectedMount}
                onValueChange={setSelectedMount}
                disabled={!isStorageDetected || configuring}
              >
                <SelectTrigger id="mount-select" className="h-11">
                  <SelectValue placeholder="Select mount point" />
                </SelectTrigger>
                <SelectContent>
                  {externalMounts.map((mount) => (
                    <SelectItem key={mount.path} value={mount.path}>
                      {mount.path} - {formatBytes(mount.availableBytes)} free
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Usage Bar (if configured) */}
          {isStorageConfigured && config?.storageInfo && (
            <div className="space-y-2">
              <Label>Storage Usage</Label>
              <StorageUsageBar
                usagePercent={usagePercent}
                totalBytes={config.storageInfo.totalBytes}
                usedBytes={config.storageInfo.usedBytes}
                showWarning={isSpaceWarning || isSpaceCritical || isSpaceFull}
              />
            </div>
          )}

          {/* Flash Usage (always show) */}
          {flashStorage && (
            <div className="space-y-2">
              <Label>Flash Memory Usage</Label>
              <StorageUsageBar
                usagePercent={flashUsagePercent}
                totalBytes={flashStorage.totalBytes}
                usedBytes={flashStorage.usedBytes}
                showWarning={flashUsagePercent >= 80}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Common Section: Service Breakdown */}
      <Collapsible.Root open={showCommon} onOpenChange={setShowCommon}>
        <Collapsible.Trigger asChild>
          <Button
            variant="outline"
            className="w-full h-11 justify-between"
            disabled={!usage}
            aria-label="Toggle service storage breakdown"
            aria-expanded={showCommon}
          >
            <span>Service Storage Breakdown</span>
            {showCommon ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content className="mt-2">
          <Card>
            <CardContent className="pt-6 space-y-3">
              {usage?.features && usage.features.length > 0 ? (
                usage.features.map((feature) => (
                  <div key={feature.featureId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {feature.featureName}
                      </span>
                      <Badge variant="secondary">
                        {formatBytes(feature.totalSize)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Binary: {formatBytes(feature.binarySize)}</div>
                      <div>Data: {formatBytes(feature.dataSize)}</div>
                      <div>Config: {formatBytes(feature.configSize)}</div>
                      <div>Logs: {formatBytes(feature.logsSize)}</div>
                    </div>
                    <Separator />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No services installed yet
                </p>
              )}
            </CardContent>
          </Card>
        </Collapsible.Content>
      </Collapsible.Root>

      {/* Advanced Section: Technical Details */}
      <Collapsible.Root open={showAdvanced} onOpenChange={setShowAdvanced}>
        <Collapsible.Trigger asChild>
          <Button
            variant="outline"
            className="w-full h-11 justify-between"
            disabled={!isStorageDetected}
            aria-label="Toggle advanced storage details"
            aria-expanded={showAdvanced}
          >
            <span>Advanced Details</span>
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content className="mt-2">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Mount Point Details */}
              {externalMounts.map((mount) => (
                <div key={mount.path} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{mount.path}</span>
                    <Badge
                      variant={mount.mounted ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {mount.mounted ? 'Mounted' : 'Unmounted'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Total: {formatBytes(mount.totalBytes)}</div>
                    <div>Free: {formatBytes(mount.availableBytes)}</div>
                    <div>Type: {mount.filesystem}</div>
                    <div>Usage: {mount.usagePercent.toFixed(1)}%</div>
                  </div>
                  <Separator />
                </div>
              ))}

              {/* Manual Scan Button */}
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={handleScanStorage}
                disabled={scanning}
                aria-label={scanning ? 'Scanning for storage devices' : 'Scan for storage devices'}
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', scanning && 'animate-spin')} aria-hidden="true" />
                {scanning ? 'Scanning...' : 'Scan for Storage'}
              </Button>
            </CardContent>
          </Card>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
});

StorageSettingsMobile.displayName = 'StorageSettingsMobile';
