/**
 * GenericVPNCard Component
 * Displays generic VPN interface information (L2TP, PPTP, SSTP)
 * Story 0-4-4: Other VPN Type Viewer
 */

import type { VPNInterface } from '@nasnet/core/types';
import { Card, CardHeader, CardTitle, CardContent } from '@nasnet/ui/primitives';

import { StatusIndicator } from '../status-indicator';

export interface GenericVPNCardProps {
  /** VPN interface data */
  vpnInterface: VPNInterface;
  /** Optional click handler */
  onClick?: () => void;
}

/**
 * Generic VPN Card Component
 * Displays VPN interface name, type, status, and remote address
 * Supports L2TP, PPTP, and SSTP protocols
 *
 * @example
 * ```tsx
 * <GenericVPNCard vpnInterface={l2tpInterface} />
 * ```
 */
export function GenericVPNCard({ vpnInterface, onClick }: GenericVPNCardProps) {
  // Determine status for display
  const status = vpnInterface.disabled ? 'offline' : vpnInterface.running ? 'online' : 'warning';

  const statusLabel = vpnInterface.disabled
    ? 'Disabled'
    : vpnInterface.running
    ? 'Connected'
    : 'Disconnected';

  // Get protocol-specific label
  const protocolLabel = vpnInterface.type.toUpperCase();

  return (
    <Card 
      onClick={onClick} 
      className={`rounded-card-sm md:rounded-card-lg shadow-sm transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {vpnInterface.name}
            </CardTitle>
            <div className="mt-2 flex items-center gap-2">
              <StatusIndicator status={status} label={statusLabel} />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">
                {protocolLabel}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 pt-0">
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          <div className="flex justify-between items-start py-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Remote Server</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 text-right">
              {vpnInterface.connectTo || 'Not configured'}
            </span>
          </div>

          {vpnInterface.user && (
            <div className="flex justify-between items-center py-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Username</span>
              <span className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50">
                {vpnInterface.user}
              </span>
            </div>
          )}

          {vpnInterface.comment && (
            <div className="flex justify-between items-start py-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Comment</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 italic text-right max-w-xs">
                {vpnInterface.comment}
              </span>
            </div>
          )}

          {'verifyServerCertificate' in vpnInterface && vpnInterface.verifyServerCertificate !== undefined && (
            <div className="flex justify-between items-center py-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Verify Certificate</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {vpnInterface.verifyServerCertificate ? 'Yes' : 'No'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
