/**
 * VPN Card Enhanced Component
 *
 * Quick VPN toggle with status display for dashboard.
 * Based on UX Design Specification - Direction 1: Clean Minimal.
 *
 * @example
 * ```tsx
 * <VPNCardEnhanced
 *   status="connected"
 *   profile={{ name: 'Office VPN', location: 'Frankfurt' }}
 *   onToggle={(enabled) => handleToggle(enabled)}
 * />
 * ```
 */

import { memo, useCallback } from 'react';
import { Loader2, Shield } from 'lucide-react';

import { cn } from '@nasnet/ui/utils';
import { Card, CardContent, Switch, Icon } from '@nasnet/ui/primitives';

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
function VPNCardEnhancedComponent({
  status,
  profile,
  onToggle,
  className = '',
  disabled = false,
}: VPNCardEnhancedProps) {
  const config = getStatusConfig(status);
  const isLoading = status === 'connecting';

  const handleToggle = useCallback((checked: boolean) => {
    if (!disabled && !isLoading) {
      onToggle(checked);
    }
  }, [disabled, isLoading, onToggle]);

  return (
    <Card className={cn('bg-card border border-border rounded-[var(--semantic-radius-card)] shadow-[var(--semantic-shadow-card)]', className)} aria-label={`VPN status: ${config.label}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon and Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('h-10 w-10 rounded-[var(--semantic-radius-button)] flex items-center justify-center flex-shrink-0', config.bgColor)}>
              {isLoading ? (
                <Icon icon={Loader2} className={cn('h-5 w-5 animate-spin', config.color)} />
              ) : (
                <Icon icon={Shield} className={cn('h-5 w-5', config.color)} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">VPN</p>
                {status === 'connected' && (
                  <span
                    className="h-2 w-2 rounded-full bg-success flex-shrink-0"
                    aria-label="Connected indicator"
                  />
                )}
              </div>
              {profile ? (
                <p className="text-sm text-muted-foreground truncate">
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

export const VPNCardEnhanced = memo(VPNCardEnhancedComponent);
VPNCardEnhanced.displayName = 'VPNCardEnhanced';
















