/**
 * TemplateGalleryDesktop Component
 *
 * Desktop presenter for firewall template gallery.
 * Uses grid layout with sidebar filters for efficient browsing.
 */

import { memo } from 'react';

import { FileText } from 'lucide-react';

import {
  Badge,
  Button,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
} from '@nasnet/ui/primitives';

import { EmptyState } from '../empty-state';
import { TemplateCard } from './TemplateCard';

import type { FirewallTemplate, TemplateCategory, TemplateComplexity } from './types';
import type { UseTemplateGalleryReturn } from './use-template-gallery';

export interface TemplateGalleryDesktopProps {
  /** Template gallery hook return value */
  gallery: UseTemplateGalleryReturn;

  /** Callback when Apply button is clicked */
  onApplyTemplate?: (template: FirewallTemplate) => void;

  /** Loading state */
  loading?: boolean;

  /** Container className */
  className?: string;
}

/**
 * Sidebar filter panel
 */
interface FilterPanelProps {
  gallery: UseTemplateGalleryReturn;
}

function FilterPanel({ gallery }: FilterPanelProps) {
  const { filter, setFilter, clearFilter, hasActiveFilter, categoryCount, complexityCount } =
    gallery;

  const categories: (TemplateCategory | 'all')[] = [
    'all',
    'BASIC',
    'HOME',
    'GAMING',
    'IOT',
    'GUEST',
    'CUSTOM',
  ];

  const complexities: (TemplateComplexity | 'all')[] = ['all', 'SIMPLE', 'MODERATE', 'ADVANCED'];

  const categoryLabels: Record<TemplateCategory | 'all', string> = {
    all: 'All Categories',
    BASIC: 'Basic Security',
    HOME: 'Home Network',
    GAMING: 'Gaming',
    IOT: 'IoT Isolation',
    GUEST: 'Guest Network',
    CUSTOM: 'Custom',
    VPN: 'VPN',
    SECURITY: 'Security',
  };

  const complexityLabels: Record<TemplateComplexity | 'all', string> = {
    all: 'All Levels',
    SIMPLE: 'Simple',
    MODERATE: 'Moderate',
    ADVANCED: 'Advanced',
    EXPERT: 'Expert',
  };

  return (
    <div className="w-64 border-r bg-muted/30 p-4 space-y-6">
      {/* Clear filters button */}
      {hasActiveFilter && (
        <Button variant="outline" size="sm" onClick={clearFilter} className="w-full">
          Clear Filters
        </Button>
      )}

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          type="text"
          placeholder="Search templates..."
          value={filter.search || ''}
          onChange={(e) => setFilter({ search: e.target.value })}
        />
      </div>

      {/* Category filter */}
      <div className="space-y-2">
        <Label>Category</Label>
        <div className="space-y-1">
          {categories.map((cat) => {
            const count = cat === 'all' ? gallery.totalCount : categoryCount[cat] || 0;
            const isActive = filter.category === cat;

            return (
              <button
                key={cat}
                onClick={() => setFilter({ category: cat })}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  'hover:bg-muted',
                  isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{categoryLabels[cat]}</span>
                  <Badge variant={isActive ? 'secondary' : 'outline'} className="text-xs">
                    {count}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Complexity filter */}
      <div className="space-y-2">
        <Label>Complexity</Label>
        <div className="space-y-1">
          {complexities.map((comp) => {
            const count = comp === 'all' ? gallery.totalCount : complexityCount[comp] || 0;
            const isActive = filter.complexity === comp;

            return (
              <button
                key={comp}
                onClick={() => setFilter({ complexity: comp })}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  'hover:bg-muted',
                  isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{complexityLabels[comp]}</span>
                  <Badge variant={isActive ? 'secondary' : 'outline'} className="text-xs">
                    {count}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Built-in / Custom toggle */}
      <div className="space-y-2">
        <Label>Template Type</Label>
        <div className="space-y-1">
          <button
            onClick={() =>
              setFilter({
                builtInOnly: !filter.builtInOnly,
                customOnly: false,
              })
            }
            className={cn(
              'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
              'hover:bg-muted',
              filter.builtInOnly && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            Built-in Only
          </button>
          <button
            onClick={() =>
              setFilter({
                customOnly: !filter.customOnly,
                builtInOnly: false,
              })
            }
            className={cn(
              'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
              'hover:bg-muted',
              filter.customOnly && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            Custom Only
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Desktop presenter for TemplateGallery
 *
 * Features:
 * - Sidebar with filters (category, complexity, type, search)
 * - Grid layout for templates (3 columns)
 * - Sort controls in header
 * - Apply button on each card
 * - Empty state when no templates match
 */
function TemplateGalleryDesktopComponent({
  gallery,
  onApplyTemplate,
  loading = false,
  className,
}: TemplateGalleryDesktopProps) {
  const { filteredTemplates, filteredCount, sort, setSort, selection, selectTemplate } = gallery;

  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar filters */}
      <FilterPanel gallery={gallery} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with sort controls */}
        <div className="border-b p-4 bg-background">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Template Gallery</h2>
              <p className="text-sm text-muted-foreground">
                {filteredCount} {filteredCount === 1 ? 'template' : 'templates'}
              </p>
            </div>

            {/* Sort controls */}
            <Tabs
              value={sort.field}
              onValueChange={(value) => setSort(value as typeof sort.field)}
            >
              <TabsList>
                <TabsTrigger value="name">Name</TabsTrigger>
                <TabsTrigger value="complexity">Complexity</TabsTrigger>
                <TabsTrigger value="ruleCount">Rules</TabsTrigger>
                <TabsTrigger value="category">Category</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Sort direction toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSort(sort.field === 'name' ? 'complexity' : 'name')
              }
            >
              {sort.direction === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </Button>
          </div>
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading templates...</div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No templates found"
              description="Try adjusting your filters or search criteria."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selection.selectedId === template.id}
                  onClick={() => selectTemplate(template)}
                  onAction={onApplyTemplate ? () => onApplyTemplate(template) : undefined}
                  actionLabel="Apply Template"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrap with memo for performance optimization
export const TemplateGalleryDesktop = memo(TemplateGalleryDesktopComponent);

// Set display name for React DevTools
TemplateGalleryDesktop.displayName = 'TemplateGalleryDesktop';
