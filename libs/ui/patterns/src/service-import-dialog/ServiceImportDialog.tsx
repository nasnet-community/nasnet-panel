/**
 * ServiceImportDialog - Entry point component
 * Routes to appropriate presenter based on platform detection
 */

import { usePlatform } from '@nasnet/ui/layouts';

import { ServiceImportDialogDesktop } from './ServiceImportDialogDesktop';
import { ServiceImportDialogMobile } from './ServiceImportDialogMobile';
import { ServiceImportDialogTablet } from './ServiceImportDialogTablet';

import type { ServiceImportDialogProps } from './types';

/**
 * ServiceImportDialog - Platform-adaptive service import dialog
 *
 * Automatically renders the appropriate presenter based on screen size:
 * - Mobile (<640px): Full-screen sheet with 44px touch targets
 * - Tablet (640-1024px): Hybrid dialog with touch-friendly spacing
 * - Desktop (>1024px): Standard dialog with dense layout
 *
 * Multi-step wizard: select → validate → resolve → importing → complete
 *
 * @example
 * ```tsx
 * <ServiceImportDialog
 *   routerID="router-1"
 *   onImportComplete={(instanceID) => {
 *     toast.success(`Imported ${instanceID}`);
 *   }}
 * />
 * ```
 */
export function ServiceImportDialog(props: ServiceImportDialogProps) {
  const platform = usePlatform();

  if (platform === 'mobile') {
    return <ServiceImportDialogMobile {...props} />;
  }

  if (platform === 'tablet') {
    return <ServiceImportDialogTablet {...props} />;
  }

  return <ServiceImportDialogDesktop {...props} />;
}
