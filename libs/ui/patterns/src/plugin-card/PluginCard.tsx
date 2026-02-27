/**
 * PluginCard Component
 * Displays plugin information with advanced features including status, stats, and logs
 * Follows NasNetConnect UX Design Direction patterns
 */

import { memo, useCallback, useState } from 'react';

import { Download, Trash2, Settings, ChevronDown, ChevronUp } from 'lucide-react';

import { formatBytes } from '@nasnet/core/utils';
import { Card, CardContent, Button, cn } from '@nasnet/ui/primitives';

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
function PluginCardComponent({ plugin, onInstall, onUninstall, onConfigure }: PluginCardProps) {
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
    setIsExpanded((prev) => !prev);
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
        'bg-card border-border rounded-[var(--semantic-radius-card)] border',
        'shadow-[var(--semantic-shadow-card)]',
        'cursor-pointer hover:shadow-lg',
        'transition-shadow duration-200',
        // Running state uses success semantic color
        isRunning && 'border-success/50'
      )}
    >
      <CardContent className="p-4 md:p-6">
        {/* Header: Icon + Name + Status */}
        <div className="mb-4 flex items-start gap-4">
          {/* Plugin Icon Container */}
          <div
            className={cn(
              'bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg'
            )}
          >
            <Icon className="text-muted-foreground h-5 w-5" />
          </div>

          {/* Title and Status */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className={cn('text-foreground truncate text-base font-semibold')}>
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
                    'h-2 w-2 rounded-full',
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
            <p className="text-muted-foreground line-clamp-2 text-sm">{plugin.description}</p>
            <p className="text-muted-foreground mt-1 font-mono text-xs">v{plugin.version}</p>
          </div>
        </div>

        {/* Stats Grid - Only shown when running */}
        {showStats && (
          <div className="gap-component-md mb-4 grid grid-cols-2">
            <div className="bg-muted p-component-md rounded-[var(--semantic-radius-card)]">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Connections</p>
              <p className="text-foreground mt-1 text-lg font-semibold">
                {plugin.stats!.connections}
              </p>
            </div>
            <div className="bg-muted p-component-md rounded-[var(--semantic-radius-card)]">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Peers</p>
              <p className="text-foreground mt-1 text-lg font-semibold">
                {plugin.stats!.peersConnected}
              </p>
            </div>
            <div className="bg-muted p-component-md rounded-[var(--semantic-radius-card)]">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">↓ Down</p>
              <p className="text-foreground mt-1 font-mono text-sm font-semibold">
                {formatBytes(plugin.stats!.bytesIn)}
              </p>
            </div>
            <div className="bg-muted p-component-md rounded-[var(--semantic-radius-card)]">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">↑ Up</p>
              <p className="text-foreground mt-1 font-mono text-sm font-semibold">
                {formatBytes(plugin.stats!.bytesOut)}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={cn('gap-component-sm mb-4 flex')}>
          {plugin.status === 'available' && (
            <Button
              onClick={handleInstall}
              className={cn(
                'bg-primary text-primary-foreground hover:bg-primary-hover flex-1 gap-2 rounded-[var(--semantic-radius-button)]'
              )}
              size="sm"
              aria-label={`Install ${plugin.name}`}
            >
              <Download
                className="h-4 w-4"
                aria-hidden="true"
              />
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
                <Settings
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Configure
              </Button>
              <Button
                onClick={handleUninstall}
                variant="ghost"
                className={cn(
                  'text-error hover:text-error hover:bg-error/10 gap-2 rounded-[var(--semantic-radius-button)] px-3'
                )}
                size="sm"
                aria-label={`Uninstall ${plugin.name}`}
              >
                <Trash2
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </Button>
            </>
          )}
        </div>

        {/* Expandable Details Section */}
        <div className={cn('border-border pt-component-md border-t')}>
          <button
            onClick={handleToggleExpand}
            className={cn(
              'text-muted-foreground hover:text-foreground flex w-full items-center justify-between text-sm font-medium transition-colors'
            )}
            aria-expanded={isExpanded}
            aria-controls={`plugin-details-${plugin.id}`}
          >
            <span className="text-xs uppercase tracking-wide">Details</span>
            {isExpanded ?
              <ChevronUp
                className="h-4 w-4"
                aria-hidden="true"
              />
            : <ChevronDown
                className="h-4 w-4"
                aria-hidden="true"
              />
            }
          </button>

          {isExpanded && (
            <div
              id={`plugin-details-${plugin.id}`}
              className={cn('mt-component-md space-y-4')}
            >
              {/* Features List */}
              <div>
                <p
                  className={cn(
                    'text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide'
                  )}
                >
                  Features
                </p>
                <ul className="space-y-1.5">
                  {plugin.features.map((feature, index) => (
                    <li
                      key={index}
                      className={cn('text-foreground flex items-start gap-2 text-sm')}
                    >
                      <span
                        className={cn('text-success mt-0.5')}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Connection Logs - Only shown when installed/running */}
              {showLogs && (
                <div>
                  <p
                    className={cn(
                      'text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide'
                    )}
                  >
                    Recent Activity
                  </p>
                  <div
                    className={cn(
                      'bg-muted p-component-md space-y-2 rounded-[var(--semantic-radius-card)]'
                    )}
                    role="region"
                    aria-label="Recent Activity"
                  >
                    {plugin.logs!.slice(0, 3).map((log, index) => (
                      <div
                        key={index}
                        className={cn('flex items-start gap-2 text-xs')}
                      >
                        <span className={cn('text-muted-foreground flex-shrink-0 font-mono')}>
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <span className={cn('flex-1', logTypeColors[log.type])}>{log.message}</span>
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
