/**
 * Bogon Filter Dialog Types
 *
 * TypeScript interfaces for bogon filter dialog components.
 *
 * @module @nasnet/ui/patterns/bogon-filter-dialog
 */

import type { BogonCategory } from '@nasnet/core/types';

/**
 * Bogon Filter Dialog Props
 */
export interface BogonFilterDialogProps {
  /** Router ID for creating rules */
  routerId: string;

  /** Is dialog open */
  open: boolean;

  /** Callback when dialog is closed */
  onClose: () => void;

  /** Callback when rules are successfully created */
  onSuccess?: (ruleCount: number) => void;

  /** Available interfaces for selection */
  availableInterfaces?: string[];
}

/**
 * Selected categories for filtering
 */
export interface BogonSelection {
  /** Selected interface (e.g., "ether1-wan") */
  interface: string;

  /** Selected bogon categories to filter */
  categories: Set<BogonCategory>;
}
