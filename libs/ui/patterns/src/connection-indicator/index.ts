/**
 * Connection Indicator exports
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 */

// Main component with platform presenters
export {
  ConnectionIndicator,
  ConnectionIndicatorMobile,
  ConnectionIndicatorDesktop,
  type ConnectionIndicatorProps,
} from './ConnectionIndicator';

// Headless hook for custom implementations
export {
  useConnectionIndicator,
  type ConnectionIndicatorState,
  type StatusColor,
} from './useConnectionIndicator';
