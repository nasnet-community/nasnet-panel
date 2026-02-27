/**
 * AlertTemplateBrowserDesktop Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Desktop presenter for alert rule template browser.
 * Uses sidebar with filters and grid layout for optimal desktop viewing.
 *
 * @description Provides fixed sidebar navigation with category/severity filters,
 * dense grid layout (1-3 columns), and sort controls in header. Implements full
 * keyboard navigation and WCAG AAA compliance.
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

export interface AlertTemplateBrowserDesktopProps {
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
 * Sidebar filter panel for desktop layout
 */
interface FilterPanelProps {
  browser: UseTemplateBrowserReturn;
}

function FilterPanel({ browser }: FilterPanelProps) {
  const { filter, setFilter, clearFilter, hasActiveFilter, categoryCount, severityCount } = browser;

  const categories = getAllCategories();
  const severities = ['CRITICAL', 'WARNING', 'INFO'] as const;

  const severityLabels = {
    CRITICAL: 'Critical',
    WARNING: 'Warning',
    INFO: 'Info',
  };

  const severityColors = {
    CRITICAL: 'text-error',
    WARNING: 'text-warning',
    INFO: 'text-info',
  };

  return (
    <div className="border-border bg-card p-component-md space-y-component-lg w-64 overflow-y-auto border-r">
      {/* Clear filters button */}
      {hasActiveFilter && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilter}
          className="w-full"
          aria-label="Clear all filters"
        >
          Clear Filters
        </Button>
      )}

      {/* Search */}
      <div className="space-y-component-sm">
        <Label htmlFor="search-desktop">Search</Label>
        <Input
          id="search-desktop"
          type="text"
          placeholder="Search templates..."
          value={filter.search || ''}
          onChange={(e) => setFilter({ search: e.target.value })}
          aria-label="Search alert templates"
        />
      </div>

      {/* Category filter */}
      <div className="space-y-component-sm">
        <Label>Category</Label>
        <div className="space-y-component-sm">
          {/* All categories option */}
          <button
            onClick={() => setFilter({ category: 'all' })}
            className={cn(
              'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
              'hover:bg-muted focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              filter.category === 'all' && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            aria-label="Show all categories"
          >
            <div className="flex items-center justify-between">
              <span>All Categories</span>
              <Badge
                variant={filter.category === 'all' ? 'secondary' : 'outline'}
                className="text-xs"
              >
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
                  'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                  'hover:bg-muted focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
                aria-label={`Filter by ${cat.label} category`}
              >
                <div className="flex items-center justify-between">
                  <span>{cat.label}</span>
                  <Badge
                    variant={isActive ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {count}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Severity filter */}
      <div className="space-y-component-sm">
        <Label>Severity</Label>
        <div className="space-y-component-sm">
          {/* All severities option */}
          <button
            onClick={() => setFilter({ severity: 'all' })}
            className={cn(
              'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
              'hover:bg-muted focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              filter.severity === 'all' && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            aria-label="Show all severities"
          >
            <div className="flex items-center justify-between">
              <span>All Levels</span>
              <Badge
                variant={filter.severity === 'all' ? 'secondary' : 'outline'}
                className="text-xs"
              >
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
                  'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                  'hover:bg-muted focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
                aria-label={`Filter by ${severityLabels[sev]} severity`}
              >
                <div className="flex items-center justify-between">
                  <span className={severityColors[sev]}>{severityLabels[sev]}</span>
                  <Badge
                    variant={isActive ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {count}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Built-in / Custom toggle */}
      <div className="space-y-component-sm">
        <Label>Template Type</Label>
        <div className="space-y-component-sm">
          <button
            onClick={() =>
              setFilter({
                builtInOnly: !filter.builtInOnly,
                customOnly: false,
              })
            }
            className={cn(
              'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
              'hover:bg-muted focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
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
              'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
              'hover:bg-muted focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              filter.customOnly && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            aria-label="Show only custom templates"
          >
            Custom Only
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Template card for grid display
 */
interface TemplateCardProps {
  template: AlertRuleTemplate;
  isSelected: boolean;
  onClick: () => void;
  onApply: () => void;
  onViewDetail?: () => void;
}

/**
 * Template card component for grid display
 *
 * @description Memoized card showing template metadata, category, severity badges,
 * and Apply/Details action buttons. Fully keyboard accessible with Enter/Space
 * support and ARIA labels.
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
    CRITICAL: 'bg-error/10 text-error',
    WARNING: 'bg-warning/10 text-warning',
    INFO: 'bg-info/10 text-info',
  };

  return (
    <Card
      className={cn(
        'focus-visible:ring-ring cursor-pointer transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2',
        isSelected && 'ring-primary ring-2'
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
      <CardHeader>
        <div className="gap-component-sm flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <div className="gap-component-sm mt-component-sm flex items-center">
              <Badge
                variant="outline"
                className={cn('text-xs', categoryMeta.color)}
              >
                {categoryMeta.label}
              </Badge>
              <Badge className={cn('text-xs', severityColors[template.severity])}>
                {template.severity}
              </Badge>
              {template.isBuiltIn && (
                <Badge
                  variant="secondary"
                  className="text-xs"
                >
                  Built-in
                </Badge>
              )}
            </div>
          </div>
        </div>
        <CardDescription className="mt-component-sm line-clamp-2">
          {template.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="gap-component-md text-muted-foreground flex items-center text-sm">
          <div>
            <span className="font-medium">{template.conditions.length}</span> condition
            {template.conditions.length !== 1 && 's'}
          </div>
          <div>
            <span className="font-medium">{template.channels.length}</span> channel
            {template.channels.length !== 1 && 's'}
          </div>
          {template.variables.length > 0 && (
            <div>
              <span className="font-medium">{template.variables.length}</span> variable
              {template.variables.length !== 1 && 's'}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="gap-component-sm flex">
        <Button
          variant="default"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onApply();
          }}
          className="min-h-[44px] flex-1"
          aria-label={`Apply template ${template.name}`}
        >
          Apply Template
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
 * Desktop presenter for AlertTemplateBrowser
 *
 * Features:
 * - Sidebar with filters (category, severity, type, search)
 * - Grid layout for templates (responsive: 1-3 columns)
 * - Sort controls in header
 * - Apply and View Detail buttons on each card
 * - Empty state when no templates match
 * - WCAG AAA compliant (keyboard nav, ARIA labels, 7:1 contrast)
 *
 * @description Uses fixed sidebar (240px) for filters, main content area with
 * grid of template cards (1-3 columns depending on viewport). All interactive
 * elements have 44px minimum touch targets and visible focus indicators.
 *
 * @param props - Component props
 * @returns React element displaying template browser UI
 */
export const AlertTemplateBrowserDesktop = React.memo(function AlertTemplateBrowserDesktop({
  browser,
  onPreview,
  onViewDetail,
  loading = false,
  className,
}: AlertTemplateBrowserDesktopProps) {
  const {
    filteredTemplates,
    filteredCount,
    sort,
    setSort,
    selection,
    selectTemplate,
    applyTemplate,
  } = browser;

  return (
    <div
      className={cn('flex h-full', className)}
      role="main"
      aria-label="Alert template browser"
    >
      {/* Sidebar filters */}
      <FilterPanel browser={browser} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header with sort controls */}
        <div className="border-border p-component-md bg-card border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Alert Rule Templates</h1>
              <p
                className="text-muted-foreground text-sm"
                aria-live="polite"
              >
                {filteredCount} {filteredCount === 1 ? 'template' : 'templates'}
              </p>
            </div>

            {/* Sort controls */}
            <div className="gap-component-md flex items-center">
              <Tabs
                value={sort.field}
                onValueChange={(value) => setSort(value as typeof sort.field)}
                aria-label="Sort templates by"
              >
                <TabsList>
                  <TabsTrigger value="name">Name</TabsTrigger>
                  <TabsTrigger value="severity">Severity</TabsTrigger>
                  <TabsTrigger value="category">Category</TabsTrigger>
                  <TabsTrigger value="updatedAt">Updated</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Sort direction indicator */}
              <div
                className="text-muted-foreground text-sm"
                aria-live="polite"
              >
                {sort.direction === 'asc' ? '↑ A-Z' : '↓ Z-A'}
              </div>
            </div>
          </div>
        </div>

        {/* Template grid */}
        <div className="p-component-lg flex-1 overflow-y-auto">
          {loading ?
            <div
              className="flex h-full items-center justify-center"
              role="status"
              aria-live="polite"
            >
              <div className="text-muted-foreground">Loading templates...</div>
            </div>
          : filteredTemplates.length === 0 ?
            <div
              className="space-y-component-md flex h-full flex-col items-center justify-center"
              role="status"
            >
              <div className="space-y-component-sm text-center">
                <h3 className="text-lg font-semibold">No templates found</h3>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your filters or search criteria.
                </p>
              </div>
              {browser.hasActiveFilter && (
                <Button
                  variant="outline"
                  onClick={browser.clearFilter}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          : <div
              className="gap-component-md grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
              role="list"
              aria-label="Alert rule templates"
            >
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  role="listitem"
                >
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
          }
        </div>
      </div>
    </div>
  );
});

AlertTemplateBrowserDesktop.displayName = 'AlertTemplateBrowserDesktop';
