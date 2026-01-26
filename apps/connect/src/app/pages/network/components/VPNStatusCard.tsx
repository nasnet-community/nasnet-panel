/**
 * VPN Status Card Component
 * Dashboard Pro style - Gradient-bordered VPN status
 */

import { Shield, ShieldOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VPNStatusCardProps {
  isConnected?: boolean;
  connectionName?: string;
  serverLocation?: string;
  isLoading?: boolean;
}

export function VPNStatusCard({
  isConnected = false,
  connectionName = 'VPN',
  serverLocation,
  isLoading,
}: VPNStatusCardProps) {
  if (isLoading) {
    return (
      <div className="bg-slate-900 rounded-xl p-4 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-700 rounded-lg" />
            <div className="space-y-1">
              <div className="h-4 bg-slate-700 rounded w-24" />
              <div className="h-3 bg-slate-800 rounded w-16" />
            </div>
          </div>
          <div className="h-8 bg-slate-700 rounded w-16" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl p-4 border transition-all duration-300',
        isConnected
          ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30'
          : 'bg-slate-900 border-slate-800'
      )}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              isConnected ? 'bg-emerald-500/20' : 'bg-slate-800'
            )}
          >
            {isConnected ? (
              <Shield className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldOff className="w-4 h-4 text-slate-500" />
            )}
          </div>
          <div>
            <p className={cn('font-medium', isConnected ? 'text-white' : 'text-slate-400')}>
              {isConnected ? 'VPN Protected' : 'VPN Disconnected'}
            </p>
            {isConnected && serverLocation ? (
              <p className="text-emerald-400 text-sm">{connectionName} • {serverLocation}</p>
            ) : (
              <p className="text-slate-500 text-sm">
                {isConnected ? connectionName : 'Not connected'}
              </p>
            )}
          </div>
        </div>

        <button
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            isConnected
              ? 'bg-slate-800 text-white hover:bg-slate-700'
              : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400'
          )}
        >
          {isConnected ? 'Manage' : 'Connect'}
        </button>
      </div>
    </div>
  );
}


























