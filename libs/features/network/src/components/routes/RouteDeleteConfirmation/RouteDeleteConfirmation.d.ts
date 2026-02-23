/**
 * RouteDeleteConfirmation Component
 * NAS-6.5: Static Route Management
 *
 * Safety confirmation dialog for route deletion with:
 * - Impact analysis (default route warning)
 * - Type-to-confirm (case-sensitive)
 * - Countdown timer (10s for critical, 5s for standard)
 * - Consequence display
 */
import type { Route } from '@nasnet/api-client/generated';
export interface RouteDeleteConfirmationProps {
    /** The route to delete */
    route: Route;
    /** Dialog open state */
    open: boolean;
    /** Callback when open state changes */
    onOpenChange: (open: boolean) => void;
    /** Callback when user confirms deletion */
    onConfirm: () => Promise<void> | void;
    /** Loading state during deletion */
    loading?: boolean;
}
/**
 * RouteDeleteConfirmation - Safety-first confirmation for route deletion
 *
 * Features:
 * - Impact analysis with severity assessment
 * - Type-to-confirm (user must type exact text)
 * - Countdown timer (prevents accidental clicks)
 * - Case-sensitive matching for critical operations
 * - Detailed consequence display
 *
 * @description Critical operation dialog with countdown and type-to-confirm pattern
 */
declare function RouteDeleteConfirmationComponent({ route, open, onOpenChange, onConfirm, loading, }: RouteDeleteConfirmationProps): import("react/jsx-runtime").JSX.Element;
declare namespace RouteDeleteConfirmationComponent {
    var displayName: string;
}
export declare const RouteDeleteConfirmation: import("react").MemoExoticComponent<typeof RouteDeleteConfirmationComponent>;
export {};
//# sourceMappingURL=RouteDeleteConfirmation.d.ts.map