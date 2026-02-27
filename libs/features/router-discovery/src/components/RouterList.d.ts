/**
 * Router List Component
 * Displays a list of discovered/added routers
 */
import type { Router } from '@nasnet/core/types';
export interface RouterListProps {
  /**
   * Array of routers to display
   */
  routers: Router[];
  /**
   * ID of currently selected router
   */
  selectedRouterId?: string | null;
  /**
   * Callback when router is selected
   */
  onRouterSelect?: (router: Router) => void;
  /**
   * Callback when router is double-clicked
   */
  onDoubleClick?: (router: Router) => void;
  /**
   * Callback when connect button is clicked
   */
  onConnect?: (router: Router) => void;
  /**
   * Callback when remove button is clicked
   */
  onRemove?: (router: Router) => void;
  /**
   * Custom empty state component
   */
  emptyState?: React.ReactNode;
  /**
   * Optional CSS class name
   */
  className?: string;
}
/**
 * RouterList Component
 *
 * @description Displays a grid of router cards with filtering and actions.
 *
 * @example
 * ```tsx
 * <RouterList
 *   routers={allRouters}
 *   selectedRouterId={selectedId}
 *   onRouterSelect={(r) => setSelectedId(r.id)}
 *   onConnect={(r) => handleConnect(r)}
 *   onRemove={(r) => handleRemove(r)}
 * />
 * ```
 */
export declare const RouterList: import('react').NamedExoticComponent<RouterListProps>;
//# sourceMappingURL=RouterList.d.ts.map
