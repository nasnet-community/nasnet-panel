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
      <div
        className="bg-card rounded-card-sm animate-pulse p-4"
        role="status"
        aria-label="Loading VPN status"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-card-sm h-8 w-8" />
            <div className="space-y-1">
              <div className="bg-muted h-4 w-24 rounded" />
              <div className="bg-muted h-3 w-16 rounded" />
            </div>
          </div>
          <div className="bg-muted h-8 w-16 rounded" />
        </div>
        <span className="sr-only">Loading VPN status...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-card-sm border p-4 shadow-sm transition-all duration-300',
        isConnected ?
          'from-category-vpn/10 to-success/10 border-category-vpn/40 bg-gradient-to-r'
        : 'bg-card border-border'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'rounded-card-sm flex h-8 w-8 items-center justify-center',
              isConnected ? 'bg-category-vpn/20' : 'bg-muted'
            )}
          >
            {isConnected ?
              <Shield
                className="text-category-vpn h-4 w-4"
                aria-hidden="true"
              />
            : <ShieldOff
                className="text-muted-foreground h-4 w-4"
                aria-hidden="true"
              />
            }
          </div>
          <div>
            <p
              className={cn(
                'font-display font-medium',
                isConnected ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {isConnected ? t('status.protected') : t('status.disconnected')}
            </p>
            {isConnected && serverLocation ?
              <p className="text-category-vpn font-mono text-sm">
                {connectionName} • {serverLocation}
              </p>
            : <p className="text-muted-foreground text-sm">
                {isConnected ? connectionName : t('status.notConnected')}
              </p>
            }
          </div>
        </div>

        <button
          className={cn(
            'rounded-card-sm focus-visible:ring-ring min-h-[44px] px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            isConnected ?
              'bg-muted text-foreground hover:bg-muted/80'
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
