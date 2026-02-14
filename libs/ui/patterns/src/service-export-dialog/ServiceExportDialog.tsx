/**
 * ServiceExportDialog - Entry point component
 * Routes to appropriate presenter based on platform detection
 */

import { usePlatform } from '../hooks/usePlatform';
import { ServiceExportDialogDesktop } from './ServiceExportDialogDesktop';
import { ServiceExportDialogTablet } from './ServiceExportDialogTablet';
import { ServiceExportDialogMobile } from './ServiceExportDialogMobile';
import type { ServiceExportDialogProps } from './types';

/**
 * ServiceExportDialog - Platform-adaptive service export dialog
 *
 * Automatically renders the appropriate presenter based on screen size:
 * - Mobile (<640px): Full-screen sheet with 44px touch targets
 * - Tablet (640-1024px): Hybrid dialog with touch-friendly spacing
 * - Desktop (>1024px): Standard dialog with dense layout
 *
 * @example
 * ```tsx
 * <ServiceExportDialog
 *   routerID="router-1"
 *   instance={serviceInstance}
 *   onExportComplete={(format, url) => {
 *     toast.success(`Exported as ${format}`);
 *   }}
 * />
 * ```
 */
export function ServiceExportDialog(props: ServiceExportDialogProps) {
  const platform = usePlatform();

  if (platform === 'mobile') {
    return <ServiceExportDialogMobile {...props} />;
  }

  if (platform === 'tablet') {
    return <ServiceExportDialogTablet {...props} />;
  }

  return <ServiceExportDialogDesktop {...props} />;
}
