/**
 * TemplatesBrowserDesktop Component
 *
 * Desktop presenter for templates browser.
 * 2-column grid with sidebar filters and hover states.
 */

import { memo } from 'react';
import { Plus } from 'lucide-react';

import { Button, Card, CardContent, Skeleton } from '@nasnet/ui/primitives';
import { ServiceTemplateCard } from '@nasnet/ui/patterns';
import { EmptyState } from '@nasnet/ui/patterns';
import { cn } from '@nasnet/ui/utils';

import { useTemplatesBrowser } from './useTemplatesBrowser';
import { TemplateFilters } from './TemplateFilters';

import type { TemplatesBrowserProps } from './types';

/**
 * Desktop presenter for TemplatesBrowser
 *
 * Features:
 * - 2-column grid layout
 * - Left sidebar with filters
 * - Hover states
 * - Dense information display
 */
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

  return (
    <div className={cn('flex h-full', className)}>
      {/* Left Sidebar - Filters */}
      <aside className="w-80 border-r border-border bg-muted/10 p-6 overflow-y-auto" aria-label="Template filters">
        <h2 className="text-lg font-semibold mb-6">Filters</h2>
        <TemplateFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </aside>

      {/* Main Content - Templates Grid */}
      <main className="flex-1 overflow-y-auto" aria-label="Service templates">
        {/* Header */}
        <div className="border-b border-border bg-background p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Service Templates</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {loading
                  ? 'Loading templates...'
                  : `${templates.length} template${templates.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6">
            <Card className="border-destructive" role="alert">
              <CardContent className="p-6">
                <h3 className="font-semibold text-destructive mb-2">
                  Failed to load templates
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {error.message}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="p-6 grid grid-cols-2 gap-6" role="status" aria-label="Loading templates">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
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

        {/* Templates Grid */}
        {!loading && !error && templates.length > 0 && (
          <div className="p-6 grid grid-cols-2 gap-6" role="list" aria-label="Service templates list">
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

export const TemplatesBrowserDesktop = memo(TemplatesBrowserDesktopComponent);
TemplatesBrowserDesktop.displayName = 'TemplatesBrowserDesktop';
