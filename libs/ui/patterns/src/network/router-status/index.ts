/**
 * Router Status Module
 *
 * Real-time router connection status display with platform-adaptive UI.
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 */

// Main component
export { RouterStatus } from './router-status';

// Platform presenters
export { RouterStatusDesktop } from './router-status-desktop';
export { RouterStatusMobile } from './router-status-mobile';

// Status indicator
export {
  StatusIndicator,
  STATUS_TEXT_COLORS,
  STATUS_BG_COLORS,
} from './status-indicator';

// Headless hooks
export { useRouterStatus } from './use-router-status';
export type { UseRouterStatusConfig } from './use-router-status';

export {
  useRouterStatusSubscription,
  ROUTER_STATUS_CHANGED_SUBSCRIPTION,
} from './use-router-status-subscription';
export type {
  RouterStatusEvent,
  SubscriptionRouter,
  UseRouterStatusSubscriptionReturn,
} from './use-router-status-subscription';

// Types
export type {
  ConnectionStatus,
  ConnectionProtocol,
  RouterStatusProps,
  RouterStatusData,
  UseRouterStatusReturn,
  RouterStatusPresenterProps,
  StatusIndicatorProps,
  StatusIndicatorSize,
} from './types';

// Constants
export { STATUS_LABELS, DEFAULT_MAX_RECONNECT_ATTEMPTS } from './types';
