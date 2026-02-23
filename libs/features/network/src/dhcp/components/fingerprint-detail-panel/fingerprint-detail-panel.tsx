/**
 * FingerprintDetailPanel Component
 *
 * Displays detailed fingerprint information for a DHCP lease.
 * Part of NAS-6.13 DHCP Fingerprinting feature.
 *
 * @module @nasnet/features/network/dhcp/components/fingerprint-detail-panel
 */

import { memo, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@nasnet/ui/primitives';
import { useToast, Icon } from '@nasnet/ui/patterns';
import { lookupVendor } from '@nasnet/core/utils';
import { cn } from '@nasnet/ui/utils';
import { Pencil, Copy } from 'lucide-react';

import type {
  DHCPLeaseWithOptions,
  DeviceIdentification,
} from '@nasnet/core/types';

import { DeviceTypeIcon, formatDeviceType } from '../device-type-icon';

/**
 * Props for FingerprintDetailPanel component
 */
export interface FingerprintDetailPanelProps {
  /** DHCP lease with options data */
  lease: DHCPLeaseWithOptions;

  /** Device identification result */
  identification: DeviceIdentification;

  /** Callback when Edit button is clicked */
  onEdit?: () => void;

  /** Callback when Copy button is clicked */
  onCopy?: () => void;

  /** Additional CSS classes */
  className?: string;
}

/**
 * FingerprintDetailPanel Component
 *
 * Displays 8 fields of fingerprint information:
 * 1. Detected Type
 * 2. Confidence %
 * 3. Fingerprint Hash
 * 4. Option 55
 * 5. Option 60 (if present)
 * 6. Hostname Pattern
 * 7. MAC Vendor
 * 8. Source badge (automatic/manual)
 *
 * @example
 * ```tsx
 * <FingerprintDetailPanel
 *   lease={leaseWithOptions}
 *   identification={deviceIdentification}
 *   onEdit={() => setDialogOpen(true)}
 *   onCopy={() => copyToClipboard(fingerprint)}
 * />
 * ```
 */
function FingerprintDetailPanelComponent({
  lease,
  identification,
  onEdit,
  onCopy,
  className,
}: FingerprintDetailPanelProps) {
  const { toast } = useToast();

  const handleCopy = useCallback(() => {
    const fingerprintData = {
      macAddress: identification.macAddress,
      deviceType: identification.deviceType,
      deviceCategory: identification.deviceCategory,
      confidence: identification.confidence,
      source: identification.source,
      fingerprintHash: identification.fingerprintHash,
      option55: lease.options?.['55'],
      option60: lease.options?.['60'],
      hostname: lease.hostname,
      identifiedAt: identification.identifiedAt,
    };

    navigator.clipboard.writeText(JSON.stringify(fingerprintData, null, 2));

    toast({
      title: 'Fingerprint Copied',
      description: 'Fingerprint data copied to clipboard as JSON',
    });

    onCopy?.();
  }, [identification, lease, toast, onCopy]);

  // Lookup MAC vendor
  const vendor = useMemo(
    () => lookupVendor(lease.macAddress),
    [lease.macAddress]
  );

  // Format Option 55 for display
  const option55Display = useMemo(() => {
    const option55 = lease.options?.['55'];
    if (!option55) return 'Not available';

    if (Array.isArray(option55)) {
      return option55.join(', ');
    }

    if (typeof option55 === 'string') {
      return option55;
    }

    return 'Invalid format';
  }, [lease.options]);

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <DeviceTypeIcon
              deviceType={identification.deviceType}
              deviceCategory={identification.deviceCategory}
              showTooltip={false}
              className="h-6 w-6"
            />
            <div>
              <CardTitle className="text-base">
                {formatDeviceType(identification.deviceType)}
              </CardTitle>
              <CardDescription className="text-sm font-mono">
                {lease.hostname || lease.macAddress}
              </CardDescription>
            </div>
          </div>
          <Badge variant={identification.source === 'manual' ? 'default' : 'secondary'}>
            {identification.source === 'manual' ? 'Manual' : 'Automatic'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Field 1: Detected Type */}
        <DetailField
          label="Detected Type"
          value={formatDeviceType(identification.deviceType)}
        />

        {/* Field 2: Confidence % */}
        <DetailField
          label="Confidence"
          value={`${identification.confidence}%`}
        />

        {/* Field 3: Fingerprint Hash */}
        {identification.fingerprintHash && (
          <DetailField
            label="Fingerprint Hash"
            value={identification.fingerprintHash}
            mono
          />
        )}

        {/* Field 4: Option 55 */}
        <DetailField
          label="DHCP Option 55"
          value={option55Display}
          mono
        />

        {/* Field 5: Option 60 (if present) */}
        {lease.options?.['60'] && (
          <DetailField
            label="DHCP Option 60"
            value={lease.options['60']}
            mono
          />
        )}

        {/* Field 6: Hostname Pattern */}
        {lease.hostname && (
          <DetailField
            label="Hostname"
            value={lease.hostname}
          />
        )}

        {/* Field 7: MAC Vendor */}
        <DetailField
          label="MAC Vendor"
          value={vendor || 'Unknown'}
        />

        {/* Field 8: Source badge - already shown in header */}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1 gap-2"
              aria-label="Edit device fingerprint"
            >
              <Icon icon={Pencil} size="sm" />
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1 gap-2"
            aria-label="Copy fingerprint data to clipboard"
          >
            <Icon icon={Copy} size="sm" />
            Copy JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Export with memo wrapper and displayName
export const FingerprintDetailPanel = memo(FingerprintDetailPanelComponent);
FingerprintDetailPanel.displayName = 'FingerprintDetailPanel';

/**
 * DetailField - Internal component for consistent field display
 */
interface DetailFieldProps {
  /** Field label */
  label: string;
  /** Field value to display */
  value: string;
  /** Use monospace font for technical data */
  mono?: boolean;
}

const DetailField = memo(function DetailField({ label, value, mono = false }: DetailFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={cn('text-sm', mono && 'font-mono')}>
        {value}
      </dd>
    </div>
  );
});

DetailField.displayName = 'DetailField';
