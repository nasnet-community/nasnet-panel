/**
 * Router Status Desktop Presenter
 *
 * Information-dense card layout for desktop/tablet screens.
 * Shows full status details, protocol info, and action menu.
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 * @see ADR-018: Headless + Platform Presenters
 */
import type { RouterStatusPresenterProps } from './types';
/**
 * Desktop presenter for Router Status component.
 *
 * Card layout with:
 * - Status indicator with label
 * - Protocol and latency details
 * - Router model and version
 * - Action dropdown menu (Refresh, Reconnect, Disconnect)
 *
 * @example
 * ```tsx
 * const state = useRouterStatus({ routerId: 'router-1' });
 * <RouterStatusDesktop state={state} />
 * ```
 */
declare function RouterStatusDesktopComponent({ state, className }: RouterStatusPresenterProps): import("react/jsx-runtime").JSX.Element;
/**
 * Memoized RouterStatusDesktop component
 */
export declare const RouterStatusDesktop: import("react").MemoExoticComponent<typeof RouterStatusDesktopComponent>;
export {};
//# sourceMappingURL=router-status-desktop.d.ts.map