/**
 * Network Status Hero Display Component
 * Minimal display-only presenter for overall network status.
 * Shows connection status badge, router identity, and a summary uptime string.
 */

import { cn } from '@/lib/utils';

type NetworkDisplayStatus = 'online' | 'degraded' | 'offline' | 'connecting';

interface NetworkStatusHeroDisplayProps {
  /** Router identity / hostname */
  routerName?: string;
  /** Current network status */
  status: NetworkDisplayStatus;
  /** Human-readable uptime string, e.g. "3d 4h 25m" */
  uptime?: string;
  /** RouterOS version string, e.g. "7.14.2" */
  version?: string;
  /** Number of active interfaces */
  activeInterfaces?: number;
  /** Total number of interfaces */
  totalInterfaces?: number;
}

const STATUS_CONFIG: Record<
  NetworkDisplayStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  online: {
    label: 'Online',
    dotClass: 'bg-emerald-400 animate-pulse',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  degraded: {
    label: 'Degraded',
    dotClass: 'bg-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  offline: {
    label: 'Offline',
    dotClass: 'bg-red-400',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  connecting: {
    label: 'Connecting…',
    dotClass: 'bg-slate-400 animate-pulse',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
};

export function NetworkStatusHeroDisplay({
  routerName = 'Router',
  status,
  uptime,
  version,
  activeInterfaces,
  totalInterfaces,
}: NetworkStatusHeroDisplayProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800">
      {/* Identity row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-slate-900 font-bold text-sm select-none">
            N
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{routerName}</p>
            {version && (
              <p className="text-slate-500 text-xs">RouterOS {version}</p>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
            cfg.badgeClass,
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dotClass)} />
          {cfg.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 pt-1 border-t border-slate-800">
        {uptime && (
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide">Uptime</p>
            <p className="text-white text-sm font-mono font-medium">{uptime}</p>
          </div>
        )}
        {activeInterfaces !== undefined && totalInterfaces !== undefined && (
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide">Interfaces</p>
            <p className="text-white text-sm font-medium">
              {activeInterfaces}
              <span className="text-slate-500">/{totalInterfaces}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
