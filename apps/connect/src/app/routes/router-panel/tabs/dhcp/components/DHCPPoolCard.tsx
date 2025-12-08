/**
 * DHCP Pool Card Component
 * Displays individual pool with utilization visualization
 */

import type { DHCPPool, DHCPLease } from '@nasnet/core/types';
import { Database } from 'lucide-react';
import { calculatePoolSize, getUtilizationTextColor, getUtilizationBgColor } from '../utils';

interface DHCPPoolCardProps {
  pool: DHCPPool;
  leases: DHCPLease[];
  className?: string;
}

export function DHCPPoolCard({ pool, leases, className = '' }: DHCPPoolCardProps) {
  // Ensure ranges is always an array
  const ranges = Array.isArray(pool.ranges) ? pool.ranges : [];
  const totalSize = calculatePoolSize(ranges);
  const usedCount = leases.filter(l => l.status === 'bound').length;
  const availableCount = totalSize - usedCount;
  const utilizationPercent = totalSize > 0 ? Math.round((usedCount / totalSize) * 100) : 0;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
            <Database className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              {pool.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Address Pool
            </p>
          </div>
        </div>
        <span className={`text-lg font-bold ${getUtilizationTextColor(utilizationPercent)}`}>
          {utilizationPercent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3">
        <div
          className={`${getUtilizationBgColor(utilizationPercent)} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{usedCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Assigned</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{availableCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Available</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{totalSize}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
        </div>
      </div>

      {/* IP Ranges */}
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">IP Ranges</p>
        <div className="space-y-1">
          {ranges.length > 0 ? (
            ranges.map((range, idx) => (
              <p key={idx} className="text-sm font-mono text-slate-900 dark:text-white">
                {range}
              </p>
            ))
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">No ranges configured</p>
          )}
        </div>
      </div>
    </div>
  );
}
