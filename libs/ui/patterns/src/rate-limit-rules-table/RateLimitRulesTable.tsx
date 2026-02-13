/**
 * Rate Limit Rules Table - Platform Wrapper
 * Auto-detects platform and renders appropriate presenter
 *
 * Implements the Headless + Platform Presenters pattern (ADR-018):
 * - Wrapper component with platform detection
 * - Desktop presenter (dense table, drag-drop)
 * - Mobile presenter (card-based, 44px touch targets)
 *
 * @see NAS-7.11: Implement Connection Rate Limiting
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */

import { usePlatform } from '@nasnet/ui/layouts';
import { useRateLimitRulesTable } from './use-rate-limit-rules-table';
import { RateLimitRulesTableDesktop } from './RateLimitRulesTableDesktop';
import { RateLimitRulesTableMobile } from './RateLimitRulesTableMobile';
import type { RateLimitRulesTableProps } from './types';

/**
 * RateLimitRulesTable Component
 *
 * Platform-aware wrapper that automatically selects the appropriate
 * presenter based on viewport breakpoints.
 *
 * **Platform Targets:**
 * - Mobile (<640px): Card-based layout with 44px touch targets
 * - Tablet (640-1024px): Desktop layout (shares with desktop)
 * - Desktop (>1024px): Dense data table with drag-drop
 *
 * **Features:**
 * - Drag-drop reordering (desktop only)
 * - Inline enable/disable toggle
 * - Action badges with semantic colors (drop=red, tarpit=amber, add-to-list=blue)
 * - Counter visualization
 * - Filter by action type and enabled/disabled status
 * - Edit, duplicate, delete actions
 * - Statistics panel
 *
 * @param props - Component props
 * @returns Rate limit rules table component
 *
 * @example
 * ```tsx
 * <RateLimitRulesTable
 *   actionFilter="drop"
 *   statusFilter="enabled"
 * />
 * ```
 */
export function RateLimitRulesTable(props: RateLimitRulesTableProps) {
  const platform = usePlatform();

  // Get business logic from headless hook
  const {
    rules,
    isLoading,
    error,
    maxBytes,
    editingRule,
    deleteConfirmRule,
    statsRule,
    handleEdit,
    handleDuplicate,
    handleDelete,
    handleToggle,
    handleShowStats,
    confirmDelete,
    closeEdit,
    closeDelete,
    closeStats,
  } = useRateLimitRulesTable(props);

  // Placeholder handler for reorder (no actual reordering API yet)
  const handleReorder = (activeId: string, overId: string) => {
    console.log('Reorder:', activeId, 'to', overId);
    // TODO: Implement reorder mutation when backend supports it
  };

  // Render mobile presenter for mobile, desktop for tablet/desktop
  if (platform === 'mobile') {
    return (
      <RateLimitRulesTableMobile
        {...props}
        rules={rules}
        isLoading={isLoading}
        error={error}
        maxBytes={maxBytes}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onToggle={handleToggle}
        onShowStats={handleShowStats}
        editingRule={editingRule}
        deleteConfirmRule={deleteConfirmRule}
        statsRule={statsRule}
        confirmDelete={confirmDelete}
        closeEdit={closeEdit}
        closeDelete={closeDelete}
        closeStats={closeStats}
      />
    );
  }

  // Desktop/Tablet presenter
  return (
    <RateLimitRulesTableDesktop
      {...props}
      rules={rules}
      isLoading={isLoading}
      error={error}
      maxBytes={maxBytes}
      onEdit={handleEdit}
      onDuplicate={handleDuplicate}
      onDelete={handleDelete}
      onToggle={handleToggle}
      onShowStats={handleShowStats}
      onReorder={handleReorder}
      editingRule={editingRule}
      deleteConfirmRule={deleteConfirmRule}
      statsRule={statsRule}
      confirmDelete={confirmDelete}
      closeEdit={closeEdit}
      closeDelete={closeDelete}
      closeStats={closeStats}
    />
  );
}
