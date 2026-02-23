/**
 * TemplateGalleryMobile Component
 *
 * Mobile presenter for firewall template gallery.
 * Uses vertical list with bottom sheet filters for touch-friendly interface.
 */

import { memo } from 'react';
import * as React from 'react';

import { FileText } from 'lucide-react';

import {
  Badge,
  Button,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  cn,
} from '@nasnet/ui/primitives';

import { EmptyState } from '../empty-state';
import { TemplateCard } from './TemplateCard';

import type { FirewallTemplate, TemplateCategory, TemplateComplexity } from './types';
import type { UseTemplateGalleryReturn } from './use-template-gallery';

export interface TemplateGalleryMobileProps {
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
 * Bottom sheet filter panel
 */
interface FilterSheetProps {
  gallery: UseTemplateGalleryReturn;
}

function FilterSheet({ gallery }: FilterSheetProps) {
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
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="w-full h-11"
        >
          <span>Filters</span>
          {hasActiveFilter && (
            <Badge variant="secondary" className="ml-2">
              Active
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Templates</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-4">
          {/* Clear filters button */}
          {hasActiveFilter && (
            <Button variant="outline" onClick={clearFilter} className="w-full">
              Clear All Filters
            </Button>
          )}

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search-mobile">Search</Label>
            <Input
              id="search-mobile"
              type="text"
              placeholder="Search templates..."
              value={filter.search || ''}
              onChange={(e) => setFilter({ search: e.target.value })}
              className="h-11"
            />
          </div>

          {/* Category filter */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const count = cat === 'all' ? gallery.totalCount : categoryCount[cat] || 0;
                const isActive = filter.category === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => setFilter({ category: cat })}
                    className={cn(
                      'min-h-[44px] px-3 py-2 rounded-md text-sm transition-colors',
                      'border hover:bg-muted',
                      isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs font-medium">{categoryLabels[cat]}</span>
                      <Badge variant="outline" className="text-xs">
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
            <div className="grid grid-cols-2 gap-2">
              {complexities.map((comp) => {
                const count = comp === 'all' ? gallery.totalCount : complexityCount[comp] || 0;
                const isActive = filter.complexity === comp;

                return (
                  <button
                    key={comp}
                    onClick={() => setFilter({ complexity: comp })}
                    className={cn(
                      'min-h-[44px] px-3 py-2 rounded-md text-sm transition-colors',
                      'border hover:bg-muted',
                      isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs font-medium">{complexityLabels[comp]}</span>
                      <Badge variant="outline" className="text-xs">
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
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  setFilter({
                    builtInOnly: !filter.builtInOnly,
                    customOnly: false,
                  })
                }
                className={cn(
                  'min-h-[44px] px-4 py-2 rounded-md text-sm transition-colors',
                  'border hover:bg-muted',
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
                  'min-h-[44px] px-4 py-2 rounded-md text-sm transition-colors',
                  'border hover:bg-muted',
                  filter.customOnly && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                Custom Only
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Mobile presenter for TemplateGallery
 *
 * Features:
 * - Vertical list layout with 44px minimum touch targets
 * - Bottom sheet for filters
 * - Compact template cards
 * - Sort tabs in header
 * - Apply button on each card
 * - Empty state when no templates match
 */
function TemplateGalleryMobileComponent({
  gallery,
  onApplyTemplate,
  loading = false,
  className,
}: TemplateGalleryMobileProps) {
  const { filteredTemplates, filteredCount, sort, setSort, selection, selectTemplate } = gallery;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="border-b p-4 space-y-3 bg-background">
        <div>
          <h2 className="text-lg font-semibold">Template Gallery</h2>
          <p className="text-sm text-muted-foreground">
            {filteredCount} {filteredCount === 1 ? 'template' : 'templates'}
          </p>
        </div>

        {/* Filter button */}
        <FilterSheet gallery={gallery} />

        {/* Sort tabs */}
        <Tabs
          value={sort.field}
          onValueChange={(value) => setSort(value as typeof sort.field)}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-4 h-11">
            <TabsTrigger value="name" className="text-xs">
              Name
            </TabsTrigger>
            <TabsTrigger value="complexity" className="text-xs">
              Level
            </TabsTrigger>
            <TabsTrigger value="ruleCount" className="text-xs">
              Rules
            </TabsTrigger>
            <TabsTrigger value="category" className="text-xs">
              Type
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto p-4">
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
          <div className="space-y-3">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selection.selectedId === template.id}
                onClick={() => selectTemplate(template)}
                onAction={onApplyTemplate ? () => onApplyTemplate(template) : undefined}
                actionLabel="Apply Template"
                variant="compact"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap with memo for performance optimization
export const TemplateGalleryMobile = memo(TemplateGalleryMobileComponent);

// Set display name for React DevTools
TemplateGalleryMobile.displayName = 'TemplateGalleryMobile';
