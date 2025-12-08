/**
 * WireGuard Card Component
 * Displays WireGuard interface with name, status, port, public key, and peer count
 * Expandable to show peer details with Framer Motion animation
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  useToast,
  Skeleton,
} from '@nasnet/ui/primitives';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { StatusIndicator } from '../status-indicator';
import { formatPublicKey, formatBytes, formatLastHandshake } from '@nasnet/core/utils';
import { useWireGuardPeers } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import { PeerListItem } from './PeerListItem';
import type { WireGuardInterface } from '@nasnet/core/types';

/**
 * WireGuardCard Props
 */
export interface WireGuardCardProps {
  /** WireGuard interface data */
  interface: WireGuardInterface;
  /** Peer count for this interface */
  peerCount?: number;
  /** Optional click handler for card interaction */
  onClick?: () => void;
}

/**
 * WireGuardCard Component
 * Shows WireGuard interface name, listening port, status, public key with copy button, and peer count
 * Expandable to show peer details
 */
export function WireGuardCard({
  interface: wgInterface,
  peerCount = 0,
  onClick,
}: WireGuardCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  // Fetch peers when expanded (lazy loading)
  const { data: peers, isLoading: isLoadingPeers, isError: isPeersError } = useWireGuardPeers(
    routerIp,
    isExpanded ? wgInterface.name : undefined
  );

  /**
   * Handle copy public key to clipboard
   */
  const handleCopyPublicKey = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click if card has onClick

    try {
      await navigator.clipboard.writeText(wgInterface.publicKey);

      // Show success state
      setCopied(true);
      toast({
        title: 'Public key copied',
        description: 'The full public key has been copied to clipboard',
      });

      // Reset after 1 second
      setTimeout(() => setCopied(false), 1000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy public key to clipboard',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handle toggle expansion
   */
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click if card has onClick
    setIsExpanded(!isExpanded);
  };

  // Determine status for display
  const status = wgInterface.disabled
    ? 'offline'
    : wgInterface.running
    ? 'online'
    : 'warning';

  const statusLabel = wgInterface.disabled
    ? 'Disabled'
    : wgInterface.running
    ? 'Active'
    : 'Inactive';

  return (
    <Card className="rounded-card-sm md:rounded-card-lg shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {wgInterface.name}
            </CardTitle>
            <StatusIndicator status={status} label={statusLabel} className="mt-2" />
          </div>
          <div className="flex items-center gap-2">
            {peerCount > 0 && (
              <Badge 
                variant="secondary"
                className="rounded-full bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300"
              >
                {peerCount} {peerCount === 1 ? 'peer' : 'peers'}
              </Badge>
            )}
            {/* Chevron indicator for expandable state */}
            {peerCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleExpand}
                className="p-1 h-8 w-8 rounded-button hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronDown
                  className={`h-5 w-5 transition-transform duration-200 text-slate-500 dark:text-slate-400 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-0 divide-y divide-slate-200 dark:divide-slate-700">
          <div className="flex justify-between items-center py-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Port</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{wgInterface.listenPort}</span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">MTU</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{wgInterface.mtu}</span>
          </div>
        </div>

        {/* Connection Stats */}
        {(wgInterface.rx !== undefined || wgInterface.tx !== undefined || wgInterface.lastHandshake) && (
          <div className="pt-4 space-y-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Connection Stats
            </div>
            <div className="space-y-0 divide-y divide-slate-200 dark:divide-slate-700">
              {wgInterface.rx !== undefined && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Received</span>
                  <span className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50">
                    {formatBytes(wgInterface.rx)}
                  </span>
                </div>
              )}
              {wgInterface.tx !== undefined && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Transmitted</span>
                  <span className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50">
                    {formatBytes(wgInterface.tx)}
                  </span>
                </div>
              )}
              {wgInterface.lastHandshake && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Last Handshake</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {formatLastHandshake(wgInterface.lastHandshake)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Public Key with Copy Button */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-2">Public Key</span>
              <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-button block truncate text-slate-900 dark:text-slate-50">
                {formatPublicKey(wgInterface.publicKey)}
              </code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPublicKey}
              className="flex-shrink-0 rounded-button"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-success" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Animated Peers Section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Connected Peers
                </h4>

                {/* Loading state */}
                {isLoadingPeers && (
                  <div className="space-y-3">
                    <Skeleton className="h-32 w-full rounded-card-sm" />
                    <Skeleton className="h-32 w-full rounded-card-sm" />
                  </div>
                )}

                {/* Error state */}
                {isPeersError && (
                  <div className="text-sm text-error bg-error/10 px-4 py-3 rounded-card-sm">
                    Failed to load peers for this interface
                  </div>
                )}

                {/* Peers list */}
                {!isLoadingPeers && !isPeersError && peers && peers.length > 0 && (
                  <div className="space-y-3">
                    {peers.map((peer) => (
                      <PeerListItem key={peer.id} peer={peer} />
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {!isLoadingPeers && !isPeersError && peers && peers.length === 0 && (
                  <div className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-card-sm">
                    No peers configured for this interface
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
