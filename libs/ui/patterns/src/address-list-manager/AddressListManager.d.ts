/**
 * AddressListManager Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * CRITICAL: Layer 2 pattern - receives data via props, does NOT fetch data.
 *
 * @example
 * ```tsx
 * // Layer 3 (Domain) - Fetches data
 * function AddressListView() {
 *   const { data, isLoading } = useAddressLists(routerId);
 *
 *   return (
 *     <AddressListManager
 *       lists={data ?? []}
 *       isLoading={isLoading}
 *       onDeleteList={handleDelete}
 *     />
 *   );
 * }
 * ```
 *
 * @see ADR-018: Headless Platform Presenters
 * @see NAS-7.3: Implement Address Lists
 */
import type { AddressListManagerProps } from './types';
/**
 * AddressListManager - Address list display with expandable entries
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Touch-optimized with Sheet panels and large touch targets (44px)
 * - Tablet (640-1024px): Master-detail layout with collapsible panels
 * - Desktop (>1024px): Dense table with sortable columns, expandable rows, and virtualization
 *
 * Features:
 * - View address lists with entry counts and statistics
 * - Expand lists to view entries (inline on desktop, Sheet on mobile/tablet)
 * - Show firewall rules referencing each list
 * - Sortable columns (desktop only)
 * - Virtualization for 10,000+ entry lists
 * - Firewall category accent color (Orange)
 * - Full keyboard navigation and screen reader support
 *
 * @see {@link AddressListManagerProps} for component props
 * @see {@link useAddressListManagerState} for headless hook
 */
declare function AddressListManagerComponent(props: AddressListManagerProps): import("react/jsx-runtime").JSX.Element;
export declare const AddressListManager: import("react").MemoExoticComponent<typeof AddressListManagerComponent>;
export {};
//# sourceMappingURL=AddressListManager.d.ts.map