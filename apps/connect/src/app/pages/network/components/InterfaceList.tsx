/**
 * Interface List Component
 * Dashboard Pro style grid layout with section header
 */

import { useState } from 'react';
import { NetworkInterface } from '@nasnet/core/types';
import { InterfaceCard } from './InterfaceCard';
import { SectionHeader } from './SectionHeader';
import { Network } from 'lucide-react';

interface InterfaceListProps {
  interfaces: NetworkInterface[];
  defaultCollapsed?: boolean;
}

export function InterfaceList({ interfaces, defaultCollapsed = false }: InterfaceListProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showAll, setShowAll] = useState(false);

  const activeCount = interfaces.filter((i) => i.status === 'running').length;
  const displayLimit = 6;
  const hasMore = interfaces.length > displayLimit;
  const displayedInterfaces = showAll ? interfaces : interfaces.slice(0, displayLimit);

  if (interfaces.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
          <Network className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          No network interfaces found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Interfaces"
        count={interfaces.length}
        subtitle={`${activeCount} active`}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        action={
          hasMore && !isCollapsed
            ? {
                label: showAll ? 'Show Less' : `View All (${interfaces.length})`,
                onClick: () => setShowAll(!showAll),
              }
            : undefined
        }
      />

      {!isCollapsed && (
        <div className="grid gap-2 md:gap-3 md:grid-cols-2 lg:grid-cols-3">
          {displayedInterfaces.map((iface) => (
            <InterfaceCard key={iface.id} interface={iface} />
          ))}
        </div>
      )}
    </div>
  );
}
