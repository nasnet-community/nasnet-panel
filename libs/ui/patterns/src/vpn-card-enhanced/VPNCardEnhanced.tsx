/**
 * VPN Card Enhanced Component
 * Quick VPN toggle with status display for dashboard
 * Based on UX Design Specification - Direction 1: Clean Minimal
 */

import * as React from 'react';
import { Card, CardContent, Switch } from '@nasnet/ui/primitives';
import { Shield, Loader2 } from 'lucide-react';

/**
 * VPN connection status
 */
export type VPNStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * VPN profile information
 */
export interface VPNProfile {
  /** Profile/connection name */
  name: string;
  /** Server location */
  location?: string;
  /** Optional country flag emoji */
  flag?: string;
}

/**
 * VPNCardEnhanced Props
 */
export interface VPNCardEnhancedProps {
  /** Current VPN connection status */
  status: VPNStatus;
  /** VPN profile information */
  profile?: VPNProfile;
  /** Toggle handler */
  onToggle: (enabled: boolean) => void;
  /** Custom className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Get status configuration
 */
function getStatusConfig(status: VPNStatus) {
  switch (status) {
    case 'connected':
      return {
        color: 'text-success',
        bgColor: 'bg-success/10 dark:bg-success/20',
        label: 'Connected',
        checked: true,
      };
    case 'connecting':
      return {
        color: 'text-warning',
        bgColor: 'bg-warning/10 dark:bg-warning/20',
        label: 'Connecting...',
        checked: true,
      };
    case 'disconnected':
      return {
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        label: 'Disconnected',
        checked: false,
      };
    case 'error':
      return {
        color: 'text-error',
        bgColor: 'bg-error/10 dark:bg-error/20',
        label: 'Connection Failed',
        checked: false,
      };
  }
}

/**
 * VPNCardEnhanced Component
 * Displays VPN status with toggle switch
 * Shows connection status, profile info, and allows quick connect/disconnect
 */
export function VPNCardEnhanced({
  status,
  profile,
  onToggle,
  className = '',
  disabled = false,
}: VPNCardEnhancedProps) {
  const config = getStatusConfig(status);
  const isLoading = status === 'connecting';

  const handleToggle = (checked: boolean) => {
    if (!disabled && !isLoading) {
      onToggle(checked);
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          {/* Left: Icon and Info */}
          <div className="flex items-center gap-4">
            <div
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                ${config.bgColor}
              `}
            >
              {isLoading ? (
                <Loader2 className={`w-5 h-5 ${config.color} animate-spin`} />
              ) : (
                <Shield className={`w-5 h-5 ${config.color}`} aria-hidden="true" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">VPN</p>
                {status === 'connected' && (
                  <span
                    className="w-2 h-2 rounded-full bg-success animate-pulse-glow"
                    aria-label="Connected indicator"
                  />
                )}
              </div>
              {profile ? (
                <p className="text-sm text-muted-foreground">
                  {profile.flag && <span className="mr-1">{profile.flag}</span>}
                  {profile.name}
                  {profile.location && ` - ${profile.location}`}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{config.label}</p>
              )}
            </div>
          </div>

          {/* Right: Toggle Switch */}
          <Switch
            checked={config.checked}
            onCheckedChange={handleToggle}
            disabled={disabled || isLoading}
            aria-label={`VPN ${config.checked ? 'enabled' : 'disabled'}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}








