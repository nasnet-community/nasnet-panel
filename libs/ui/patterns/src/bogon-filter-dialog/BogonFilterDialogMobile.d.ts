/**
 * BogonFilterDialogMobile - Mobile Platform Presenter
 *
 * Sheet-based presentation optimized for mobile viewports (<640px).
 * Features bottom-sheet layout, 44px touch targets, progressive disclosure.
 *
 * Platform-Specific Optimizations:
 * - Bottom sheet (side="bottom") for thumb-friendly navigation
 * - 44px minimum touch targets on all interactive elements
 * - Card-based vertical layout (single column)
 * - Simplified category display (no grid, stackable cards)
 * - Full-width action buttons
 * - Touch-friendly spacing (p-3, gap-3)
 * - Swipe-to-close gesture support (native Sheet behavior)
 *
 * @component
 * @internal Used by BogonFilterDialog platform detection wrapper
 *
 * @example
 * ```tsx
 * <BogonFilterDialogMobile
 *   routerId="router-1"
 *   open={true}
 *   onClose={() => {}}
 *   onSuccess={(count) => console.log(`Created ${count} rules`)}
 *   availableInterfaces={['ether1-wan', 'pppoe-out1']}
 * />
 * ```
 *
 * @module @nasnet/ui/patterns/bogon-filter-dialog
 * @see [BogonFilterDialog](./BogonFilterDialog.tsx) - Auto-detecting wrapper
 * @see [useBogonFilterDialog](./use-bogon-filter-dialog.ts) - Headless logic hook
 */
import type { BogonFilterDialogProps } from './bogon-filter-dialog.types';
/**
 * Mobile presenter for bogon filter dialog.
 *
 * Renders a bottom Sheet with:
 * - 44px minimum touch targets for accessibility
 * - Card-based vertical layout
 * - Simplified category display (stacked, not gridded)
 * - Full-width action buttons (h-11 for comfortable tapping)
 * - Warning alert for private address blocking
 * - Progress indicator during batch rule creation
 * - Touch-friendly spacing and swipe gesture support
 *
 * @param props - Standard bogon filter dialog props
 * @returns Rendered mobile presentation
 */
export declare const BogonFilterDialogMobile: import("react").NamedExoticComponent<BogonFilterDialogProps>;
//# sourceMappingURL=BogonFilterDialogMobile.d.ts.map