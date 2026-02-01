/**
 * Network Error - Network/connectivity error display component
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

export { NetworkErrorDisplay } from './NetworkErrorDisplay';
export type { NetworkErrorDisplayProps, NetworkErrorType } from './NetworkErrorDisplay';

// Re-export offline indicator components for convenience
export {
  OfflineIndicator,
  OfflineIndicatorCompact,
  useNetworkStatus,
} from '../offline-indicator';
export type {
  OfflineIndicatorProps,
  OfflineIndicatorCompactProps,
} from '../offline-indicator';
