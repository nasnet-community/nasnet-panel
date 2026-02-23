/**
 * Router Status Mobile Presenter
 *
 * Compact badge design for mobile screens.
 * Expands to bottom sheet with full details on tap.
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 * @see ADR-018: Headless + Platform Presenters
 */
import type { RouterStatusPresenterProps } from './types';
/**
 * Mobile presenter for Router Status component.
 *
 * Compact badge that expands to bottom sheet:
 * - Badge shows status indicator + text
 * - Bottom sheet shows full details + actions
 * - 44px minimum touch targets
 *
 * @example
 * ```tsx
 * const state = useRouterStatus({ routerId: 'router-1' });
 * <RouterStatusMobile state={state} />
 * ```
 */
export declare function RouterStatusMobile({ state, className }: RouterStatusPresenterProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=router-status-mobile.d.ts.map