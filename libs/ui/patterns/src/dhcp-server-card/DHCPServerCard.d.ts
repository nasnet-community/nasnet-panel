/**
 * DHCP Server Configuration Card Component
 * Displays DHCP server configuration including pool range and lease time
 *
 * Epic 0.5: DHCP Management - Story 0.5.1
 */
import * as React from 'react';
import type { DHCPServer, DHCPPool } from '@nasnet/core/types';
export interface DHCPServerCardProps {
    /** DHCP server configuration */
    server: DHCPServer;
    /** Address pool referenced by the server */
    pool?: DHCPPool;
    /** Additional CSS classes */
    className?: string;
}
export declare const DHCPServerCard: React.MemoExoticComponent<React.ForwardRefExoticComponent<DHCPServerCardProps & React.RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=DHCPServerCard.d.ts.map