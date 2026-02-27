/**
 * RAW Rules Table Component (Platform Wrapper)
 *
 * @description Platform-aware wrapper for raw rules table with automatic detection and rendering
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
 * @see NAS-7.X: Implement RAW Firewall Rules - Phase B - Task 10
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */

import { memo } from 'react';
import { cn } from '@nasnet/ui/utils';
import { useMediaQuery } from '@nasnet/ui/primitives';
import { RawRulesTableDesktop } from './RawRulesTableDesktop';
import { RawRulesTableMobile } from './RawRulesTableMobile';

export interface RawRulesTableProps {
  /** Optional CSS class name for custom styling */
  className?: string;
  /** Optional firewall chain filter (e.g., 'forward', 'input', 'output') */
  chain?: string;
}

/**
 * RawRulesTable Component
 *
 * Platform-aware wrapper that renders:
 * - Desktop: Dense table with drag-drop reordering
 * - Mobile: Card-based layout with touch-friendly controls
 *
 * @param props - Component props
 * @returns Platform-appropriate RAW rules table
 */
export const RawRulesTable = memo(function RawRulesTable({ className, chain }: RawRulesTableProps) {
  // Platform detection: <640px = Mobile, >=640px = Desktop
  const isMobile = useMediaQuery('(max-width: 640px)');

  return isMobile ?
      <RawRulesTableMobile
        className={cn(className)}
        chain={chain}
      />
    : <RawRulesTableDesktop
        className={cn(className)}
        chain={chain}
      />;
});

RawRulesTable.displayName = 'RawRulesTable';
