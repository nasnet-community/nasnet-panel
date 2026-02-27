/**
 * VPN Status Card Component
 * Dashboard Pro style - Gradient-bordered VPN status
 */

import React from 'react';

import { Shield, ShieldOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@nasnet/ui/utils';

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
  const { t } = useTranslation('vpn');
  if (isLoading) {
    return (
      <div className="bg-card rounded-card-sm p-4 animate-pulse" role="status" aria-label="Loading VPN status">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted rounded-card-sm" />
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
        'rounded-card-sm p-4 border transition-all duration-300 shadow-sm',
        isConnected
          ? 'bg-gradient-to-r from-category-vpn/10 to-success/10 border-category-vpn/40'
          : 'bg-card border-border'
      )}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-card-sm flex items-center justify-center',
              isConnected ? 'bg-category-vpn/20' : 'bg-muted'
            )}
          >
            {isConnected ? (
              <Shield className="w-4 h-4 text-category-vpn" aria-hidden="true" />
            ) : (
              <ShieldOff className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <div>
            <p className={cn('font-display font-medium', isConnected ? 'text-foreground' : 'text-muted-foreground')}>
              {isConnected ? t('status.protected') : t('status.disconnected')}
            </p>
            {isConnected && serverLocation ? (
              <p className="text-category-vpn text-sm font-mono">{connectionName} • {serverLocation}</p>
            ) : (
              <p className="text-muted-foreground text-sm">
                {isConnected ? connectionName : t('status.notConnected')}
              </p>
            )}
          </div>
        </div>

        <button
          className={cn(
            'px-4 py-2 rounded-card-sm text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            isConnected
              ? 'bg-muted text-foreground hover:bg-muted/80'
              : 'bg-success text-foreground hover:bg-success/90'
          )}
          aria-label={isConnected ? t('clients.manage') : t('clients.connect')}
        >
          {isConnected ? t('clients.manage') : t('clients.connect')}
        </button>
      </div>
    </div>
  );
});

VPNStatusCard.displayName = 'VPNStatusCard';
