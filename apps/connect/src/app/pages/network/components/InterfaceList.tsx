/**
 * Interface List Component
 * Dashboard Pro style grid layout with section header
 */

import React, { useState } from 'react';

import { Network } from 'lucide-react';
import { useTranslation } from 'react-i18next';


import { type NetworkInterface } from '@nasnet/core/types';

import { InterfaceCard } from './InterfaceCard';
import { SectionHeader } from './SectionHeader';

interface InterfaceListProps {
  interfaces: NetworkInterface[];
  defaultCollapsed?: boolean;
}

export const InterfaceList = React.memo(function InterfaceList({ interfaces, defaultCollapsed = false }: InterfaceListProps) {
  const { t } = useTranslation('network');
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showAll, setShowAll] = useState(false);

  const activeCount = interfaces.filter((i) => i.status === 'running').length;
  const displayLimit = 6;
  const hasMore = interfaces.length > displayLimit;
  const displayedInterfaces = showAll ? interfaces : interfaces.slice(0, displayLimit);

  if (interfaces.length === 0) {
    return (
      <div className="text-center py-component-lg">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-component-md">
          <Network className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-muted-foreground text-sm">
          {t('interfaces.notFound')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-component-md">
      <SectionHeader
        title={t('interfaces.title')}
        count={interfaces.length}
        subtitle={t('interfaces.active', { count: activeCount })}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        action={
          hasMore && !isCollapsed
            ? {
                label: showAll ? t('button.showLess', { ns: 'common' }) : t('interfaces.viewAll', { count: interfaces.length }),
                onClick: () => setShowAll(!showAll),
              }
            : undefined
        }
      />

      {!isCollapsed && (
        <div className="grid gap-component-sm md:gap-component-md md:grid-cols-2 lg:grid-cols-3 animate-fade-in-up stagger-children">
          {displayedInterfaces.map((iface) => (
            <InterfaceCard key={iface.id} interface={iface} />
          ))}
        </div>
      )}
    </div>
  );
});

InterfaceList.displayName = 'InterfaceList';
