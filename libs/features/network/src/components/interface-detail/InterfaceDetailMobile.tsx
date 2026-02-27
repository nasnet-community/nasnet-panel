import { useState, useCallback, memo } from 'react';
import { ChevronLeft } from 'lucide-react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
  Skeleton,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import { InterfaceEditForm } from '../interface-edit';

export interface InterfaceDetailMobileProps {
  /** Interface data object */
  interface: any;
  /** Whether data is loading */
  loading: boolean;
  /** Error object if load failed */
  error: any;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Router ID for API requests */
  routerId: string;
}

/**
 * Interface Detail Mobile Presenter.
 *
 * Displays interface details in a full-screen dialog with progressive disclosure
 * of status, traffic, and configuration sections.
 *
 * @description Full-screen dialog presenter for mobile (<640px) with touch-optimized layout
 */
export const InterfaceDetailMobile = memo(function InterfaceDetailMobile({
  interface: iface,
  loading,
  error,
  open,
  onClose,
  routerId,
}: InterfaceDetailMobileProps) {
  const [editMode, setEditMode] = useState(false);

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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="h-full max-w-full p-0 flex flex-col category-networking">
        {/* Header with back button */}
        <DialogHeader className="p-component-sm border-b flex-shrink-0">
          <div className="flex items-center gap-component-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Go back to interface list"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
            {loading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <DialogTitle className="font-mono">{iface?.name || 'Interface'}</DialogTitle>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-component-sm">
          {loading && (
            <div className="space-y-component-md">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {error && (
            <div className="p-component-xl text-center" role="alert">
              <p className="text-error font-medium">Failed to load interface</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error.message || 'Unknown error'}
              </p>
            </div>
          )}

          {!loading && !error && iface && !editMode && (
            <div className="space-y-6">
              {/* Status badges */}
              <div className="flex gap-component-sm">
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
                <Badge variant="outline">{iface.type}</Badge>
              </div>

              {iface.comment && (
                <p className="text-sm text-muted-foreground">{iface.comment}</p>
              )}

              {/* Status section */}
              <div>
                <h3 className="font-semibold mb-component-sm">Status</h3>
                <div className="space-y-component-sm">
                  <MobileInfoRow label="Running" value={iface.running ? 'Yes' : 'No'} />
                  {iface.macAddress && (
                    <MobileInfoRow label="MAC Address" value={iface.macAddress} mono />
                  )}
                  {iface.linkSpeed && (
                    <MobileInfoRow label="Link Speed" value={iface.linkSpeed} />
                  )}
                  {iface.linkPartner && (
                    <MobileInfoRow label="Link Partner" value={iface.linkPartner} />
                  )}
                </div>
              </div>

              <Separator />

              {/* Traffic section */}
              <div>
                <h3 className="font-semibold mb-component-sm">Traffic</h3>
                <div className="grid grid-cols-2 gap-component-md">
                  <div className="border border-border rounded-[var(--semantic-radius-card)] p-component-md">
                    <h4 className="text-xs text-muted-foreground mb-1">TX Rate</h4>
                    <p className="text-xl font-bold font-mono">{formatRate(iface.txRate || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      Total: {formatBytes(iface.txBytes || 0)}
                    </p>
                  </div>
                  <div className="border border-border rounded-[var(--semantic-radius-card)] p-component-md">
                    <h4 className="text-xs text-muted-foreground mb-1">RX Rate</h4>
                    <p className="text-xl font-bold font-mono">{formatRate(iface.rxRate || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      Total: {formatBytes(iface.rxBytes || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Configuration section */}
              <div>
                <h3 className="font-semibold mb-component-sm">Configuration</h3>
                <div className="space-y-component-sm">
                  <MobileInfoRow label="MTU" value={iface.mtu || 'Default'} />
                  {iface.ip && iface.ip.length > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-muted-foreground">IP Addresses</span>
                      <div className="text-sm text-right font-mono space-y-component-xs">
                        {iface.ip.map((addr: string) => (
                          <div key={addr} className="break-all">{addr}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {iface.usedBy && iface.usedBy.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-component-sm">Used By</h3>
                    <div className="flex flex-wrap gap-component-sm">
                      {iface.usedBy.map((usage: string) => (
                        <Badge key={usage} variant="outline">
                          {usage}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Edit form view */}
          {!loading && !error && iface && editMode && (
            <InterfaceEditForm
              routerId={routerId}
              interface={iface}
              onSuccess={() => {
                setEditMode(false);
                // Interface will auto-refresh via subscription
              }}
              onCancel={() => setEditMode(false)}
            />
          )}
        </div>

        {/* Footer with action button */}
        {!loading && !error && iface && !editMode && (
          <div className="border-t p-component-md flex-shrink-0">
            <Button
              className="w-full min-h-[44px]"
              onClick={() => setEditMode(true)}
              aria-label="Edit interface settings"
            >
              Edit Interface Settings
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

InterfaceDetailMobile.displayName = 'InterfaceDetailMobile';

/**
 * Mobile Info Row Helper.
 *
 * Displays a single info metric in a label-value row format optimized for mobile.
 * @description Mobile-optimized label-value row with optional monospace styling for technical data
 */
const MobileInfoRow = memo(function MobileInfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  const isTechnicalData = label === 'MAC Address' || label === 'Link Partner' || label === 'Link Speed' || mono;
  return (
    <div className="flex justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm break-all', isTechnicalData && 'font-mono')}>{value}</span>
    </div>
  );
});

MobileInfoRow.displayName = 'MobileInfoRow';
