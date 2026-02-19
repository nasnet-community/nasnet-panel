/**
 * TemplatesBrowserMobile Component
 *
 * Mobile/Tablet presenter for templates browser.
 * Vertical list with bottom sheet filters and 44px touch targets.
 */

import { memo, useState } from 'react';
import { Filter, Plus } from 'lucide-react';

import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
} from '@nasnet/ui/primitives';
import { ServiceTemplateCard } from '@nasnet/ui/patterns';
import { EmptyState } from '@nasnet/ui/patterns';
import { cn } from '@nasnet/ui/utils';

import { useTemplatesBrowser } from './useTemplatesBrowser';
import { TemplateFilters } from './TemplateFilters';

import type { TemplatesBrowserProps } from './types';

/**
 * Mobile presenter for TemplatesBrowser
 *
 * Features:
 * - Vertical list layout
 * - Bottom sheet for filters
 * - 44px touch targets
 * - Pull-to-refresh (future)
 */
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

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header with filter button */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background sticky top-0 z-10">
        <h1 className="text-lg font-semibold">Service Templates</h1>
        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="min-h-[44px] min-w-[44px]"
              aria-label="Open filters"
            >
              <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader>
              <SheetTitle>Filter Templates</SheetTitle>
            </SheetHeader>
            <div className="mt-6 overflow-y-auto h-[calc(85vh-80px)]">
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
        <div className="p-4">
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive" role="alert">
            <p className="font-medium">Failed to load templates</p>
            <p className="text-sm mt-1">{error.message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-3 min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="p-4 space-y-4" role="status" aria-label="Loading templates">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
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
                onClick: resetFilters,
                variant: 'outline' as const,
              } : undefined
            }
          />
        </div>
      )}

      {/* Template List */}
      {!loading && !error && templates.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4" role="list" aria-label="Service templates list">
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

export const TemplatesBrowserMobile = memo(TemplatesBrowserMobileComponent);
TemplatesBrowserMobile.displayName = 'TemplatesBrowserMobile';
