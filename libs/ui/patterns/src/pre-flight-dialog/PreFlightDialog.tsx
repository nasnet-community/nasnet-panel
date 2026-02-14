/**
 * PreFlightDialog Component
 *
 * Displays insufficient resources error with service selection for stopping.
 * Follows the Headless + Platform Presenter pattern.
 *
 * Features:
 * - Automatic platform detection (mobile vs desktop)
 * - Mobile: Bottom sheet with swipe-to-dismiss
 * - Desktop: Center modal dialog
 * - Live sufficiency check (turns green when enough selected)
 * - Auto-selects suggestions to cover deficit
 * - Optional "Override and Start Anyway" dangerous action
 * - WCAG AAA accessible
 */

import type { PreFlightDialogProps } from './types';
import { PreFlightDialogDesktop } from './PreFlightDialogDesktop';
import { PreFlightDialogMobile } from './PreFlightDialogMobile';

/**
 * PreFlightDialog Component
 *
 * Shows a dialog when there are insufficient resources to start a service.
 * Allows user to select running services to stop to free up memory.
 *
 * **Features:**
 * - Auto-selects suggestions to cover deficit (with 10% buffer)
 * - Live feedback: shows when selection is sufficient (green) or not (gray)
 * - Platform-adaptive: bottom sheet on mobile, modal on desktop
 * - Optional override to start anyway (dangerous)
 *
 * **Accessibility:**
 * - Proper dialog/sheet ARIA attributes
 * - Keyboard navigation support
 * - Screen reader announcements
 * - Focus management
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(true);
 *
 * const error: InsufficientResourcesError = {
 *   resourceType: 'memory',
 *   required: 256,
 *   available: 200,
 *   deficit: 56,
 *   suggestions: [
 *     { id: '1', name: 'Tor', memoryUsage: 64, status: 'running', selected: false },
 *     { id: '2', name: 'Xray', memoryUsage: 32, status: 'running', selected: false },
 *   ],
 * };
 *
 * <PreFlightDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   serviceName="AdGuard Home"
 *   error={error}
 *   onConfirmWithStops={(ids) => console.log('Stop:', ids)}
 *   onOverrideAndStart={() => console.log('Override!')}
 *   allowOverride={true}
 * />
 * ```
 */
export function PreFlightDialog(props: PreFlightDialogProps) {
  const { variant } = props;

  // Determine which presenter to use
  if (variant === 'mobile') {
    return <PreFlightDialogMobile {...props} />;
  }

  if (variant === 'desktop') {
    return <PreFlightDialogDesktop {...props} />;
  }

  // Auto-detect: mobile on small screens, desktop on larger screens
  // For dialogs/sheets, we render only the appropriate variant based on breakpoint
  // This is different from inline components where we render both with CSS hiding
  return (
    <>
      {/* Mobile: shown on small screens (<640px) */}
      <div className="sm:hidden">
        <PreFlightDialogMobile {...props} />
      </div>

      {/* Desktop: shown on larger screens (≥640px) */}
      <div className="hidden sm:block">
        <PreFlightDialogDesktop {...props} />
      </div>
    </>
  );
}

// ===== Exports =====

export { PreFlightDialogMobile, PreFlightDialogDesktop };
export * from './types';
export { usePreFlightDialog } from './usePreFlightDialog';
export type { UsePreFlightDialogReturn } from './usePreFlightDialog';
