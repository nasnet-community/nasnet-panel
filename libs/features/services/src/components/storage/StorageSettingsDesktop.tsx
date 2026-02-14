/**
 * StorageSettingsDesktop Component
 * Desktop presenter for storage configuration (>1024px)
 *
 * Features:
 * - Two-column layout (status left, usage right)
 * - Dense data tables
 * - Inline controls with hover states
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
 * StorageSettingsDesktop props
 */
export interface StorageSettingsDesktopProps {
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

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * StorageSettingsDesktop component
 * Desktop-optimized storage settings UI with two-column layout
 */
export function StorageSettingsDesktop({ className }: StorageSettingsDesktopProps) {
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
    <div className={cn('flex flex-col gap-6 p-6', className)}>
      {/* Disconnect Warning Banner */}
      {isStorageDisconnected && <StorageDisconnectBanner />}

      {/* Two-Column Layout: Configuration (left) + Usage (right) */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column: Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                <CardTitle>Storage Configuration</CardTitle>
              </div>
              <Badge
                variant={
                  isStorageDisconnected
                    ? 'destructive'
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
          <CardContent className="space-y-4">
            {/* Detection Warning */}
            {!isStorageDetected && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <p className="text-sm text-muted-foreground">
                  No external storage detected. Connect a USB drive or disk.
                </p>
              </div>
            )}

            {/* Enable Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="storage-enabled-desktop">
                  Enable External Storage
                </Label>
                <Tooltip content="Store service binaries on external storage instead of flash">
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </Tooltip>
              </div>
              <Switch
                id="storage-enabled-desktop"
                checked={isStorageConfigured}
                disabled={!isStorageDetected || configuring}
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
                <Label htmlFor="mount-select-desktop">Storage Location</Label>
                <Select
                  value={selectedMount}
                  onValueChange={setSelectedMount}
                  disabled={!isStorageDetected || configuring}
                >
                  <SelectTrigger id="mount-select-desktop">
                    <SelectValue placeholder="Select mount point" />
                  </SelectTrigger>
                  <SelectContent>
                    {externalMounts.map((mount) => (
                      <SelectItem key={mount.path} value={mount.path}>
                        {mount.path} - {formatBytes(mount.availableBytes)} free (
                        {mount.filesystem})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Scan Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleScanStorage}
              disabled={scanning}
            >
              <RefreshCw
                className={cn('mr-2 h-4 w-4', scanning && 'animate-spin')}
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
          <CardContent className="space-y-4">
            {/* External Storage Usage */}
            {isStorageConfigured && config?.storageInfo && (
              <div className="space-y-2">
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
              <div className="space-y-2">
                <Label>Flash Memory ({flashStorage.path})</Label>
                <StorageUsageBar
                  usagePercent={flashUsagePercent}
                  totalBytes={flashStorage.totalBytes}
                  usedBytes={flashStorage.usedBytes}
                  showWarning={flashUsagePercent >= 80}
                />
              </div>
            )}

            {/* Total Summary */}
            {usage && (
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Capacity:</span>
                  <span className="font-medium">
                    {formatBytes(usage.totalCapacityBytes)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Used:</span>
                  <span className="font-medium">
                    {formatBytes(usage.totalUsedBytes)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Common Section: Service Breakdown Table */}
      <Collapsible.Root open={showCommon} onOpenChange={setShowCommon}>
        <Collapsible.Trigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={!usage}
          >
            <span>Service Storage Breakdown</span>
            {showCommon ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {usage?.features && usage.features.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Instances</TableHead>
                      <TableHead className="text-right">Binary</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                      <TableHead className="text-right">Config</TableHead>
                      <TableHead className="text-right">Logs</TableHead>
                      <TableHead className="text-right">Total</TableHead>
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
                        <TableCell className="text-right">
                          {formatBytes(feature.binarySize)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatBytes(feature.dataSize)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatBytes(feature.configSize)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatBytes(feature.logsSize)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
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

      {/* Advanced Section: Mount Point Details Table */}
      <Collapsible.Root open={showAdvanced} onOpenChange={setShowAdvanced}>
        <Collapsible.Trigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={!isStorageDetected}
          >
            <span>Advanced Storage Details</span>
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mount Point</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Free</TableHead>
                    <TableHead className="text-right">Usage %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Filesystem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {externalMounts.map((mount) => (
                    <TableRow key={mount.path}>
                      <TableCell className="font-mono">{mount.path}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{mount.locationType}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatBytes(mount.totalBytes)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatBytes(mount.usedBytes)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatBytes(mount.availableBytes)}
                      </TableCell>
                      <TableCell className="text-right">
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
}
