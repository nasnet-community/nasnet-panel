/**
 * TemplatesBrowserMobile Component
 *
 * @description Mobile/Tablet presenter for the templates browser with vertical list layout.
 *
 * Features:
 * - Vertical list of service template cards
 * - Bottom sheet filter panel (opens on tap)
 * - 44px minimum touch targets for mobile users
 * - 8px spacing between touch targets
 * - Loading, error, and empty states with skeleton loaders
 * - Pull-to-refresh ready (future enhancement)
 * - Screen reader support and WCAG AAA accessibility
 *
 * Platform: Mobile (<640px) and Tablet (640-1024px)
 */

import React, { useState, useCallback } from 'react';

import { Filter, Plus } from 'lucide-react';

import { ServiceTemplateCard , EmptyState } from '@nasnet/ui/patterns';
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import { TemplateFilters } from './TemplateFilters';
import { useTemplatesBrowser } from './useTemplatesBrowser';

import type { TemplatesBrowserProps } from './types';

function TemplatesBrowserMobileComponent({
  routerId,
  onInstall,
  onViewDetails,
  className,
}: TemplatesBrowserProps) {
  const {
    templates,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    refetch,
  } = useTemplatesBrowser(routerId);

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Memoized callbacks for event handling
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleResetFilters = useCallback(() => {
    resetFilters();
    setFilterSheetOpen(false);
  }, [resetFilters]);

  const handleFilterSheetOpenChange = useCallback((open: boolean) => {
    setFilterSheetOpen(open);
  }, []);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header with filter button */}
      <div className="flex items-center justify-between p-component-md border-b border-border bg-background sticky top-0 z-10">
        <h1 className="text-lg font-semibold">Service Templates</h1>
        <Sheet open={filterSheetOpen} onOpenChange={handleFilterSheetOpenChange}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="min-h-[44px] min-w-[44px] px-3"
              aria-label={hasActiveFilters ? 'Open filters (filters active)' : 'Open filters'}
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              <span className="ml-2 hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground" aria-label="1 filter active">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader>
              <SheetTitle>Filter Templates</SheetTitle>
            </SheetHeader>
            <div className="mt-component-lg overflow-y-auto h-[calc(85vh-80px)]">
              <TemplateFilters
                filters={filters}
                onFiltersChange={updateFilters}
                onReset={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-component-md">
          <div className="rounded-[var(--semantic-radius-card)] bg-error/10 p-component-md text-error" role="alert">
            <p className="font-medium">Failed to load templates</p>
            <p className="text-sm mt-component-sm">{error.message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="mt-component-md min-h-[44px]"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="p-component-md space-y-component-md" role="status" aria-label="Loading templates">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-[var(--semantic-radius-card)]" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && templates.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <EmptyState
            icon={Plus}
            title="No templates found"
            description={
              hasActiveFilters
                ? 'Try adjusting your filters to see more results'
                : 'No service templates available'
            }
            action={
              hasActiveFilters ? {
                label: 'Reset Filters',
                onClick: handleResetFilters,
                variant: 'outline' as const,
              } : undefined
            }
          />
        </div>
      )}

      {/* Template List */}
      {!loading && !error && templates.length > 0 && (
        <div className="flex-1 overflow-y-auto p-component-md space-y-component-md" role="list" aria-label="Service templates list">
          {templates.map((template) => (
            <ServiceTemplateCard
              key={template.id}
              template={{
                id: template.id,
                name: template.name,
                description: template.description,
                category: template.category.toLowerCase() as any,
                scope: template.isBuiltIn ? 'built-in' : 'custom',
                icon: template.isBuiltIn ? '📦' : '⚙️',
                metadata: {
                  serviceCount: template.services.length,
                  variableCount: template.configVariables.length,
                  version: template.version,
                  author: template.author || undefined,
                  updatedAt: template.updatedAt,
                },
                verified: template.isBuiltIn,
                tags: [...(template.tags || [])],
              }}
              actions={[
                {
                  id: 'install',
                  label: 'Install',
                  onClick: () => onInstall?.(template),
                  variant: 'default',
                },
                {
                  id: 'details',
                  label: 'View Details',
                  onClick: () => onViewDetails?.(template),
                  variant: 'outline',
                },
              ]}
              onClick={() => onViewDetails?.(template)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * TemplatesBrowserMobile - Mobile/Tablet presenter for templates browser
 */
export const TemplatesBrowserMobile = React.memo(TemplatesBrowserMobileComponent);
TemplatesBrowserMobile.displayName = 'TemplatesBrowserMobile';
