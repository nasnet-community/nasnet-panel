/**
 * RawRuleEditor Types
 *
 * TypeScript interfaces for RAW rule editor components.
 *
 * @module @nasnet/ui/patterns/raw-rule-editor
 */

import type { RawRule, RawRuleInput } from '@nasnet/core/types';

/**
 * RawRuleEditor Props
 */
export interface RawRuleEditorProps {
  /** Router ID for fetching address lists and interfaces */
  routerId: string;

  /** Initial rule values for editing (undefined for creating new rule) */
  initialRule?: Partial<RawRule>;

  /** Is editor open */
  open: boolean;

  /** Callback when editor is closed */
  onClose: () => void;

  /** Callback when rule is saved */
  onSave: (rule: RawRuleInput) => void | Promise<void>;

  /** Callback when rule is deleted (only for existing rules) */
  onDelete?: () => void | Promise<void>;

  /** Is save operation in progress */
  isSaving?: boolean;

  /** Is delete operation in progress */
  isDeleting?: boolean;

  /** Editor mode */
  mode?: 'create' | 'edit';

  /** Show performance tips */
  showPerformanceTips?: boolean;

  /** Available address lists for autocomplete */
  addressLists?: string[];

  /** Available interface lists for autocomplete */
  interfaceLists?: string[];
}

/**
 * Chain Selector Props
 */
export interface ChainSelectorProps {
  /** Selected chain */
  value: string;

  /** Callback when chain changes */
  onChange: (chain: string) => void;

  /** Is disabled */
  disabled?: boolean;
}

/**
 * Action Selector Props
 */
export interface ActionSelectorProps {
  /** Selected action */
  value: string;

  /** Callback when action changes */
  onChange: (action: string) => void;

  /** Is disabled */
  disabled?: boolean;
}
