/**
 * PeerListItem Component
 * Displays information about a single WireGuard peer
 */

import { Badge } from '@nasnet/ui/primitives';
import { formatLastHandshake } from '@nasnet/core/utils';
import type { WireGuardPeer } from '@nasnet/core/types';

export interface PeerListItemProps {
  peer: WireGuardPeer;
}

/**
 * Displays a single WireGuard peer with endpoint, allowed IPs, and last handshake
 */
export function PeerListItem({ peer }: PeerListItemProps) {
  // Format endpoint as IP:port
  const endpoint = peer.endpoint || `${peer.endpointAddress}:${peer.endpointPort}`;
  const displayEndpoint = endpoint || 'No endpoint';

  // Format allowed IPs
  const allowedIPs = peer.allowedAddress.length > 0
    ? peer.allowedAddress.join(', ')
    : 'None';

  // Format last handshake time
  const lastHandshake = formatLastHandshake(peer.lastHandshake);

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-card-sm border border-slate-200 dark:border-slate-700 transition-colors hover:border-slate-300 dark:hover:border-slate-600">
      {/* Public Key (truncated) */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Peer
        </span>
        <code className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-900 dark:text-slate-50">
          {peer.publicKey.substring(0, 16)}...
        </code>
      </div>

      {/* Endpoint */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Endpoint
        </span>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          {displayEndpoint}
        </span>
      </div>

      {/* Allowed IPs */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Allowed IPs
        </span>
        <div className="flex flex-wrap gap-1.5">
          {peer.allowedAddress.length > 0 ? (
            peer.allowedAddress.map((ip: string, index: number) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs rounded-full bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300"
              >
                {ip}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-slate-500 dark:text-slate-400 italic">
              None
            </span>
          )}
        </div>
      </div>

      {/* Last Handshake */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Last Handshake
        </span>
        <span className={`text-sm font-semibold ${
          lastHandshake === 'Never'
            ? 'text-slate-500 dark:text-slate-400 italic'
            : 'text-success'
        }`}>
          {lastHandshake}
        </span>
      </div>

      {/* Data Transfer (if available) */}
      {(peer.rx !== undefined || peer.tx !== undefined) && (
        <div className="flex items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
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
