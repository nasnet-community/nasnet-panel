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
      <div className="py-component-sm flex items-center justify-between">
        <div className="gap-component-sm flex items-center">
          <span
            className={cn('h-2 w-2 rounded-full', isEnabled ? 'bg-success' : 'bg-muted')}
            aria-hidden="true"
          />
          <Icon
            icon={getServiceIcon(service.name)}
            className="h-4 w-4"
            aria-hidden="true"
          />
          <span className={cn('text-xs', isEnabled ? 'text-foreground' : 'text-muted-foreground')}>
            {getServiceDescription(service.name)}
          </span>
        </div>
        <span className="font-mono text-xs">{service.port}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-component-md relative overflow-hidden rounded-md border transition-all',
        isEnabled ? 'border-success/20 bg-success/5' : 'border-border bg-muted/30'
      )}
    >
      {/* Status indicator dot */}
      <div className="absolute right-2 top-2">
        <span
          className={cn(
            'inline-block h-2 w-2 rounded-full',
            isEnabled ? 'bg-success shadow-success/50 shadow-sm' : 'bg-muted'
          )}
          aria-hidden="true"
        />
      </div>

      {/* Icon and name */}
      <div className="gap-component-md flex items-start">
        <Icon
          icon={getServiceIcon(service.name)}
          className="h-6 w-6"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate font-medium',
              isEnabled ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {getServiceDescription(service.name)}
          </p>
          <p className="text-muted-foreground text-sm">
            Port <span className="font-mono">{service.port}</span>
          </p>
        </div>
      </div>

      {/* Address restriction if set */}
      {service.address && (
        <div className="mt-component-sm pt-component-sm border-border border-t">
          <p className="text-muted-foreground text-xs">
            Allowed: <span className="font-mono">{service.address}</span>
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
        <div className={cn('bg-card border-border p-component-md rounded-md border', className)}>
          <div className="space-y-component-sm animate-pulse">
            <div className="bg-muted h-4 w-24 rounded" />
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-muted h-6 rounded"
              />
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className={className}>
        <div className="px-component-sm mb-component-md">
          <h2 className="text-lg font-semibold">Router Services</h2>
          <p className="text-muted-foreground text-sm">Network services and their status</p>
        </div>
        <div className="gap-component-sm grid grid-cols-2 md:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-muted h-24 animate-pulse rounded-md"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('p-component-md border-error/50 bg-error/5 rounded-md border', className)}>
        <p className="text-error text-sm font-medium">Unable to load services</p>
        <p className="text-error/80 mt-component-sm text-xs">
          {error.message || 'Please try again or contact support.'}
        </p>
      </div>
    );
  }

  // Empty state
  if (!services || services.length === 0) {
    return (
      <div
        className={cn(
          'p-component-lg border-border bg-muted/30 rounded-md border text-center',
          className
        )}
      >
        <Icon
          icon={WifiOff}
          className="text-muted-foreground mb-component-sm mx-auto h-8 w-8"
          aria-hidden="true"
        />
        <p className="text-foreground mb-component-sm text-sm font-medium">No services found</p>
        <p className="text-muted-foreground text-xs">Router services could not be retrieved.</p>
      </div>
    );
  }

  // Count enabled/disabled services
  const enabledCount = services.filter((s) => !s.disabled).length;
  const totalCount = services.length;

  // Compact mode for sidebar
  if (compact) {
    return (
      <div className={cn('bg-card border-border p-component-md rounded-md border', className)}>
        <div className="mb-component-sm flex items-center justify-between">
          <h3 className="text-foreground text-sm font-semibold">Services</h3>
          <span className="text-muted-foreground text-xs">
            <span className="text-success font-medium">{enabledCount}</span>/{totalCount}
          </span>
        </div>
        <div className="space-y-component-xs">
          {services.slice(0, 6).map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              compact
            />
          ))}
          {services.length > 6 && (
            <p className="text-muted-foreground pt-component-sm text-center text-xs">
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
      <div className="px-component-sm mb-component-md flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Router Services</h2>
          <p className="text-muted-foreground text-sm">Network services and their status</p>
        </div>
        <div className="text-muted-foreground text-sm">
          <span className="text-success font-medium">{enabledCount}</span> / {totalCount} enabled
        </div>
      </div>

      {/* Services grid */}
      <div className="gap-component-sm grid grid-cols-2 md:grid-cols-4">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
          />
        ))}
      </div>
    </div>
  );
});
ServicesStatus.displayName = 'ServicesStatus';
