/**
 * Bogon Filter Dialog Types
 *
 * TypeScript interfaces for bogon filter dialog components.
 * Defines props for the main component and the selection model.
 *
 * @module @nasnet/ui/patterns/bogon-filter-dialog
 * @see [BogonFilterDialog Component](./BogonFilterDialog.tsx)
 * @see [useBogonFilterDialog Hook](./use-bogon-filter-dialog.ts)
 */

import type { BogonCategory } from '@nasnet/core/types';

/**
 * Bogon Filter Dialog Component Props
 *
 * Props for the BogonFilterDialog pattern component which provides
 * a user-friendly interface for configuring bogon IP filtering on WAN interfaces.
 * The component automatically selects the appropriate platform presenter
 * (Mobile Sheet vs Desktop/Tablet Dialog) based on viewport.
 */
export interface BogonFilterDialogProps {
  /** Router ID for creating firewall rules */
  routerId: string;

  /** Whether the dialog/sheet is currently open */
  open: boolean;

  /** Callback fired when dialog is closed (both via Cancel button and backdrop) */
  onClose: () => void;

  /** Optional callback fired when rules are successfully created. Receives the count of created rules. */
  onSuccess?: (ruleCount: number) => void;

  /** Available WAN interfaces for selection (e.g., ['ether1-wan', 'pppoe-out1']). Defaults to common names if not provided. */
  availableInterfaces?: string[];
}

/**
 * Bogon Filter Selection Model
 *
 * Represents the user's selection of which bogon categories to filter on which interface.
 * Used primarily by the headless hook for rule generation.
 */
export interface BogonSelection {
  /** Selected interface where rules will be applied (e.g., "ether1-wan") */
  interface: string;

  /** Set of selected bogon categories to filter (e.g., loopback, reserved, private) */
  categories: Set<BogonCategory>;
}
