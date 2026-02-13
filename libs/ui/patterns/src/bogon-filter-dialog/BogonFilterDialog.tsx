/**
 * BogonFilterDialog Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <BogonFilterDialog
 *   routerId="router-1"
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={(count) => {
 *     toast.success(`Created ${count} bogon filter rules`);
 *   }}
 * />
 * ```
 *
 * @module @nasnet/ui/patterns/bogon-filter-dialog
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { BogonFilterDialogDesktop } from './BogonFilterDialogDesktop';
import { BogonFilterDialogMobile } from './BogonFilterDialogMobile';

import type { BogonFilterDialogProps } from './bogon-filter-dialog.types';

/**
 * BogonFilterDialog - Bogon IP range filtering wizard
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Sheet with card sections
 * - Tablet/Desktop (>=640px): Dialog with checkbox grid
 */
export const BogonFilterDialog = memo(function BogonFilterDialog(
  props: BogonFilterDialogProps
) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <BogonFilterDialogMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <BogonFilterDialogDesktop {...props} />;
  }
});

BogonFilterDialog.displayName = 'BogonFilterDialog';

export default BogonFilterDialog;
