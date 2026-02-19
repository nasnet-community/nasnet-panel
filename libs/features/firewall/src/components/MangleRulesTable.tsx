/**
 * Mangle Rules Table Component (Platform Wrapper)
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
 * @see NAS-7.5: Implement Mangle Rules - Task 5
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */

import { memo } from 'react';
import { useMediaQuery } from '@nasnet/ui/primitives';
import { MangleRulesTableDesktop } from './MangleRulesTableDesktop';
import { MangleRulesTableMobile } from './MangleRulesTableMobile';

export interface MangleRulesTableProps {
  className?: string;
  chain?: string;
}

/**
 * MangleRulesTable Component
 *
 * Platform-aware wrapper that renders:
 * - Desktop: Dense table with drag-drop reordering
 * - Mobile: Card-based layout with touch-friendly controls
 *
 * @param props - Component props
 * @returns Platform-appropriate mangle rules table
 */
export const MangleRulesTable = memo(function MangleRulesTable({ className, chain }: MangleRulesTableProps) {
  // Platform detection: <640px = Mobile, >=640px = Desktop
  const isMobile = useMediaQuery('(max-width: 640px)');

  return isMobile ? (
    <MangleRulesTableMobile className={className} chain={chain} />
  ) : (
    <MangleRulesTableDesktop className={className} chain={chain} />
  );
});
