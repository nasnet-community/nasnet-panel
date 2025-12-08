/**
 * Services Status Component
 * Displays router services (API, SSH, Winbox, WWW, etc.) with status indicators
 * Epic 0.6 Enhancement: Services Status Panel
 */

import { useServices } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import type { RouterService } from '@nasnet/core/types';

/**
 * Service icon mapping
 */
function getServiceIcon(name: string): string {
  const icons: Record<string, string> = {
    api: '🔌',
    'api-ssl': '🔐',
    ftp: '📁',
    ssh: '💻',
    telnet: '📟',
    winbox: '🪟',
    www: '🌐',
    'www-ssl': '🔒',
  };
  return icons[name] || '⚙️';
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
 */
function ServiceCard({ service, compact }: { service: RouterService; compact?: boolean }) {
  const isEnabled = !service.disabled;

  if (compact) {
    return (
      <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isEnabled ? 'bg-green-500' : 'bg-slate-400'
            }`}
          />
          <span className="text-sm">{getServiceIcon(service.name)}</span>
          <span
            className={`text-xs ${
              isEnabled ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'
            }`}
          >
            {getServiceDescription(service.name)}
          </span>
        </div>
        <span className="text-xs font-mono text-slate-500">{service.port}</span>
      </div>
    );
  }

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border p-4 transition-all
        ${
          isEnabled
            ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
            : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'
        }
      `}
    >
      {/* Status indicator dot */}
      <div className="absolute right-3 top-3">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            isEnabled
              ? 'bg-green-500 shadow-sm shadow-green-500/50'
              : 'bg-slate-400 dark:bg-slate-500'
          }`}
        />
      </div>

      {/* Icon and name */}
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getServiceIcon(service.name)}</span>
        <div className="flex-1 min-w-0">
          <p
            className={`font-medium truncate ${
              isEnabled
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {getServiceDescription(service.name)}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Port{' '}
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {service.port}
            </span>
          </p>
        </div>
      </div>

      {/* Address restriction if set */}
      {service.address && (
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Allowed:{' '}
            <span className="font-mono text-slate-600 dark:text-slate-300">
              {service.address}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export interface ServicesStatusProps {
  className?: string;
  /** Compact mode for sidebar display */
  compact?: boolean;
}

/**
 * ServicesStatus Component
 *
 * Features:
 * - Displays all router services in a grid layout
 * - Color-coded status (enabled = green, disabled = muted)
 * - Shows port numbers and address restrictions
 * - Auto-refresh with 5-minute cache
 *
 * @param props - Component props
 * @returns Services status grid component
 */
export function ServicesStatus({ className, compact }: ServicesStatusProps) {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: services, isLoading, error } = useServices(routerIp);

  // Loading state
  if (isLoading) {
    if (compact) {
      return (
        <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 ${className || ''}`}>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 bg-slate-200 dark:bg-slate-700 rounded" />
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
              className="h-24 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-4 text-red-600 dark:text-red-400 ${className || ''}`}>
        Error loading services: {error.message}
      </div>
    );
  }

  // Empty state
  if (!services || services.length === 0) {
    return (
      <div
        className={`p-8 text-center text-slate-500 dark:text-slate-400 ${className || ''}`}
      >
        No services found
      </div>
    );
  }

  // Count enabled/disabled services
  const enabledCount = services.filter((s) => !s.disabled).length;
  const totalCount = services.length;

  // Compact mode for sidebar
  if (compact) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 ${className || ''}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Services
          </h3>
          <span className="text-xs text-slate-500">
            <span className="text-green-600 dark:text-green-400 font-medium">{enabledCount}</span>/{totalCount}
          </span>
        </div>
        <div className="space-y-1">
          {services.slice(0, 6).map((service) => (
            <ServiceCard key={service.id} service={service} compact />
          ))}
          {services.length > 6 && (
            <p className="text-xs text-slate-400 text-center pt-1">
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
        <div className="text-sm text-slate-500 dark:text-slate-400">
          <span className="text-green-600 dark:text-green-400 font-medium">
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
}


