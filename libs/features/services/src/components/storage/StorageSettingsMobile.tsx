/**
 * StorageSettingsMobile Component
 * @description Mobile presenter for external storage configuration (<640px viewport).
 * Provides touch-first experience with full-width buttons and minimal scrolling.
 *
 * @features
 * - Single-column stacked layout for mobile users
 * - 44x44px minimum touch targets (h-11 class on all interactive elements)
 * - Full-width buttons and selects for easy tapping
 * - Progressive disclosure: Essential (config) + Common (services) + Advanced (mount details)
 * - Touch-friendly cards with large typography
 * - Disconnection alert with affected services
 *
 * @see NAS-8.20: External Storage Management
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 * @see Docs/design/COMPREHENSIVE_COMPONENT_CHECKLIST.md - section 2 (Mobile design)
 */

import * as React from 'react';
import { useCallback } from 'react';
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
 * StorageSettingsMobile component props
 */
export interface StorageSettingsMobileProps {
  /** Optional CSS class name for custom styling */
  className?: string;
}

/**
 * Format bytes to human-readable string using BigInt for large values
 * @param {string} bytes - Bytes value as serialized uint64 string
 * @returns {string} Formatted value with unit (B, KB, MB, GB, TB)
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
 * @description Mobile-optimized storage settings with full-width controls and 44px touch targets
 * @param {StorageSettingsMobileProps} props - Component props
 * @returns {React.ReactNode} Rendered mobile storage settings UI
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

  const handleStorageToggle = useCallback((enabled: boolean) => {
    if (enabled && selectedMount) {
      handleEnableStorage(selectedMount);
    } else {
      handleDisableStorage(false);
    }
  }, [selectedMount, handleEnableStorage, handleDisableStorage]);

  const handleMountSelect = useCallback((value: string) => setSelectedMount(value), []);

  const handleScan = useCallback(() => handleScanStorage(), [handleScanStorage]);

  const handleCommonToggle = useCallback((open: boolean) => setShowCommon(open), [setShowCommon]);

  const handleAdvancedToggle = useCallback((open: boolean) => setShowAdvanced(open), [setShowAdvanced]);

  return (
    <div className={cn('flex flex-col gap-component-md p-component-md', className)}>
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
        <CardContent className="space-y-component-md">
          {/* Status Badge: Shows current configuration state */}
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

          {/* Detection Alert: Shown when no external storage found */}
          {!isStorageDetected && (
            <div className="flex items-center gap-component-sm p-component-sm bg-muted rounded-[var(--semantic-radius-button)]">
              <AlertTriangle className="h-5 w-5 text-category-firewall" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                No external storage detected. Connect a USB drive or disk.
              </p>
            </div>
          )}

          {/* Enable/Disable Toggle: 44px touch target for mobile */}
          <div className="flex items-center justify-between min-h-[44px]">
            <Label htmlFor="storage-enabled">Enable External Storage</Label>
            <Switch
              id="storage-enabled"
              checked={isStorageConfigured}
              disabled={!isStorageDetected || configuring}
              aria-label="Enable external storage"
              onCheckedChange={handleStorageToggle}
            />
          </div>

          {/* Mount Point Selector: Full-width dropdown for touch */}
          {isStorageDetected && (
            <div className="space-y-component-sm">
              <Label htmlFor="mount-select">Storage Location</Label>
              <Select
                value={selectedMount}
                onValueChange={handleMountSelect}
                disabled={!isStorageDetected || configuring}
              >
                <SelectTrigger id="mount-select" className="min-h-[44px]">
                  <SelectValue placeholder="Select mount point" />
                </SelectTrigger>
                <SelectContent>
                  {externalMounts.map((mount) => (
                    <SelectItem key={mount.path} value={mount.path}>
                      <span className="font-mono">{mount.path}</span> - {formatBytes(mount.availableBytes)} free
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* External Storage Usage Bar: Shown when storage is configured */}
          {isStorageConfigured && config?.storageInfo && (
            <div className="space-y-component-sm">
              <Label>Storage Usage</Label>
              <StorageUsageBar
                usagePercent={usagePercent}
                totalBytes={config.storageInfo.totalBytes}
                usedBytes={config.storageInfo.usedBytes}
                showWarning={isSpaceWarning || isSpaceCritical || isSpaceFull}
              />
            </div>
          )}

          {/* Flash Memory Usage Bar: Always displayed */}
          {flashStorage && (
            <div className="space-y-component-sm">
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

      {/* Common Section: Service Breakdown (collapsed by default) */}
      <Collapsible.Root open={showCommon} onOpenChange={handleCommonToggle}>
        <Collapsible.Trigger asChild>
          <Button
            variant="outline"
            className="w-full min-h-[44px] justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
        <Collapsible.Content className="mt-component-sm">
          <Card>
            <CardContent className="pt-component-lg space-y-component-sm">
              {usage?.features && usage.features.length > 0 ? (
                usage.features.map((feature) => (
                  <div key={feature.featureId} className="space-y-component-sm">
                    {/* Service Name and Total Size */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {feature.featureName}
                      </span>
                      <Badge variant="secondary" className="font-mono">
                        {formatBytes(feature.totalSize)}
                      </Badge>
                    </div>
                    {/* Storage Breakdown: Technical data in monospace */}
                    <div className="grid grid-cols-2 gap-component-sm text-xs text-muted-foreground font-mono">
                      <div>Binary: {formatBytes(feature.binarySize)}</div>
                      <div>Data: {formatBytes(feature.dataSize)}</div>
                      <div>Config: {formatBytes(feature.configSize)}</div>
                      <div>Logs: {formatBytes(feature.logsSize)}</div>
                    </div>
                    <Separator />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-component-md">
                  No services installed yet
                </p>
              )}
            </CardContent>
          </Card>
        </Collapsible.Content>
      </Collapsible.Root>

      {/* Advanced Section: Technical Details (collapsed by default) */}
      <Collapsible.Root open={showAdvanced} onOpenChange={handleAdvancedToggle}>
        <Collapsible.Trigger asChild>
          <Button
            variant="outline"
            className="w-full min-h-[44px] justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
        <Collapsible.Content className="mt-component-sm">
          <Card>
            <CardContent className="pt-component-lg space-y-component-md">
              {/* Mount Point Details: Technical data in monospace */}
              {externalMounts.map((mount) => (
                <div key={mount.path} className="space-y-component-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium font-mono">{mount.path}</span>
                    <Badge
                      variant={mount.mounted ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {mount.mounted ? 'Mounted' : 'Unmounted'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-component-sm text-xs text-muted-foreground font-mono">
                    <div>Total: {formatBytes(mount.totalBytes)}</div>
                    <div>Free: {formatBytes(mount.availableBytes)}</div>
                    <div>Type: {mount.filesystem}</div>
                    <div>Usage: {mount.usagePercent.toFixed(1)}%</div>
                  </div>
                  <Separator />
                </div>
              ))}

              {/* Manual Scan Button: 44px touch target */}
              <Button
                variant="outline"
                className="w-full min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={handleScan}
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
