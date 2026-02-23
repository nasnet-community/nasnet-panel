/**
 * FingerprintDetailPanel Component
 *
 * Displays detailed fingerprint information for a DHCP lease.
 * Part of NAS-6.13 DHCP Fingerprinting feature.
 *
 * @module @nasnet/features/network/dhcp/components/fingerprint-detail-panel
 */
import type { DHCPLeaseWithOptions, DeviceIdentification } from '@nasnet/core/types';
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
declare function FingerprintDetailPanelComponent({ lease, identification, onEdit, onCopy, className, }: FingerprintDetailPanelProps): import("react/jsx-runtime").JSX.Element;
export declare const FingerprintDetailPanel: import("react").MemoExoticComponent<typeof FingerprintDetailPanelComponent>;
export {};
//# sourceMappingURL=fingerprint-detail-panel.d.ts.map