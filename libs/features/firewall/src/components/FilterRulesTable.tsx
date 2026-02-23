/**
 * Filter Rules Table Component (Platform Wrapper)
 *
 * @description Platform-aware wrapper for filter rules table with automatic detection and rendering
 * of appropriate presenter (Mobile/Desktop). Supports drag-drop reordering, inline toggles, and
 * CRUD actions with counter visualization.
 *
 * Features:
 * - Automatic platform detection (Mobile/Desktop)
 * - Drag-drop reordering (Desktop only)
 * - Inline enable/disable toggle
 * - CRUD actions (Edit, Duplicate, Delete)
 * - Counter visualization
 * - Disabled rules styling
 *
 * @see NAS-7.1: Implement Filter Rules - Task 4
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */

import { memo } from 'react';
import { cn } from '@nasnet/ui/utils';
import { useMediaQuery } from '@nasnet/ui/primitives';
import { FilterRulesTableDesktop } from './FilterRulesTableDesktop';
import { FilterRulesTableMobile } from './FilterRulesTableMobile';

export interface FilterRulesTableProps {
  /** Optional CSS class name for custom styling */
  className?: string;
  /** Optional firewall chain filter (e.g., 'forward', 'input', 'output') */
  chain?: string;
}

/**
 * FilterRulesTable Component
 *
 * Platform-aware wrapper that renders:
 * - Desktop: Dense table with drag-drop reordering
 * - Mobile: Card-based layout with touch-friendly controls
 *
 * @param props - Component props
 * @returns Platform-appropriate filter rules table
 */
export const FilterRulesTable = memo(function FilterRulesTable({
  className,
  chain
}: FilterRulesTableProps) {
  // Platform detection: <640px = Mobile, >=640px = Desktop
  const isMobile = useMediaQuery('(max-width: 640px)');

  return isMobile ? (
    <FilterRulesTableMobile className={cn(className)} chain={chain as 'input' | 'output' | 'forward' | undefined} />
  ) : (
    <FilterRulesTableDesktop className={cn(className)} chain={chain as 'input' | 'output' | 'forward' | undefined} />
  );
});

FilterRulesTable.displayName = 'FilterRulesTable';
