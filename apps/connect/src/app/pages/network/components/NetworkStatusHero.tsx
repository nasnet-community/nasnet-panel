/**
 * Network Status Hero Component
 * Dashboard Pro style stats grid showing overall network health
 */

import { NetworkInterface } from '@nasnet/core/types';
import { formatBytes } from '@nasnet/core/utils';
import { Activity, ArrowDown, ArrowUp } from 'lucide-react';

interface NetworkStatusHeroProps {
  interfaces: NetworkInterface[];
  totalTraffic?: {
    txBytes: number;
    rxBytes: number;
    txRate?: number;
    rxRate?: number;
  };
  isLoading?: boolean;
}

export function NetworkStatusHero({
  interfaces,
  totalTraffic,
  isLoading,
}: NetworkStatusHeroProps) {
  const activeInterfaces = interfaces.filter((i) => i.status === 'running');

  const activePercent = interfaces.length > 0
    ? Math.round((activeInterfaces.length / interfaces.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 md:gap-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-slate-100 dark:bg-slate-900 rounded-xl p-3 md:p-4"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12 mb-2" />
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-8 mb-1" />
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 mb-1">
          <Activity className="w-3.5 h-3.5 text-cyan-500" />
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            Active
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
          {activeInterfaces.length}
          <span className="text-slate-400 dark:text-slate-500 text-sm font-normal ml-1">
            /{interfaces.length}
          </span>
        </p>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
          <div
            className="bg-cyan-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${activePercent}%` }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 mb-1">
          <ArrowDown className="w-3.5 h-3.5 text-emerald-500" />
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            Download
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white font-mono">
          {totalTraffic ? formatBytes(totalTraffic.rxBytes) : '0 B'}
        </p>
        {totalTraffic?.rxRate !== undefined && (
          <p className="text-xs text-emerald-500 mt-1">
            {formatBytes(totalTraffic.rxRate)}/s
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 mb-1">
          <ArrowUp className="w-3.5 h-3.5 text-purple-500" />
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            Upload
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white font-mono">
          {totalTraffic ? formatBytes(totalTraffic.txBytes) : '0 B'}
        </p>
        {totalTraffic?.txRate !== undefined && (
          <p className="text-xs text-purple-500 mt-1">
            {formatBytes(totalTraffic.txRate)}/s
          </p>
        )}
      </div>
    </div>
  );
}

























