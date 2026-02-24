/**
 * StorageSettingsDesktop Component
 * @description Desktop presenter for external storage configuration (>1024px viewport).
 * Provides power-user experience with two-column layout, dense tables, and inline controls.
 *
 * @features
 * - Two-column layout: Configuration (left) + Usage Metrics (right)
 * - Dense data tables with sortable mount points and service breakdown
 * - Progressive disclosure sections: Common (service breakdown) + Advanced (mount details)
 * - Inline controls with hover states (switches, selects, buttons)
 * - Real-time storage status with color-coded warnings
 * - Disconnect banner with affected services list
 *
 * @see NAS-8.20: External Storage Management
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
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
  Info,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import { useStorageSettings } from './useStorageSettings';
import { StorageUsageBar } from './StorageUsageBar';
import { StorageDisconnectBanner } from './StorageDisconnectBanner';

/**
 * StorageSettingsDesktop component props
 */
export interface StorageSettingsDesktopProps {
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

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * StorageSettingsDesktop component
 * @description Desktop-optimized storage configuration with two-column layout and dense tables
 * @param {StorageSettingsDesktopProps} props - Component props
 * @returns {React.ReactNode} Rendered desktop storage settings UI
 */
export const StorageSettingsDesktop = React.memo(function StorageSettingsDesktop({ className }: StorageSettingsDesktopProps) {
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
    <div className={cn('flex flex-col gap-component-lg p-component-lg', className)}>
      {/* Disconnect Warning Banner */}
      {isStorageDisconnected && <StorageDisconnectBanner />}

      {/* Two-Column Layout: Configuration (left) + Usage (right) */}
      <div className="grid grid-cols-2 gap-component-lg">
        {/* Left Column: Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" aria-hidden="true" />
                <CardTitle>Storage Configuration</CardTitle>
              </div>
              <Badge
                variant={
                  isStorageDisconnected
                    ? 'error'
                    : isStorageConfigured
                    ? 'default'
                    : 'secondary'
                }
              >
                {isStorageDisconnected
                  ? 'Disconnected'
                  : isStorageConfigured
                  ? 'Configured'
                  : 'Not Configured'}
              </Badge>
            </div>
            <CardDescription>
              Offload service binaries to USB/disk to save flash memory
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-component-md">
            {/* Detection Warning: Alert when no external storage devices found */}
            {!isStorageDetected && (
              <div className="flex items-center gap-component-sm p-component-sm bg-muted rounded-[var(--semantic-radius-button)]">
                <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  No external storage detected. Connect a USB drive or disk.
                </p>
              </div>
            )}

            {/* Enable Toggle: Switch to enable/disable external storage */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-component-sm">
                <Label htmlFor="storage-enabled-desktop">
                  Enable External Storage
                </Label>
                <Tooltip>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" aria-hidden="true" />
                  <span slot="content" className="text-sm">
                    Store service binaries on external storage instead of flash
                  </span>
                </Tooltip>
              </div>
              <Switch
                id="storage-enabled-desktop"
                checked={isStorageConfigured}
                disabled={!isStorageDetected || configuring}
                aria-label="Enable external storage"
                onCheckedChange={handleStorageToggle}
              />
            </div>

            {/* Mount Point Selector: Choose which storage device to use */}
            {isStorageDetected && (
              <div className="space-y-component-sm">
                <Label htmlFor="mount-select-desktop">Storage Location</Label>
                <Select
                  value={selectedMount}
                  onValueChange={handleMountSelect}
                  disabled={!isStorageDetected || configuring}
                >
                  <SelectTrigger id="mount-select-desktop">
                    <SelectValue placeholder="Select mount point" />
                  </SelectTrigger>
                  <SelectContent>
                    {externalMounts.map((mount) => (
                      <SelectItem key={mount.path} value={mount.path}>
                        <span className="font-mono">{mount.path}</span> - {formatBytes(mount.availableBytes)} free (
                        {mount.filesystem})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Scan Button: Trigger manual scan for storage devices */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleScan}
              disabled={scanning}
              aria-label={scanning ? 'Scanning for storage devices' : 'Scan for storage devices'}
            >
              <RefreshCw
                className={cn('mr-2 h-4 w-4', scanning && 'animate-spin')}
                aria-hidden="true"
              />
              {scanning ? 'Scanning...' : 'Scan for Storage Devices'}
            </Button>
          </CardContent>
        </Card>

        {/* Right Column: Usage Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
            <CardDescription>
              Current storage consumption across flash and external
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-component-md">
            {/* External Storage Usage */}
            {isStorageConfigured && config?.storageInfo && (
              <div className="space-y-component-sm">
                <Label>External Storage ({config.path})</Label>
                <StorageUsageBar
                  usagePercent={usagePercent}
                  totalBytes={config.storageInfo.totalBytes}
                  usedBytes={config.storageInfo.usedBytes}
                  showWarning={isSpaceWarning || isSpaceCritical || isSpaceFull}
                />
              </div>
            )}

            {/* Flash Storage Usage */}
            {flashStorage && (
              <div className="space-y-component-sm">
                <Label>Flash Memory ({flashStorage.path})</Label>
                <StorageUsageBar
                  usagePercent={flashUsagePercent}
                  totalBytes={flashStorage.totalBytes}
                  usedBytes={flashStorage.usedBytes}
                  showWarning={flashUsagePercent >= 80}
                />
              </div>
            )}

            {/* Total Summary: Aggregate capacity across all storage */}
            {usage && (
              <div className="pt-component-sm border-t border-border space-y-component-sm">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Capacity:</span>
                  <span className="font-medium font-mono">
                    {formatBytes(usage.totalCapacityBytes)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Used:</span>
                  <span className="font-medium font-mono">
                    {formatBytes(usage.totalUsedBytes)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Common Section: Service Breakdown Table (collapsed by default) */}
      <Collapsible.Root open={showCommon} onOpenChange={handleCommonToggle}>
        <Collapsible.Trigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
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
        <Collapsible.Content className="mt-component-md">
          <Card>
            <CardContent className="pt-component-lg">
              {usage?.features && usage.features.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Instances</TableHead>
                      <TableHead className="text-right font-mono">Binary</TableHead>
                      <TableHead className="text-right font-mono">Data</TableHead>
                      <TableHead className="text-right font-mono">Config</TableHead>
                      <TableHead className="text-right font-mono">Logs</TableHead>
                      <TableHead className="text-right font-mono">Total</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usage.features.map((feature) => (
                      <TableRow key={feature.featureId}>
                        <TableCell className="font-medium">
                          {feature.featureName}
                        </TableCell>
                        <TableCell className="text-right">
                          {feature.instanceCount}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatBytes(feature.binarySize)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatBytes(feature.dataSize)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatBytes(feature.configSize)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatBytes(feature.logsSize)}
                        </TableCell>
                        <TableCell className="text-right font-medium font-mono">
                          {formatBytes(feature.totalSize)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{feature.location}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No services installed yet
                </p>
              )}
            </CardContent>
          </Card>
        </Collapsible.Content>
      </Collapsible.Root>

      {/* Advanced Section: Mount Point Details Table (collapsed by default) */}
      <Collapsible.Root open={showAdvanced} onOpenChange={handleAdvancedToggle}>
        <Collapsible.Trigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={!isStorageDetected}
            aria-label="Toggle advanced storage details"
            aria-expanded={showAdvanced}
          >
            <span>Advanced Storage Details</span>
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content className="mt-component-md">
          <Card>
            <CardContent className="pt-component-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono">Mount Point</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right font-mono">Total</TableHead>
                    <TableHead className="text-right font-mono">Used</TableHead>
                    <TableHead className="text-right font-mono">Free</TableHead>
                    <TableHead className="text-right font-mono">Usage %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="font-mono">Filesystem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {externalMounts.map((mount) => (
                    <TableRow key={mount.path}>
                      <TableCell className="font-mono text-sm">{mount.path}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{mount.locationType}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatBytes(mount.totalBytes)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatBytes(mount.usedBytes)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatBytes(mount.availableBytes)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {mount.usagePercent.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={mount.mounted ? 'default' : 'secondary'}
                        >
                          {mount.mounted ? 'Mounted' : 'Unmounted'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {mount.filesystem}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
});

StorageSettingsDesktop.displayName = 'StorageSettingsDesktop';
