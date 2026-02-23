/**
 * DHCP Client Status Card Component
 * Displays DHCP client status for WAN interfaces
 *
 * Epic 0.5: DHCP Management - Story 0.5.3
 */
import * as React from 'react';
import type { DHCPClient } from '@nasnet/core/types';
export interface DHCPClientCardProps {
    /** DHCP client configuration and status */
    client: DHCPClient;
    /** Additional CSS classes */
    className?: string;
}
export declare const DHCPClientCard: React.MemoExoticComponent<React.ForwardRefExoticComponent<DHCPClientCardProps & React.RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=DHCPClientCard.d.ts.map