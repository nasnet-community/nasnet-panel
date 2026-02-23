import { useState, useCallback, useMemo, memo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Button,
  Skeleton,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import { InterfaceEditForm } from '../interface-edit';

export interface InterfaceDetailDesktopProps {
  /** Interface data object */
  interface: any;
  /** Whether data is loading */
  loading: boolean;
  /** Error object if load failed */
  error: any;
  /** Whether the sheet is open */
  open: boolean;
  /** Callback to close the sheet */
  onClose: () => void;
  /** Router ID for API requests */
  routerId: string;
}

/**
 * Interface Detail Desktop Presenter.
 *
 * Displays interface details in a right-side Sheet panel with tabs for status,
 * traffic, and configuration. Supports in-place editing of interface settings.
 *
 * @description Right-side panel presenter for desktop (>1024px) with status, traffic, and config tabs
 */
export const InterfaceDetailDesktop = memo(function InterfaceDetailDesktop({
  interface: iface,
  loading,
  error,
  open,
  onClose,
  routerId,
}: InterfaceDetailDesktopProps) {
  const [editMode, setEditMode] = useState(false);

  const handleEditModeChange = useCallback((isEditing: boolean) => {
    setEditMode(isEditing);
  }, []);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-[600px] overflow-y-auto">
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {error && (
          <div className="p-8 text-center" role="alert">
            <p className="text-error font-medium">Failed to load interface</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error.message || 'Unknown error'}
            </p>
          </div>
        )}

        {!loading && !error && iface && (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle>{iface.name}</SheetTitle>
                <div className="flex gap-2">
                  <Badge variant={iface.enabled ? 'default' : 'outline'}>
                    {iface.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Badge
                    variant={
                      iface.status === 'UP'
                        ? 'success'
                        : iface.status === 'DOWN'
                        ? 'error'
                        : 'secondary'
                    }
                  >
                    {iface.status}
                  </Badge>
                </div>
              </div>
              <SheetDescription>
                {iface.type} interface
                {iface.comment && ` - ${iface.comment}`}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6">
              <Tabs defaultValue="status">
                <TabsList className="w-full">
                  <TabsTrigger value="status" className="flex-1">
                    Status
                  </TabsTrigger>
                  <TabsTrigger value="traffic" className="flex-1">
                    Traffic
                  </TabsTrigger>
                  <TabsTrigger value="config" className="flex-1">
                    Configuration
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="status" className="space-y-4 mt-4">
                  <InterfaceStatusSection interface={iface} />
                </TabsContent>

                <TabsContent value="traffic" className="space-y-4 mt-4">
                  <InterfaceTrafficSection interface={iface} />
                </TabsContent>

                <TabsContent value="config" className="space-y-4 mt-4">
                  {editMode ? (
                    <InterfaceEditForm
                      routerId={routerId}
                      interface={iface}
                      onSuccess={() => {
                        handleEditModeChange(false);
                        // Interface will auto-refresh via subscription
                      }}
                      onCancel={() => handleEditModeChange(false)}
                    />
                  ) : (
                    <InterfaceConfigSection
                      interface={iface}
                      onEdit={() => handleEditModeChange(true)}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
});

InterfaceDetailDesktop.displayName = 'InterfaceDetailDesktop';

/**
 * Interface Status Section.
 *
 * Displays operational status and link information in a grid layout.
 * @description Operational status display (enabled, running, status, type, MAC, link partner, usage)
 */
const InterfaceStatusSection = memo(function InterfaceStatusSection({
  interface: iface,
}: {
  interface: any;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatusItem label="Enabled" value={iface.enabled ? 'Yes' : 'No'} />
        <StatusItem label="Running" value={iface.running ? 'Yes' : 'No'} />
        <StatusItem label="Status" value={iface.status} />
        <StatusItem label="Type" value={iface.type} />
        {iface.macAddress && (
          <StatusItem label="MAC Address" value={iface.macAddress} className="col-span-2" />
        )}
        {iface.linkSpeed && <StatusItem label="Link Speed" value={iface.linkSpeed} />}
        {iface.linkPartner && (
          <StatusItem label="Link Partner" value={iface.linkPartner} className="col-span-2" />
        )}
      </div>

      {iface.usedBy && iface.usedBy.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Used By</h4>
          <div className="flex flex-wrap gap-2">
            {iface.usedBy.map((usage: string) => (
              <Badge key={usage} variant="outline">
                {usage}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

InterfaceStatusSection.displayName = 'InterfaceStatusSection';

/**
 * Interface Traffic Section.
 *
 * Displays traffic statistics and rates in two-column grid with TX/RX metrics.
 * @description Traffic statistics display (TX/RX rates, total bytes)
 */
const InterfaceTrafficSection = memo(function InterfaceTrafficSection({
  interface: iface,
}: {
  interface: any;
}) {
  const formatBytes = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const BYTE_UNIT = 1024;
    const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(BYTE_UNIT));
    return `${(bytes / Math.pow(BYTE_UNIT, unitIndex)).toFixed(2)} ${BYTE_UNITS[unitIndex]}`;
  }, []);

  const formatRate = useCallback((bytesPerSec: number) => {
    return `${formatBytes(bytesPerSec)}/s`;
  }, [formatBytes]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h4 className="text-sm text-muted-foreground mb-1">TX Rate</h4>
          <p className="text-2xl font-bold">{formatRate(iface.txRate || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Total: {formatBytes(iface.txBytes || 0)}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h4 className="text-sm text-muted-foreground mb-1">RX Rate</h4>
          <p className="text-2xl font-bold">{formatRate(iface.rxRate || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Total: {formatBytes(iface.rxBytes || 0)}
          </p>
        </div>
      </div>

      {/* TODO: Add traffic chart visualization */}
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        Traffic chart will be implemented here
      </div>
    </div>
  );
});

InterfaceTrafficSection.displayName = 'InterfaceTrafficSection';

/**
 * Interface Configuration Section.
 *
 * Displays configuration details (MTU, comment, IP addresses) with edit button.
 * @description Configuration display with edit trigger button
 */
const InterfaceConfigSection = memo(function InterfaceConfigSection({
  interface: iface,
  onEdit,
}: {
  interface: any;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatusItem label="MTU" value={iface.mtu || 'Default'} />
        <StatusItem label="Comment" value={iface.comment || 'None'} />
      </div>

      {iface.ip && iface.ip.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">IP Addresses</h4>
          <div className="space-y-1">
            {iface.ip.map((addr: string) => (
              <div key={addr} className="font-mono text-sm break-all">
                {addr}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4">
        <Button className="w-full" onClick={onEdit} aria-label="Edit interface settings">
          Edit Interface Settings
        </Button>
      </div>
    </div>
  );
});

InterfaceConfigSection.displayName = 'InterfaceConfigSection';

/**
 * Status Item Helper.
 *
 * Displays a single status metric in a bordered box with label and value.
 * @description Reusable status metric display component
 */
const StatusItem = memo(function StatusItem({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={cn('border rounded-lg p-3', className)}>
      <h4 className="text-xs text-muted-foreground mb-1">{label}</h4>
      <p className="text-sm font-medium break-all">{value}</p>
    </div>
  );
});

StatusItem.displayName = 'StatusItem';
