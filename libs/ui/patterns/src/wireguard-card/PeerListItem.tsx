/**
 * PeerListItem Component
 * Displays information about a single WireGuard peer
 */

import { memo } from 'react';
import type { WireGuardPeer } from '@nasnet/core/types';
import { formatLastHandshake } from '@nasnet/core/utils';
import { Badge, cn } from '@nasnet/ui/primitives';

export interface PeerListItemProps {
  peer: WireGuardPeer;
}

/**
 * Displays a single WireGuard peer with endpoint, allowed IPs, and last handshake
 */
function PeerListItemComponent({ peer }: PeerListItemProps) {
  // Format endpoint as IP:port
  const endpoint = peer.endpoint || `${peer.endpointAddress}:${peer.endpointPort}`;
  const displayEndpoint = endpoint || 'No endpoint';

  // Format allowed IPs
  const allowedIPs = peer.allowedAddress.length > 0 ? peer.allowedAddress.join(', ') : 'None';

  // Format last handshake time
  const lastHandshake = formatLastHandshake(peer.lastHandshake);

  return (
    <div
      className={cn(
        'rounded-card-sm flex flex-col gap-3 border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600'
      )}
    >
      {/* Public Key (truncated) */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Peer</span>
        <code className="rounded bg-slate-200 px-2 py-1 font-mono text-xs text-slate-900 dark:bg-slate-700 dark:text-slate-50">
          {peer.publicKey.substring(0, 16)}...
        </code>
      </div>

      {/* Endpoint */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">Endpoint</span>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          {displayEndpoint}
        </span>
      </div>

      {/* Allowed IPs */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">Allowed IPs</span>
        <div className="flex flex-wrap gap-1.5">
          {peer.allowedAddress.length > 0 ?
            peer.allowedAddress.map((ip: string, index: number) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300 rounded-full text-xs"
              >
                {ip}
              </Badge>
            ))
          : <span className="text-sm italic text-slate-500 dark:text-slate-400">None</span>}
        </div>
      </div>

      {/* Last Handshake */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-2 dark:border-slate-700">
        <span className="text-sm text-slate-600 dark:text-slate-400">Last Handshake</span>
        <span
          className={`text-sm font-semibold ${
            lastHandshake === 'Never' ? 'italic text-slate-500 dark:text-slate-400' : 'text-success'
          }`}
        >
          {lastHandshake}
        </span>
      </div>

      {/* Data Transfer (if available) */}
      {(peer.rx !== undefined || peer.tx !== undefined) && (
        <div className="flex items-center justify-between gap-4 pt-1 text-xs text-slate-600 dark:text-slate-400">
          {peer.rx !== undefined && (
            <span className="font-mono">⬇ {(peer.rx / 1024 / 1024).toFixed(2)} MB</span>
          )}
          {peer.tx !== undefined && (
            <span className="font-mono">⬆ {(peer.tx / 1024 / 1024).toFixed(2)} MB</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * PeerListItem - Memoized component for performance
 */
export const PeerListItem = memo(PeerListItemComponent);
PeerListItem.displayName = 'PeerListItem';
