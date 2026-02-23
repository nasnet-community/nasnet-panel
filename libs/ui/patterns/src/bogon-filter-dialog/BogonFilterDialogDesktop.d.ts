/**
 * BogonFilterDialogDesktop - Desktop Platform Presenter
 *
 * Dialog-based presentation optimized for desktop viewports (>1024px).
 * Features dense checkbox grid layout, all details visible, keyboard navigation support.
 *
 * Platform-Specific Optimizations:
 * - Floating Dialog with max-width constraint
 * - 2-column checkbox grid for efficient space usage
 * - All category descriptions and recommendations visible
 * - Full interface selector dropdown
 * - Supports tab navigation and Enter/Space activation
 * - Hover states for better discoverability
 *
 * @component
 * @internal Used by BogonFilterDialog platform detection wrapper
 *
 * @example
 * ```tsx
 * <BogonFilterDialogDesktop
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
 * Desktop presenter for bogon filter dialog.
 *
 * Renders a floating Dialog with:
 * - 2-column checkbox grid for category selection
 * - Dropdown interface selector
 * - Per-category descriptions and security recommendations
 * - Warning alert for private address blocking
 * - Progress indicator during batch rule creation
 * - Accessible keyboard navigation (Tab, Enter, Space)
 *
 * @param props - Standard bogon filter dialog props
 * @returns Rendered desktop presentation
 */
export declare const BogonFilterDialogDesktop: import("react").NamedExoticComponent<BogonFilterDialogProps>;
//# sourceMappingURL=BogonFilterDialogDesktop.d.ts.map