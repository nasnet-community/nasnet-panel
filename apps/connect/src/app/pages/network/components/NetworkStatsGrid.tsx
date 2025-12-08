/**
 * Network Stats Grid Component
 * Dashboard Pro style - 3-column CPU/RAM/Uptime metrics
 */

import { SystemResource } from '@nasnet/core/types';
import { parseRouterOSUptime, calculateStatus } from '@nasnet/core/utils';
import { Cpu, HardDrive, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkStatsGridProps {
  resourceData?: SystemResource;
  isLoading?: boolean;
}

export function NetworkStatsGrid({ resourceData, isLoading }: NetworkStatsGridProps) {
  const memoryUsed = resourceData
    ? resourceData.totalMemory - resourceData.freeMemory
    : 0;
  const memoryPercentage = resourceData
    ? Math.round((memoryUsed / resourceData.totalMemory) * 100)
    : 0;

  const uptimeFormatted = resourceData?.uptime
    ? parseRouterOSUptime(resourceData.uptime)
    : '--';

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 p-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-900 rounded-xl p-3 text-center">
            <div className="h-5 bg-slate-700 rounded w-12 mx-auto mb-1" />
            <div className="h-3 bg-slate-800 rounded w-8 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 p-4">
      {/* CPU */}
      <div className="bg-slate-900 rounded-xl p-3 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <p className={cn(
          'text-lg font-bold',
          resourceData?.cpuLoad !== undefined
            ? calculateStatus(resourceData.cpuLoad) === 'healthy' ? 'text-cyan-400' :
              calculateStatus(resourceData.cpuLoad) === 'warning' ? 'text-amber-400' : 'text-red-400'
            : 'text-white'
        )}>
          {resourceData?.cpuLoad ?? '--'}%
        </p>
        <p className="text-slate-500 text-xs">CPU</p>
      </div>

      {/* Memory */}
      <div className="bg-slate-900 rounded-xl p-3 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <HardDrive className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <p className={cn(
          'text-lg font-bold',
          resourceData
            ? calculateStatus(memoryPercentage) === 'healthy' ? 'text-purple-400' :
              calculateStatus(memoryPercentage) === 'warning' ? 'text-amber-400' : 'text-red-400'
            : 'text-white'
        )}>
          {memoryPercentage}%
        </p>
        <p className="text-slate-500 text-xs">RAM</p>
      </div>

      {/* Uptime */}
      <div className="bg-slate-900 rounded-xl p-3 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <p className="text-lg font-bold text-emerald-400">{uptimeFormatted}</p>
        <p className="text-slate-500 text-xs">Uptime</p>
      </div>
    </div>
  );
}





