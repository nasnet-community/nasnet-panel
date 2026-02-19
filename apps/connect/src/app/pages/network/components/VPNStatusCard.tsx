/**
 * VPN Status Card Component
 * Dashboard Pro style - Gradient-bordered VPN status
 */

import React from 'react';

import { Shield, ShieldOff } from 'lucide-react';

import { cn } from '@/lib/utils';

interface VPNStatusCardProps {
  isConnected?: boolean;
  connectionName?: string;
  serverLocation?: string;
  isLoading?: boolean;
}

export const VPNStatusCard = React.memo(function VPNStatusCard({
  isConnected = false,
  connectionName = 'VPN',
  serverLocation,
  isLoading,
}: VPNStatusCardProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-4 animate-pulse" role="status" aria-label="Loading VPN status">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted rounded-lg" />
            <div className="space-y-1">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
          </div>
          <div className="h-8 bg-muted rounded w-16" />
        </div>
        <span className="sr-only">Loading VPN status...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl p-4 border transition-all duration-300',
        isConnected
          ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30'
          : 'bg-card border-border'
      )}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              isConnected ? 'bg-emerald-500/20' : 'bg-muted'
            )}
          >
            {isConnected ? (
              <Shield className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            ) : (
              <ShieldOff className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <div>
            <p className={cn('font-medium', isConnected ? 'text-foreground' : 'text-muted-foreground')}>
              {isConnected ? 'VPN Protected' : 'VPN Disconnected'}
            </p>
            {isConnected && serverLocation ? (
              <p className="text-emerald-400 text-sm">{connectionName} • {serverLocation}</p>
            ) : (
              <p className="text-muted-foreground text-sm">
                {isConnected ? connectionName : 'Not connected'}
              </p>
            )}
          </div>
        </div>

        <button
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            isConnected
              ? 'bg-muted text-foreground hover:bg-muted/80'
              : 'bg-emerald-500 text-foreground hover:bg-emerald-400'
          )}
          aria-label={isConnected ? 'Manage VPN connection' : 'Connect to VPN'}
        >
          {isConnected ? 'Manage' : 'Connect'}
        </button>
      </div>
    </div>
  );
});

VPNStatusCard.displayName = 'VPNStatusCard';
