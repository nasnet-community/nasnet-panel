/**
 * AlertTemplateBrowserMobile Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Mobile presenter for alert rule template browser.
 * Uses bottom sheet filters and vertical list for touch-friendly interface.
 *
 * @description Provides full-width vertical list layout with bottom sheet for
 * filters (slides up from bottom). All elements have 44px minimum touch targets
 * per WCAG AAA. Sort tabs in header. Compact template cards for mobile viewing.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';
import {
  Badge,
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
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

import {
  getCategoryMeta,
  getAllCategories,
  type AlertTemplateCategoryMeta,
} from '../../utils/alert-template-categories';
import type { AlertRuleTemplate } from '../../schemas/alert-rule-template.schema';
import type { UseTemplateBrowserReturn } from './useTemplateBrowser';

// =============================================================================
// Props Interface
// =============================================================================

export interface AlertTemplateBrowserMobileProps {
  /** Template browser hook return value */
  browser: UseTemplateBrowserReturn;

  /** Callback when template is previewed */
  onPreview?: (template: AlertRuleTemplate) => void;

  /** Callback when template detail is viewed */
  onViewDetail?: (template: AlertRuleTemplate) => void;

  /** Loading state */
  loading?: boolean;

  /** Container className */
  className?: string;
}

// =============================================================================
// Subcomponents
// =============================================================================

/**
 * Bottom sheet filter panel for mobile layout
 */
interface FilterSheetProps {
  browser: UseTemplateBrowserReturn;
}

function FilterSheet({ browser }: FilterSheetProps) {
  const { filter, setFilter, clearFilter, hasActiveFilter, categoryCount, severityCount } =
    browser;

  const categories = getAllCategories();
  const severities = ['CRITICAL', 'WARNING', 'INFO'] as const;

  const severityLabels = {
    CRITICAL: 'Critical',
    WARNING: 'Warning',
    INFO: 'Info',
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="default" className="w-full min-h-[44px]">
          <span>Filters</span>
          {hasActiveFilter && (
            <Badge variant="secondary" className="ml-2">
              Active
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[80vh] overflow-y-auto"
        aria-label="Filter templates"
      >
        <SheetHeader>
          <SheetTitle>Filter Templates</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-4">
          {/* Clear filters button */}
          {hasActiveFilter && (
            <Button
              variant="outline"
              onClick={clearFilter}
              className="w-full min-h-[44px]"
              aria-label="Clear all filters"
            >
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
              className="min-h-[44px]"
              aria-label="Search alert templates"
            />
          </div>

          {/* Category filter */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="grid grid-cols-2 gap-2">
              {/* All categories option */}
              <button
                onClick={() => setFilter({ category: 'all' })}
                className={cn(
                  'min-h-[44px] px-3 py-2 rounded-md text-sm transition-colors',
                  'border hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none',
                  filter.category === 'all' &&
                    'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
                aria-label="Show all categories"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-xs font-medium">All</span>
                  <Badge variant="outline" className="text-xs">
                    {browser.totalCount}
                  </Badge>
                </div>
              </button>

              {/* Individual categories */}
              {categories.map((cat) => {
                const count = categoryCount[cat.id] || 0;
                const isActive = filter.category === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setFilter({ category: cat.id })}
                    className={cn(
                      'min-h-[44px] px-3 py-2 rounded-md text-sm transition-colors',
                      'border hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none',
                      isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                    aria-label={`Filter by ${cat.label} category`}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs font-medium">{cat.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity filter */}
          <div className="space-y-2">
            <Label>Severity</Label>
            <div className="grid grid-cols-2 gap-2">
              {/* All severities option */}
              <button
                onClick={() => setFilter({ severity: 'all' })}
                className={cn(
                  'min-h-[44px] px-3 py-2 rounded-md text-sm transition-colors',
                  'border hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none',
                  filter.severity === 'all' &&
                    'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
                aria-label="Show all severities"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-xs font-medium">All</span>
                  <Badge variant="outline" className="text-xs">
                    {browser.totalCount}
                  </Badge>
                </div>
              </button>

              {/* Individual severities */}
              {severities.map((sev) => {
                const count = severityCount[sev] || 0;
                const isActive = filter.severity === sev;

                return (
                  <button
                    key={sev}
                    onClick={() => setFilter({ severity: sev })}
                    className={cn(
                      'min-h-[44px] px-3 py-2 rounded-md text-sm transition-colors',
                      'border hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none',
                      isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                    aria-label={`Filter by ${severityLabels[sev]} severity`}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs font-medium">{severityLabels[sev]}</span>
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
                  'border hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none',
                  filter.builtInOnly && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
                aria-label="Show only built-in templates"
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
                  'border hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none',
                  filter.customOnly && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
                aria-label="Show only custom templates"
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
 * Compact template card for mobile list
 */
interface TemplateCardProps {
  template: AlertRuleTemplate;
  isSelected: boolean;
  onClick: () => void;
  onApply: () => void;
  onViewDetail?: () => void;
}

/**
 * Compact template card component for mobile list
 *
 * @description Memoized card optimized for mobile with compact layout.
 * Shows template name, category/severity badges, and condition/channel counts.
 * Fully keyboard accessible with Enter/Space support and ARIA labels.
 */
const TemplateCardComponent = React.memo(function TemplateCardComponent({
  template,
  isSelected,
  onClick,
  onApply,
  onViewDetail,
}: TemplateCardProps) {
  const categoryMeta = getCategoryMeta(template.category);

  const severityColors = {
    CRITICAL: 'bg-destructive/10 text-destructive',
    WARNING: 'bg-warning/10 text-warning',
    INFO: 'bg-info/10 text-info',
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${template.name} - ${template.severity} severity, ${categoryMeta.label} category${isSelected ? ' (selected)' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-base">{template.name}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', categoryMeta.color)}>
              {categoryMeta.label}
            </Badge>
            <Badge className={cn('text-xs', severityColors[template.severity])}>
              {template.severity}
            </Badge>
            {template.isBuiltIn && (
              <Badge variant="secondary" className="text-xs">
                Built-in
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <CardDescription className="text-sm line-clamp-2">{template.description}</CardDescription>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">{template.conditions.length}</span> condition
            {template.conditions.length !== 1 && 's'}
          </div>
          <div>
            <span className="font-medium">{template.channels.length}</span> channel
            {template.channels.length !== 1 && 's'}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        <Button
          variant="default"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onApply();
          }}
          className="flex-1 min-h-[44px]"
          aria-label={`Apply template ${template.name}`}
        >
          Apply
        </Button>
        {onViewDetail && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail();
            }}
            className="min-h-[44px]"
            aria-label={`View details for ${template.name}`}
          >
            Details
          </Button>
        )}
      </CardFooter>
    </Card>
  );
});

TemplateCardComponent.displayName = 'TemplateCardComponent';

// =============================================================================
// Main Component
// =============================================================================

/**
 * Mobile presenter for AlertTemplateBrowser
 *
 * Features:
 * - Vertical list layout optimized for mobile
 * - Bottom sheet for filters (slide up from bottom)
 * - 44px minimum touch targets (WCAG AAA)
 * - Compact template cards
 * - Sort tabs in header
 * - Apply and View Detail buttons
 * - Empty state when no templates match
 * - Touch-friendly interactions
 *
 * @description Uses full-width vertical list with bottom sheet filter panel.
 * All buttons and interactive elements are 44px minimum for touch accessibility.
 * Header includes title, filter trigger button, and sort tabs.
 *
 * @param props - Component props
 * @returns React element displaying mobile template browser UI
 */
export const AlertTemplateBrowserMobile = React.memo(function AlertTemplateBrowserMobile({
  browser,
  onPreview,
  onViewDetail,
  loading = false,
  className,
}: AlertTemplateBrowserMobileProps) {
  const { filteredTemplates, filteredCount, sort, setSort, selection, selectTemplate, applyTemplate } =
    browser;

  return (
    <div
      className={cn('flex flex-col h-full', className)}
      role="main"
      aria-label="Alert template browser"
    >
      {/* Header */}
      <div className="border-b p-4 space-y-3 bg-background">
        <div>
          <h1 className="text-lg font-semibold">Alert Rule Templates</h1>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {filteredCount} {filteredCount === 1 ? 'template' : 'templates'}
          </p>
        </div>

        {/* Filter button */}
        <FilterSheet browser={browser} />

        {/* Sort tabs */}
        <Tabs
          value={sort.field}
          onValueChange={(value) => setSort(value as typeof sort.field)}
          className="w-full"
          aria-label="Sort templates by"
        >
          <TabsList className="w-full grid grid-cols-4 min-h-[44px]">
            <TabsTrigger value="name" className="text-xs">
              Name
            </TabsTrigger>
            <TabsTrigger value="severity" className="text-xs">
              Level
            </TabsTrigger>
            <TabsTrigger value="category" className="text-xs">
              Type
            </TabsTrigger>
            <TabsTrigger value="updatedAt" className="text-xs">
              Date
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div
            className="flex items-center justify-center h-full"
            role="status"
            aria-live="polite"
          >
            <div className="text-muted-foreground">Loading templates...</div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4" role="status">
            <div className="text-center space-y-2">
              <h3 className="text-base font-semibold">No templates found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search criteria.
              </p>
            </div>
            {browser.hasActiveFilter && (
              <Button
                variant="outline"
                onClick={browser.clearFilter}
                className="min-h-[44px]"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label="Alert rule templates">
            {filteredTemplates.map((template) => (
              <div key={template.id} role="listitem">
                <TemplateCardComponent
                  template={template}
                  isSelected={selection.selectedId === template.id}
                  onClick={() => selectTemplate(template)}
                  onApply={() => {
                    applyTemplate(template);
                    if (onPreview) {
                      onPreview(template);
                    }
                  }}
                  onViewDetail={onViewDetail ? () => onViewDetail(template) : undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

AlertTemplateBrowserMobile.displayName = 'AlertTemplateBrowserMobile';
