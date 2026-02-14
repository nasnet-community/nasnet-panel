/**
 * PreFlightDialog Pattern Component
 *
 * Insufficient resources dialog with service selection.
 * Follows the Headless + Platform Presenter pattern.
 */

export {
  PreFlightDialog,
  PreFlightDialogMobile,
  PreFlightDialogDesktop,
  usePreFlightDialog,
} from './PreFlightDialog';

export type {
  PreFlightDialogProps,
  ServiceSuggestion,
  InsufficientResourcesError,
} from './types';

export type { UsePreFlightDialogReturn } from './usePreFlightDialog';
