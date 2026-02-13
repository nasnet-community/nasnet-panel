/**
 * Rate Limit Rules Table Types
 * Pattern component for displaying and managing rate limit rules
 *
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import type { RateLimitRule } from '@nasnet/core/types';

/**
 * Props for RateLimitRulesTable wrapper component
 */
export interface RateLimitRulesTableProps {
  /** Custom CSS class */
  className?: string;
  /** Filter by action type */
  actionFilter?: string;
  /** Filter by enabled/disabled status */
  statusFilter?: 'all' | 'enabled' | 'disabled';
}

/**
 * Props for platform-specific presenters
 */
export interface RateLimitRulesTablePresenterProps extends RateLimitRulesTableProps {
  /** Rate limit rules data */
  rules: RateLimitRule[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Max bytes for relative bar visualization */
  maxBytes: number;
  /** Polling interval in milliseconds */
  pollingInterval: number | false;
  /** Handler for editing a rule */
  onEdit: (rule: RateLimitRule) => void;
  /** Handler for duplicating a rule */
  onDuplicate: (rule: RateLimitRule) => void;
  /** Handler for deleting a rule */
  onDelete: (rule: RateLimitRule) => void;
  /** Handler for toggling rule enabled/disabled */
  onToggle: (rule: RateLimitRule) => void;
  /** Handler for showing rule statistics */
  onShowStats: (rule: RateLimitRule) => void;
  /** Handler for drag-drop reorder */
  onReorder: (activeId: string, overId: string) => void;
}

/**
 * Props for sortable row component
 */
export interface SortableRowProps {
  rule: RateLimitRule;
  maxBytes: number;
  onEdit: (rule: RateLimitRule) => void;
  onDuplicate: (rule: RateLimitRule) => void;
  onDelete: (rule: RateLimitRule) => void;
  onToggle: (rule: RateLimitRule) => void;
  onShowStats: (rule: RateLimitRule) => void;
}
