/**
 * BogonFilterDialog Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * Creates firewall rules to block non-routable IP addresses (bogons) on WAN interfaces.
 * Provides safety recommendations for different bogon categories and warns about
 * private address blocking which could break LAN access.
 *
 * Platform Adaptations:
 * - **Mobile (<640px)**: Bottom sheet with card-based layout, 44px touch targets
 * - **Tablet/Desktop (>=640px)**: Floating dialog with checkbox grid layout
 *
 * @component
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * return (
 *   <>
 *     <Button onClick={() => setOpen(true)}>Configure Bogon Filter</Button>
 *     <BogonFilterDialog
 *       routerId="router-1"
 *       open={open}
 *       onClose={() => setOpen(false)}
 *       onSuccess={(count) => {
 *         toast.success(`Created ${count} bogon filter rules`);
 *       }}
 *       availableInterfaces={['ether1-wan', 'pppoe-out1']}
 *     />
 *   </>
 * );
 * ```
 *
 * @module @nasnet/ui/patterns/bogon-filter-dialog
 * @see [useBogonFilterDialog](./use-bogon-filter-dialog.ts) - Headless hook for dialog logic
 * @see [BogonFilterDialogDesktop](./BogonFilterDialogDesktop.tsx) - Desktop presenter
 * @see [BogonFilterDialogMobile](./BogonFilterDialogMobile.tsx) - Mobile presenter
 * @see [Headless + Platform Presenters Pattern Guide](../../../../../../Docs/design/PLATFORM_PRESENTER_GUIDE.md)
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { BogonFilterDialogDesktop } from './BogonFilterDialogDesktop';
import { BogonFilterDialogMobile } from './BogonFilterDialogMobile';

import type { BogonFilterDialogProps } from './bogon-filter-dialog.types';

/**
 * BogonFilterDialog - Bogon IP range filtering dialog/sheet
 *
 * Automatically detects and renders the platform-appropriate presenter:
 * - Mobile (<640px): Sheet with bottom navigation
 * - Tablet/Desktop (>=640px): Dialog with sidebar
 *
 * Wrapped with React.memo for rendering optimization.
 * displayName set for debugging in React DevTools.
 *
 * @param props - Component props (routerId, open, onClose, onSuccess, availableInterfaces)
 * @returns The appropriate platform presenter component
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
