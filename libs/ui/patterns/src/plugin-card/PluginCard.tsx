/**
 * PluginCard Component
 * Displays plugin information with advanced features including status, stats, and logs
 * Follows NasNetConnect UX Design Direction patterns
 */

import { useState } from 'react';

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
 cn } from '@nasnet/ui/primitives';

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
export function PluginCard({ 
  plugin, 
  onInstall, 
  onUninstall, 
  onConfigure 
}: PluginCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = plugin.icon;

  const isRunning = plugin.status === 'running';
  const isInstalled = plugin.status === 'installed' || isRunning;
  const showStats = isRunning && plugin.stats;
  const showLogs = isInstalled && plugin.logs && plugin.logs.length > 0;

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Log type colors
  const logTypeColors = {
    info: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400'
  };

  return (
    <Card 
      className={cn(
        'rounded-2xl md:rounded-3xl transition-all duration-200',
        // Running state gets gradient background like VPN cards in demos
        isRunning && 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30',
        // Default state
        !isRunning && 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      )}
    >
      <CardContent className="p-4 md:p-6">
        {/* Header: Icon + Name + Status */}
        <div className="flex items-start gap-4 mb-4">
          {/* Plugin Icon Container */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <Icon className="h-6 w-6 text-slate-700 dark:text-slate-200" />
          </div>

          {/* Title and Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                {plugin.name}
              </h3>
              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span 
                  className={cn(
                    'w-2 h-2 rounded-full',
                    plugin.status === 'running' && 'bg-green-400 animate-pulse',
                    plugin.status === 'installed' && 'bg-blue-400',
                    plugin.status === 'available' && 'bg-slate-400',
                    plugin.status === 'error' && 'bg-red-400'
                  )}
                />
                <span className={cn(
                  'text-xs font-medium',
                  plugin.status === 'running' && 'text-green-400',
                  plugin.status === 'installed' && 'text-blue-400',
                  plugin.status === 'available' && 'text-slate-400',
                  plugin.status === 'error' && 'text-red-400'
                )}>
                  {plugin.status === 'running' && 'Running'}
                  {plugin.status === 'installed' && 'Installed'}
                  {plugin.status === 'available' && 'Available'}
                  {plugin.status === 'error' && 'Error'}
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
              {plugin.description}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">
              v{plugin.version}
            </p>
          </div>
        </div>

        {/* Stats Grid - Only shown when running */}
        {showStats && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
              <p className="text-slate-400 text-xs uppercase tracking-wide">Connections</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {plugin.stats!.connections}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
              <p className="text-slate-400 text-xs uppercase tracking-wide">Peers</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {plugin.stats!.peersConnected}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
              <p className="text-slate-400 text-xs uppercase tracking-wide">↓ Down</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono mt-1">
                {formatBytes(plugin.stats!.bytesIn)}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
              <p className="text-slate-400 text-xs uppercase tracking-wide">↑ Up</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono mt-1">
                {formatBytes(plugin.stats!.bytesOut)}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          {plugin.status === 'available' && (
            <Button
              onClick={() => onInstall?.(plugin.id)}
              className="flex-1 gap-2 bg-primary-500 hover:bg-primary-600 text-slate-900 font-semibold rounded-xl"
              size="sm"
            >
              <Download className="h-4 w-4" />
              Install
            </Button>
          )}
          {isInstalled && (
            <>
              <Button
                onClick={() => onConfigure?.(plugin.id)}
                variant="outline"
                className="flex-1 gap-2 rounded-xl border-slate-200 dark:border-slate-600"
                size="sm"
              >
                <Settings className="h-4 w-4" />
                Configure
              </Button>
              <Button
                onClick={() => onUninstall?.(plugin.id)}
                variant="ghost"
                className="gap-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl px-3"
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Expandable Details Section */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
          >
            <span className="uppercase tracking-wide text-xs">Details</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-4">
              {/* Features List */}
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                  Features
                </p>
                <ul className="space-y-1.5">
                  {plugin.features.map((feature, index) => (
                    <li key={index} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Connection Logs - Only shown when installed/running */}
              {showLogs && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                    Recent Activity
                  </p>
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                    {plugin.logs!.slice(0, 3).map((log, index) => (
                      <div key={index} className="text-xs flex items-start gap-2">
                        <span className="text-slate-500 font-mono flex-shrink-0">
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
