/**
 * TemplateFilters Component
 *
 * Filter controls for template browsing with search, category, scope, and sort options.
 */

import * as React from 'react';
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

/**
 * TemplateFilters - Filter controls for template browser
 *
 * Features:
 * - Search input with debounce
 * - Category dropdown
 * - Scope dropdown
 * - Sort dropdown
 * - Built-in/Custom toggles
 * - Reset button (when filters active)
 */
export function TemplateFilters({
  filters,
  onFiltersChange,
  onReset,
  hasActiveFilters,
  className,
}: TemplateFiltersProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="template-search">Search Templates</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="template-search"
            type="text"
            placeholder="Search by name, description, or tags..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
            className="pl-9"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFiltersChange({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <Label htmlFor="template-category">Category</Label>
        <Select
          value={filters.category || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ category: value === 'all' ? null : (value as any) })
          }
        >
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
      <div className="space-y-2">
        <Label htmlFor="template-scope">Scope</Label>
        <Select
          value={filters.scope || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ scope: value === 'all' ? null : (value as any) })
          }
        >
          <SelectTrigger id="template-scope">
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
      <div className="space-y-2">
        <Label htmlFor="template-sort">Sort By</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value) => onFiltersChange({ sortBy: value as any })}
        >
          <SelectTrigger id="template-sort">
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
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-builtin" className="cursor-pointer">
            Show Built-in
          </Label>
          <Switch
            id="show-builtin"
            checked={filters.showBuiltIn}
            onCheckedChange={(checked) => onFiltersChange({ showBuiltIn: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-custom" className="cursor-pointer">
            Show Custom
          </Label>
          <Switch
            id="show-custom"
            checked={filters.showCustom}
            onCheckedChange={(checked) => onFiltersChange({ showCustom: checked })}
          />
        </div>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="w-full"
        >
          <Filter className="mr-2 h-4 w-4" />
          Reset Filters
        </Button>
      )}
    </div>
  );
}
