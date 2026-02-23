/**
 * Router Card Component
 * Displays individual router information in a card format
 */
import type { Router } from '@nasnet/core/types';
export interface RouterCardProps {
    /**
     * Router data to display
     */
    router: Router;
    /**
     * Whether this router is currently selected
     */
    isSelected?: boolean;
    /**
     * Callback when router is clicked
     */
    onClick?: (router: Router) => void;
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
     * Optional CSS class name
     */
    className?: string;
}
/**
 * RouterCard Component
 *
 * @description Displays router information in a card with actions.
 *
 * @example
 * ```tsx
 * <RouterCard
 *   router={router}
 *   isSelected={selectedId === router.id}
 *   onClick={(r) => selectRouter(r.id)}
 *   onConnect={(r) => connectToRouter(r)}
 *   onRemove={(r) => removeRouter(r.id)}
 * />
 * ```
 */
export declare const RouterCard: import("react").NamedExoticComponent<RouterCardProps>;
//# sourceMappingURL=RouterCard.d.ts.map