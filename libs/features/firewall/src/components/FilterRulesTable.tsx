/**
 * Filter Rules Table Component (Platform Wrapper)
 *
 * Wrapper component that detects platform and renders the appropriate presenter.
 * Follows the Headless + Platform Presenters pattern.
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
import { useMediaQuery } from '@nasnet/ui/primitives';
import { FilterRulesTableDesktop } from './FilterRulesTableDesktop';
import { FilterRulesTableMobile } from './FilterRulesTableMobile';

export interface FilterRulesTableProps {
  className?: string;
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
export const FilterRulesTable = memo(function FilterRulesTable({ className, chain }: FilterRulesTableProps) {
  // Platform detection: <640px = Mobile, >=640px = Desktop
  const isMobile = useMediaQuery('(max-width: 640px)');

  return isMobile ? (
    <FilterRulesTableMobile className={className} chain={chain as 'input' | 'output' | 'forward' | undefined} />
  ) : (
    <FilterRulesTableDesktop className={className} chain={chain as 'input' | 'output' | 'forward' | undefined} />
  );
});

FilterRulesTable.displayName = 'FilterRulesTable';
