/**
 * RAW Rules Table Component (Platform Wrapper)
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
 * @see NAS-7.X: Implement RAW Firewall Rules - Phase B - Task 10
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */

import { useMediaQuery } from '@nasnet/ui/primitives';
import { RawRulesTableDesktop } from './RawRulesTableDesktop';
import { RawRulesTableMobile } from './RawRulesTableMobile';

export interface RawRulesTableProps {
  className?: string;
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
export function RawRulesTable({ className, chain }: RawRulesTableProps) {
  // Platform detection: <640px = Mobile, >=640px = Desktop
  const isMobile = useMediaQuery('(max-width: 640px)');

  return isMobile ? (
    <RawRulesTableMobile className={className} chain={chain} />
  ) : (
    <RawRulesTableDesktop className={className} chain={chain} />
  );
}
