/**
 * Type Definitions for CStepper (Content Stepper)
 *
 * Three-column desktop wizard layout with:
 * - Left (280px): Vertical stepper sidebar
 * - Center (flexible): Step content area with forms
 * - Right (320px): Collapsible live preview panel
 *
 * @see NAS-4A.17: Build Content Stepper (Desktop with Preview)
 * @see ADR-017: Three-Layer Component Architecture
 * @see ADR-018: Headless + Platform Presenters
 */

import type { UseStepperReturn } from '../../hooks/use-stepper.types';

// ===== CStepper Props =====

/**
 * Props for the CStepper (Content Stepper) component
 *
 * @example
 * ```tsx
 * const stepper = useStepper({ steps, onComplete });
 *
 * <CStepper
 *   stepper={stepper}
 *   stepContent={<WizardStepContent step={stepper.currentStep.id} />}
 *   previewContent={<ConfigPreview script={generatedScript} />}
 * />
 * ```
 */
export interface CStepperProps {
  /**
   * Stepper state from useStepper hook (required)
   * Provides navigation, validation, and step management
   */
  stepper: UseStepperReturn;

  /**
   * Current step's form content (required)
   * Rendered in the center content area
   */
  stepContent: React.ReactNode;

  /**
   * Live preview content (optional)
   * Rendered in the right preview panel
   * Examples: RouterOS script, network topology, configuration diff
   */
  previewContent?: React.ReactNode;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Preview panel title (default: 'Preview')
   */
  previewTitle?: string;

  /**
   * Show preview panel by default (default: true)
   * Auto-collapses below 1280px viewport width
   */
  defaultShowPreview?: boolean;

  /**
   * ARIA label for the component (default: 'Configuration wizard')
   */
  'aria-label'?: string;

  /**
   * Callback when preview panel visibility changes
   */
  onPreviewToggle?: (visible: boolean) => void;

  /**
   * Width of the sidebar (default: 280px)
   */
  sidebarWidth?: string | number;

  /**
   * Width of the preview panel (default: 320px)
   */
  previewWidth?: string | number;

  /**
   * Show step descriptions in the sidebar (default: true)
   */
  showStepDescriptions?: boolean;

  /**
   * Custom navigation buttons (replaces default Previous/Next)
   */
  customNavigation?: React.ReactNode;

  /**
   * Labels for navigation buttons
   */
  navigationLabels?: {
    previous?: string;
    next?: string;
    complete?: string;
  };
}

// ===== CStepperPreview Props =====

/**
 * Props for the CStepperPreview (Preview Panel) component
 */
export interface CStepperPreviewProps {
  /**
   * Preview content to display
   */
  children: React.ReactNode;

  /**
   * Panel title (default: 'Preview')
   */
  title?: string;

  /**
   * Callback when close button is clicked
   */
  onClose: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Width of the preview panel (default: 320px)
   */
  width?: string | number;
}

// ===== CStepperContent Props =====

/**
 * Props for the CStepperContent (Center Content) component
 */
export interface CStepperContentProps {
  /**
   * Step content to display
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Maximum width of content area (default: 640px)
   */
  maxWidth?: string | number;
}

// ===== StepperNavigation Props =====

/**
 * Props for the internal StepperNavigation component
 */
export interface StepperNavigationProps {
  /**
   * Stepper state from useStepper hook
   */
  stepper: UseStepperReturn;

  /**
   * Custom labels for navigation buttons
   */
  labels?: {
    previous?: string;
    next?: string;
    complete?: string;
  };

  /**
   * Additional CSS classes
   */
  className?: string;
}

// ===== PreviewToggleButton Props =====

/**
 * Props for the floating preview toggle button
 */
export interface PreviewToggleButtonProps {
  /**
   * Callback when button is clicked
   */
  onClick: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Button label (default: 'Preview')
   */
  label?: string;
}

// ===== Keyboard Shortcuts =====

/**
 * Keyboard shortcuts for CStepper
 */
export interface CStepperKeyboardShortcuts {
  /** Toggle preview panel (default: Alt+P) */
  togglePreview: string;
  /** Go to next step (default: Alt+N) */
  nextStep: string;
  /** Go to previous step (default: Alt+B) */
  previousStep: string;
}

/**
 * Default keyboard shortcuts
 */
export const DEFAULT_KEYBOARD_SHORTCUTS: CStepperKeyboardShortcuts = {
  togglePreview: 'Alt+P',
  nextStep: 'Alt+N',
  previousStep: 'Alt+B',
};
