/**
 * UnusedRulesFilter - Pattern component for filtering and sorting firewall rules by usage
 * Layer 2 pattern component following ADR-017
 *
 * Features:
 * - Filter by unused rules (packets === 0)
 * - Sort by packet count
 * - WCAG AAA accessible
 */

import React from 'react';

import {
  Checkbox,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
 cn } from '@nasnet/ui/primitives';

export type SortOption = 'default' | 'packets-asc' | 'packets-desc';

export interface UnusedRulesFilterProps {
  /** Callback when filter checkbox changes */
  onFilterChange: (showUnusedOnly: boolean) => void;
  /** Callback when sort option changes */
  onSortChange: (sort: SortOption) => void;
  /** Current filter state */
  showUnusedOnly: boolean;
  /** Current sort option */
  currentSort: SortOption;
  /** Optional CSS class name */
  className?: string;
}

/**
 * UnusedRulesFilter component
 *
 * Provides filtering and sorting controls for firewall rule optimization.
 * Helps users identify unused rules (with 0 packet count) and sort by efficiency.
 */
export function UnusedRulesFilter({
  onFilterChange,
  onSortChange,
  showUnusedOnly,
  currentSort,
  className,
}: UnusedRulesFilterProps) {
  const handleFilterChange = (checked: boolean) => {
    onFilterChange(checked);
  };

  const handleSortChange = (value: string) => {
    onSortChange(value as SortOption);
  };

  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Unused Rules Filter */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-unused-only"
              checked={showUnusedOnly}
              onCheckedChange={handleFilterChange}
              aria-label="Show only unused rules"
            />
            <Label
              htmlFor="show-unused-only"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Show only unused rules (0 packets)
            </Label>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <Label htmlFor="sort-by" className="text-sm font-medium shrink-0">
              Sort by:
            </Label>
            <Select value={currentSort} onValueChange={handleSortChange}>
              <SelectTrigger
                id="sort-by"
                className="w-[200px]"
                aria-label="Sort rules by"
              >
                <SelectValue placeholder="Select sort option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default order</SelectItem>
                <SelectItem value="packets-asc">
                  Packet count: Low to High
                </SelectItem>
                <SelectItem value="packets-desc">
                  Packet count: High to Low
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

UnusedRulesFilter.displayName = 'UnusedRulesFilter';
