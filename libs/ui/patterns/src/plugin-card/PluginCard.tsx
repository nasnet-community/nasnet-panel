/**
 * PluginCard Component
 * Displays plugin information with advanced features including status, stats, and logs
 * Follows NasNetConnect UX Design Direction patterns
 */

import { memo, useCallback, useState } from 'react';

import {
  Download,
  Trash2,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { formatBytes } from '@nasnet/core/utils';
import {
  Card,
  CardContent,
  Button,
  cn,
} from '@nasnet/ui/primitives';

export type PluginStatus = 'available' | 'installed' | 'running' | 'error';

export interface PluginStats {
  connections: number;
  bytesIn: number;
  bytesOut: number;
  peersConnected: number;
}

export interface PluginLog {
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  version: string;
  status: PluginStatus;
  stats?: PluginStats;
  logs?: PluginLog[];
  features: string[];
}

export interface PluginCardProps {
  plugin: Plugin;
  onInstall?: (pluginId: string) => void;
  onUninstall?: (pluginId: string) => void;
  onConfigure?: (pluginId: string) => void;
}

/**
 * Plugin Card Component
 * Displays plugin information with status, stats, logs, and action buttons
 * Follows Direction 2 "Card-Heavy Dashboard" and Direction 3 "Dashboard Pro" patterns
 */
function PluginCardComponent({
  plugin,
  onInstall,
  onUninstall,
  onConfigure,
}: PluginCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = plugin.icon;

  const isRunning = plugin.status === 'running';
  const isInstalled = plugin.status === 'installed' || isRunning;
  const showStats = isRunning && plugin.stats;
  const showLogs = isInstalled && plugin.logs && plugin.logs.length > 0;

  // Format timestamp
  const formatTimestamp = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }, []);

  // Memoized handlers
  const handleInstall = useCallback(() => {
    onInstall?.(plugin.id);
  }, [onInstall, plugin.id]);

  const handleConfigure = useCallback(() => {
    onConfigure?.(plugin.id);
  }, [onConfigure, plugin.id]);

  const handleUninstall = useCallback(() => {
    onUninstall?.(plugin.id);
  }, [onUninstall, plugin.id]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Log type colors - using semantic tokens from design system
  const logTypeColors = {
    info: 'text-info',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
  };

  return (
    <Card
      className={cn(
        'bg-card border border-border rounded-[var(--semantic-radius-card)]',
        'shadow-[var(--semantic-shadow-card)]',
        'hover:shadow-lg cursor-pointer',
        'transition-shadow duration-200',
        // Running state uses success semantic color
        isRunning && 'border-success/50'
      )}
    >
      <CardContent className="p-4 md:p-6">
        {/* Header: Icon + Name + Status */}
        <div className="flex items-start gap-4 mb-4">
          {/* Plugin Icon Container */}
          <div className={cn('flex-shrink-0 h-10 w-10 rounded-lg bg-muted flex items-center justify-center')}>
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Title and Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className={cn('text-base font-semibold text-foreground truncate')}>
                {plugin.name}
              </h3>
              {/* Status Indicator */}
              <div
                className="flex items-center gap-2"
                role="status"
                aria-live="polite"
                aria-label={`Plugin status: ${plugin.status}`}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    plugin.status === 'running' && 'bg-success animate-pulse',
                    plugin.status === 'installed' && 'bg-info',
                    plugin.status === 'available' && 'bg-muted-foreground',
                    plugin.status === 'error' && 'bg-error'
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'text-xs font-medium',
                    plugin.status === 'running' && 'text-success',
                    plugin.status === 'installed' && 'text-info',
                    plugin.status === 'available' && 'text-muted-foreground',
                    plugin.status === 'error' && 'text-error'
                  )}
                >
                  {plugin.status === 'running' && 'Running'}
                  {plugin.status === 'installed' && 'Installed'}
                  {plugin.status === 'available' && 'Available'}
                  {plugin.status === 'error' && 'Error'}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {plugin.description}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              v{plugin.version}
            </p>
          </div>
        </div>

        {/* Stats Grid - Only shown when running */}
        {showStats && (
          <div className="grid grid-cols-2 gap-component-md mb-4">
            <div className="bg-muted rounded-[var(--semantic-radius-card)] p-component-md">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Connections</p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {plugin.stats!.connections}
              </p>
            </div>
            <div className="bg-muted rounded-[var(--semantic-radius-card)] p-component-md">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Peers</p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {plugin.stats!.peersConnected}
              </p>
            </div>
            <div className="bg-muted rounded-[var(--semantic-radius-card)] p-component-md">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">↓ Down</p>
              <p className="text-sm font-semibold text-foreground font-mono mt-1">
                {formatBytes(plugin.stats!.bytesIn)}
              </p>
            </div>
            <div className="bg-muted rounded-[var(--semantic-radius-card)] p-component-md">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">↑ Up</p>
              <p className="text-sm font-semibold text-foreground font-mono mt-1">
                {formatBytes(plugin.stats!.bytesOut)}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={cn('flex gap-component-sm mb-4')}>
          {plugin.status === 'available' && (
            <Button
              onClick={handleInstall}
              className={cn('flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary-hover rounded-[var(--semantic-radius-button)]')}
              size="sm"
              aria-label={`Install ${plugin.name}`}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Install
            </Button>
          )}
          {isInstalled && (
            <>
              <Button
                onClick={handleConfigure}
                variant="outline"
                className={cn('flex-1 gap-2 rounded-[var(--semantic-radius-button)]')}
                size="sm"
                aria-label={`Configure ${plugin.name}`}
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Configure
              </Button>
              <Button
                onClick={handleUninstall}
                variant="ghost"
                className={cn('gap-2 text-error hover:text-error hover:bg-error/10 rounded-[var(--semantic-radius-button)] px-3')}
                size="sm"
                aria-label={`Uninstall ${plugin.name}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </>
          )}
        </div>

        {/* Expandable Details Section */}
        <div className={cn('border-t border-border pt-component-md')}>
          <button
            onClick={handleToggleExpand}
            className={cn('w-full flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors')}
            aria-expanded={isExpanded}
            aria-controls={`plugin-details-${plugin.id}`}
          >
            <span className="uppercase tracking-wide text-xs">Details</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {isExpanded && (
            <div id={`plugin-details-${plugin.id}`} className={cn('mt-component-md space-y-4')}>
              {/* Features List */}
              <div>
                <p className={cn('text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2')}>
                  Features
                </p>
                <ul className="space-y-1.5">
                  {plugin.features.map((feature, index) => (
                    <li key={index} className={cn('text-sm text-foreground flex items-start gap-2')}>
                      <span className={cn('text-success mt-0.5')} aria-hidden="true">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Connection Logs - Only shown when installed/running */}
              {showLogs && (
                <div>
                  <p className={cn('text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2')}>
                    Recent Activity
                  </p>
                  <div className={cn('space-y-2 bg-muted rounded-[var(--semantic-radius-card)] p-component-md')} role="region" aria-label="Recent Activity">
                    {plugin.logs!.slice(0, 3).map((log, index) => (
                      <div key={index} className={cn('text-xs flex items-start gap-2')}>
                        <span className={cn('text-muted-foreground font-mono flex-shrink-0')}>
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <span className={cn('flex-1', logTypeColors[log.type])}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * PluginCard - Memoized component for performance
 */
export const PluginCard = memo(PluginCardComponent);
PluginCard.displayName = 'PluginCard';
