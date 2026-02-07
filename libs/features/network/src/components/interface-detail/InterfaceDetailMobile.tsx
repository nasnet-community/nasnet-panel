import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
  Button,
  Skeleton,
  Separator,
} from '@nasnet/ui/primitives';
import { ChevronLeft } from 'lucide-react';
import { InterfaceEditForm } from '../interface-edit';

export interface InterfaceDetailMobileProps {
  interface: any;
  loading: boolean;
  error: any;
  open: boolean;
  onClose: () => void;
  routerId: string;
}

/**
 * Interface Detail Mobile Presenter
 * Displays interface details in a full-screen dialog
 */
export function InterfaceDetailMobile({
  interface: iface,
  loading,
  error,
  open,
  onClose,
  routerId,
}: InterfaceDetailMobileProps) {
  const [editMode, setEditMode] = useState(false);
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatRate = (bytesPerSec: number) => {
    return `${formatBytes(bytesPerSec)}/s`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="h-full max-w-full p-0 flex flex-col">
        {/* Header with back button */}
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-0 h-8 w-8"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            {loading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <DialogTitle>{iface?.name || 'Interface'}</DialogTitle>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {error && (
            <div className="p-8 text-center">
              <p className="text-destructive font-medium">Failed to load interface</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error.message || 'Unknown error'}
              </p>
            </div>
          )}

          {!loading && !error && iface && !editMode && (
            <div className="space-y-6">
              {/* Status badges */}
              <div className="flex gap-2">
                <Badge variant={iface.enabled ? 'default' : 'outline'}>
                  {iface.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <Badge
                  variant={
                    iface.status === 'UP'
                      ? 'success'
                      : iface.status === 'DOWN'
                      ? 'destructive'
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
                <h3 className="font-semibold mb-3">Status</h3>
                <div className="space-y-2">
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
                <h3 className="font-semibold mb-3">Traffic</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="text-xs text-muted-foreground mb-1">TX Rate</h4>
                    <p className="text-xl font-bold">{formatRate(iface.txRate || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total: {formatBytes(iface.txBytes || 0)}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="text-xs text-muted-foreground mb-1">RX Rate</h4>
                    <p className="text-xl font-bold">{formatRate(iface.rxRate || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total: {formatBytes(iface.rxBytes || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Configuration section */}
              <div>
                <h3 className="font-semibold mb-3">Configuration</h3>
                <div className="space-y-2">
                  <MobileInfoRow label="MTU" value={iface.mtu || 'Default'} />
                  {iface.ip && iface.ip.length > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-muted-foreground">IP Addresses</span>
                      <div className="text-sm text-right font-mono space-y-1">
                        {iface.ip.map((addr: string) => (
                          <div key={addr}>{addr}</div>
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
                    <h3 className="font-semibold mb-3">Used By</h3>
                    <div className="flex flex-wrap gap-2">
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
          <div className="border-t p-4 flex-shrink-0">
            <Button
              className="w-full"
              onClick={() => setEditMode(true)}
            >
              Edit Interface Settings
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Helper component for mobile info rows
 */
function MobileInfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
