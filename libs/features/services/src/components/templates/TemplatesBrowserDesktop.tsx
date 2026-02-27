/**
 * TemplatesBrowserDesktop Component
 *
 * @description Desktop presenter for the templates browser with 2-column grid layout.
 *
 * Features:
 * - Left sidebar with filter controls
 * - 2-column grid of service template cards
 * - Hover states for interactive feedback
 * - Dense information display for power users
 * - Loading, error, and empty states with skeleton loaders
 * - Keyboard navigation and accessibility
 *
 * Platform: Desktop (>1024px)
 */

import React, { useCallback } from 'react';

import { Plus } from 'lucide-react';

import { ServiceTemplateCard, EmptyState } from '@nasnet/ui/patterns';
import { Button, Card, CardContent, Skeleton } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import { TemplateFilters } from './TemplateFilters';
import { useTemplatesBrowser } from './useTemplatesBrowser';

import type { TemplatesBrowserProps } from './types';

function TemplatesBrowserDesktopComponent({
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

  // Memoized callbacks for event handling
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleResetFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  return (
    <div className={cn('flex h-full', className)}>
      {/* Left Sidebar - Filters */}
      <aside
        className="border-border bg-muted p-component-lg w-80 overflow-y-auto border-r"
        aria-label="Template filter controls"
      >
        <h2 className="mb-component-lg text-lg font-semibold">Filters</h2>
        <TemplateFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </aside>

      {/* Main Content - Templates Grid */}
      <main
        className="flex-1 overflow-y-auto"
        aria-label="Service templates list"
      >
        {/* Header */}
        <div className="border-border bg-background p-component-lg sticky top-0 z-10 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Service Templates</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {loading ?
                  'Loading templates...'
                : `${templates.length} template${templates.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-component-lg">
            <Card
              className="border-error"
              role="alert"
            >
              <CardContent className="p-component-lg">
                <h3 className="text-error mb-component-sm font-semibold">
                  Failed to load templates
                </h3>
                <p className="text-muted-foreground mb-component-md text-sm">{error.message}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="min-h-[44px]"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div
            className="p-component-lg gap-component-lg grid grid-cols-2"
            role="status"
            aria-label="Loading templates"
          >
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className="h-64 w-full rounded-[var(--semantic-radius-card)]"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && templates.length === 0 && (
          <div className="flex items-center justify-center p-12">
            <EmptyState
              icon={Plus}
              title="No templates found"
              description={
                hasActiveFilters ?
                  'Try adjusting your filters to see more results'
                : 'No service templates available'
              }
              action={
                hasActiveFilters ?
                  {
                    label: 'Reset Filters',
                    onClick: handleResetFilters,
                    variant: 'outline' as const,
                  }
                : undefined
              }
            />
          </div>
        )}

        {/* Templates Grid */}
        {!loading && !error && templates.length > 0 && (
          <div
            className="p-component-lg gap-component-lg grid grid-cols-2"
            role="list"
            aria-label="Service templates list"
          >
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
      </main>
    </div>
  );
}

/**
 * TemplatesBrowserDesktop - Desktop presenter for templates browser
 */
export const TemplatesBrowserDesktop = React.memo(TemplatesBrowserDesktopComponent);
TemplatesBrowserDesktop.displayName = 'TemplatesBrowserDesktop';
