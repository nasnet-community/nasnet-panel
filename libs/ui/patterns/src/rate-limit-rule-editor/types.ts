/**
 * RateLimitRuleEditor Types
 *
 * TypeScript interfaces for rate limit rule editor components.
 *
 * @module @nasnet/ui/patterns/rate-limit-rule-editor
 */

import type { RateLimitRule, RateLimitRuleInput } from '@nasnet/core/types/firewall';

/**
 * RateLimitRuleEditor Props
 */
export interface RateLimitRuleEditorProps {
  /** Router ID for fetching address lists */
  routerId: string;

  /** Initial rule values for editing (undefined for creating new rule) */
  initialRule?: Partial<RateLimitRule>;

  /** Is editor open */
  open: boolean;

  /** Callback when editor is closed */
  onClose: () => void;

  /** Callback when rule is saved */
  onSave: (rule: RateLimitRuleInput) => void | Promise<void>;

  /** Callback when rule is deleted (only for existing rules) */
  onDelete?: () => void | Promise<void>;

  /** Is save operation in progress */
  isSaving?: boolean;

  /** Is delete operation in progress */
  isDeleting?: boolean;

  /** Editor mode */
  mode?: 'create' | 'edit';

  /** Available address lists for autocomplete */
  addressLists?: string[];
}

/**
 * Address List Autocomplete Item
 */
export interface AddressListItem {
  /** List name */
  name: string;

  /** Number of entries in list */
  count?: number;

  /** List description */
  description?: string;
}
