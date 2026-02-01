/**
 * Accessibility (a11y) Module
 * Provides accessibility context and utilities for the application
 *
 * @see NAS-4.17: Implement Accessibility (a11y) Foundation
 */

export {
  A11yProvider,
  useA11y,
  useA11yOptional,
  useReducedMotion,
  useKeyboardUser,
  useHighContrast,
  useAnnounce,
} from './a11y-provider';

export type { A11yContextValue, A11yProviderProps } from './a11y-provider';
