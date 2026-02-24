/**
 * TemplateFilters Component
 *
 * @description Filter controls for template browsing with search, category, scope, and sort options.
 *
 * Features:
 * - Debounced search input
 * - Category dropdown (6 categories)
 * - Scope dropdown (3 scopes)
 * - Sort options (name, updated, category, service count)
 * - Built-in/Custom toggles
 * - Reset button when filters active
 *
 * @example
 * ```tsx
 * <TemplateFilters
 *   filters={{
 *     searchQuery: '',
 *     category: null,
 *     scope: null,
 *     sortBy: 'name',
 *     showBuiltIn: true,
 *     showCustom: true,
 *   }}
 *   onFiltersChange={(updates) => setFilters(prev => ({ ...prev, ...updates }))}
 *   onReset={() => setFilters(defaultFilters)}
 *   hasActiveFilters={false}
 * />
 * ```
 */

import React, { useCallback } from 'react';

import { Search, X, Filter } from 'lucide-react';

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import type { TemplateFiltersProps } from './types';

function TemplateFiltersComponent({
  filters,
  onFiltersChange,
  onReset,
  hasActiveFilters,
  className,
}: TemplateFiltersProps) {
  // Memoized event handlers
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({ searchQuery: e.target.value });
    },
    [onFiltersChange]
  );

  const handleClearSearch = useCallback(() => {
    onFiltersChange({ searchQuery: '' });
  }, [onFiltersChange]);

  const handleCategoryChange = useCallback(
    (value: string) => {
      onFiltersChange({ category: value === 'all' ? null : (value as any) });
    },
    [onFiltersChange]
  );

  const handleScopeChange = useCallback(
    (value: string) => {
      onFiltersChange({ scope: value === 'all' ? null : (value as any) });
    },
    [onFiltersChange]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      onFiltersChange({ sortBy: value as any });
    },
    [onFiltersChange]
  );

  const handleBuiltInChange = useCallback(
    (checked: boolean) => {
      onFiltersChange({ showBuiltIn: checked });
    },
    [onFiltersChange]
  );

  const handleCustomChange = useCallback(
    (checked: boolean) => {
      onFiltersChange({ showCustom: checked });
    },
    [onFiltersChange]
  );
  return (
    <div className={cn('space-y-component-md', className)}>
      {/* Search */}
      <div className="space-y-component-sm">
        <Label htmlFor="template-search">Search Templates</Label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="template-search"
            type="text"
            placeholder="Search by name, description, or tags..."
            value={filters.searchQuery}
            onChange={handleSearchChange}
            className="pl-9 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-describedby="search-help"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-component-sm">
        <Label htmlFor="template-category">Category</Label>
        <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
          <SelectTrigger id="template-category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="PRIVACY">Privacy</SelectItem>
            <SelectItem value="ANTI_CENSORSHIP">Anti-Censorship</SelectItem>
            <SelectItem value="MESSAGING">Messaging</SelectItem>
            <SelectItem value="GAMING">Gaming</SelectItem>
            <SelectItem value="SECURITY">Security</SelectItem>
            <SelectItem value="NETWORKING">Networking</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scope Filter */}
      <div className="space-y-component-sm">
        <Label htmlFor="template-scope">Scope</Label>
        <Select value={filters.scope || 'all'} onValueChange={handleScopeChange}>
          <SelectTrigger id="template-scope" className="min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <SelectValue placeholder="All scopes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scopes</SelectItem>
            <SelectItem value="SINGLE">Single Service</SelectItem>
            <SelectItem value="MULTIPLE">Multiple Services</SelectItem>
            <SelectItem value="CHAIN">Service Chain</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort By */}
      <div className="space-y-component-sm">
        <Label htmlFor="template-sort">Sort By</Label>
        <Select value={filters.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger id="template-sort" className="min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="updated">Last Updated</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="services">Service Count</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Template Type Toggles */}
      <div className="space-y-component-sm pt-component-sm">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-builtin" className="cursor-pointer">
            Show Built-in
          </Label>
          <Switch
            id="show-builtin"
            checked={filters.showBuiltIn}
            onCheckedChange={handleBuiltInChange}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Show built-in templates"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-custom" className="cursor-pointer">
            Show Custom
          </Label>
          <Switch
            id="show-custom"
            checked={filters.showCustom}
            onCheckedChange={handleCustomChange}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Show custom templates"
          />
        </div>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="w-full min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Reset all filters to defaults"
        >
          <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
          Reset Filters
        </Button>
      )}
    </div>
  );
}

/**
 * TemplateFilters - Filter controls for template browser
 */
export const TemplateFilters = React.memo(TemplateFiltersComponent);
TemplateFilters.displayName = 'TemplateFilters';
