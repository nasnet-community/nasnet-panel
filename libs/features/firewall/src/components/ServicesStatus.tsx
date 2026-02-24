/**
 * Services Status Component
 * @description Displays router services with status indicators, port numbers, and address restrictions.
 * Supports compact mode for sidebar and full mode for main panels.
 *
 * @example
 * <ServicesStatus />
 * <ServicesStatus compact />
 *
 * Epic 0.6 Enhancement: Services Status Panel
 */

import { memo, useCallback } from 'react';
import { WifiOff, Plug, Lock, FileText, Terminal, Grid, Globe, LockKeyhole } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import { useServices } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import type { RouterService } from '@nasnet/core/types';

/**
 * Service icon mapping
 */
function getServiceIcon(name: string): LucideIcon {
  const icons: Record<string, LucideIcon> = {
    api: Plug,
    'api-ssl': Lock,
    ftp: FileText,
    ssh: Terminal,
    telnet: Terminal,
    winbox: Grid,
    www: Globe,
    'www-ssl': LockKeyhole,
  };
  return icons[name] || Plug;
}

/**
 * Service description mapping
 */
function getServiceDescription(name: string): string {
  const descriptions: Record<string, string> = {
    api: 'RouterOS API',
    'api-ssl': 'RouterOS API (SSL)',
    ftp: 'File Transfer',
    ssh: 'Secure Shell',
    telnet: 'Telnet Access',
    winbox: 'Winbox Management',
    www: 'Web Interface',
    'www-ssl': 'Web Interface (SSL)',
  };
  return descriptions[name] || name;
}

/**
 * Individual service card component
 * @internal
 */
const ServiceCard = memo(function ServiceCard({
  service,
  compact,
}: {
  service: RouterService;
  compact?: boolean;
}) {
  const isEnabled = !service.disabled;

  if (compact) {
    return (
      <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              isEnabled ? 'bg-success' : 'bg-muted'
            )}
            aria-hidden="true"
          />
          <Icon
            icon={getServiceIcon(service.name)}
            className="w-4 h-4"
            aria-hidden="true"
          />
          <span
            className={cn(
              'text-xs',
              isEnabled
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
          >
            {getServiceDescription(service.name)}
          </span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{service.port}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--semantic-radius-card)] border p-component-md transition-all',
        isEnabled
          ? 'border-success/20 bg-success/5'
          : 'border-border bg-muted/30'
      )}
    >
      {/* Status indicator dot */}
      <div className="absolute right-3 top-3">
        <span
          className={cn(
            'inline-block h-2 w-2 rounded-full',
            isEnabled
              ? 'bg-success shadow-sm shadow-success/50'
              : 'bg-muted dark:bg-muted'
          )}
          aria-hidden="true"
        />
      </div>

      {/* Icon and name */}
      <div className="flex items-start gap-3">
        <Icon
          icon={getServiceIcon(service.name)}
          className="w-6 h-6"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'font-medium truncate',
              isEnabled
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
          >
            {getServiceDescription(service.name)}
          </p>
          <p className="text-sm text-muted-foreground">
            Port{' '}
            <span className="font-mono">
              {service.port}
            </span>
          </p>
        </div>
      </div>

      {/* Address restriction if set */}
      {service.address && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Allowed:{' '}
            <span className="font-mono">
              {service.address}
            </span>
          </p>
        </div>
      )}
    </div>
  );
});
ServiceCard.displayName = 'ServiceCard';

export interface ServicesStatusProps {
  /** CSS classes to apply to root element */
  className?: string;
  /** Compact mode for sidebar display (vertical list) */
  compact?: boolean;
}

/**
 * ServicesStatus Component
 *
 * Features:
 * - Displays all router services in a responsive grid layout
 * - Color-coded status with semantic tokens (success/muted)
 * - Shows port numbers and address restrictions
 * - Auto-refresh with 5-minute cache via Apollo
 * - Professional error and empty states
 * - Loading skeleton matching final layout
 *
 * @param props - Component props
 * @returns Services status grid component
 */
export const ServicesStatus = memo(function ServicesStatus({
  className,
  compact,
}: ServicesStatusProps) {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: services, isLoading, error } = useServices(routerIp);

  // Loading state
  if (isLoading) {
    if (compact) {
      return (
        <div className={cn(
          'bg-card rounded-xl border border-border p-4',
          className
        )}>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-24" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 bg-muted rounded" />
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className={className}>
        <div className="px-2 mb-4">
          <h2 className="text-lg font-semibold">Router Services</h2>
          <p className="text-sm text-muted-foreground">
            Network services and their status
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse bg-muted rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('p-4 rounded-xl border border-destructive/50 bg-destructive/5', className)}>
        <p className="text-sm text-destructive font-medium">Unable to load services</p>
        <p className="text-xs text-destructive/80 mt-1">
          {error.message || 'Please try again or contact support.'}
        </p>
      </div>
    );
  }

  // Empty state
  if (!services || services.length === 0) {
    return (
      <div className={cn(
        'p-8 rounded-xl border border-border bg-muted/30 text-center',
        className
      )}>
        <Icon
          icon={WifiOff}
          className="w-8 h-8 text-muted-foreground mx-auto mb-2"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-foreground mb-1">
          No services found
        </p>
        <p className="text-xs text-muted-foreground">
          Router services could not be retrieved.
        </p>
      </div>
    );
  }

  // Count enabled/disabled services
  const enabledCount = services.filter((s) => !s.disabled).length;
  const totalCount = services.length;

  // Compact mode for sidebar
  if (compact) {
    return (
      <div className={cn(
        'bg-card rounded-xl border border-border p-4',
        className
      )}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            Services
          </h3>
          <span className="text-xs text-muted-foreground">
            <span className="text-success font-medium">{enabledCount}</span>/{totalCount}
          </span>
        </div>
        <div className="space-y-1">
          {services.slice(0, 6).map((service) => (
            <ServiceCard key={service.id} service={service} compact />
          ))}
          {services.length > 6 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              +{services.length - 6} more
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Section header */}
      <div className="px-2 mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Router Services</h2>
          <p className="text-sm text-muted-foreground">
            Network services and their status
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="text-success font-medium">
            {enabledCount}
          </span>{' '}
          / {totalCount} enabled
        </div>
      </div>

      {/* Services grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
});
ServicesStatus.displayName = 'ServicesStatus';


