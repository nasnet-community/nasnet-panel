/**
 * FormSection Types
 *
 * TypeScript interfaces for the FormSection component system.
 * Provides consistent form section wrapper with collapsibility.
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */

import type { ReactNode } from 'react';

/**
 * Props for the main FormSection component.
 *
 * @example
 * ```tsx
 * <FormSection
 *   title="Network Settings"
 *   description="Configure your network connection"
 *   collapsible
 *   errors={['IP address is invalid']}
 * >
 *   <FormField name="ipAddress" />
 * </FormSection>
 * ```
 */
export interface FormSectionProps {
  /** Section title displayed in header */
  title: string;

  /** Optional description text below title */
  description?: string;

  /** Whether section can be collapsed (default: false) */
  collapsible?: boolean;

  /** Initial expanded state when collapsible (default: true) */
  defaultOpen?: boolean;

  /** Section children (form fields) */
  children: ReactNode;

  /** Array of error messages for this section */
  errors?: string[];

  /** Unique key for localStorage persistence (defaults to slugified title) */
  storageKey?: string;

  /** Help content ID for integration with Help System (NAS-4A.12) */
  helpId?: string;

  /** Optional className for custom styling */
  className?: string;

  /**
   * Whether to use fieldset/legend semantic HTML.
   * Recommended for forms (default: true for non-collapsible, false for collapsible)
   */
  asFieldset?: boolean;
}

/**
 * Props for the FormSectionHeader subcomponent.
 */
export interface FormSectionHeaderProps {
  /** Section title */
  title: string;

  /** Optional description text */
  description?: string;

  /** Whether section is collapsible */
  isCollapsible: boolean;

  /** Current expanded state */
  isExpanded: boolean;

  /** Toggle callback */
  onToggle: () => void;

  /** Help content ID */
  helpId?: string;

  /** Number of errors in section */
  errorCount?: number;

  /** Unique IDs for accessibility */
  headingId: string;
  contentId: string;

  /** Whether reduced motion is preferred */
  reducedMotion: boolean;
}

/**
 * Props for the FormSectionErrors subcomponent.
 */
export interface FormSectionErrorsProps {
  /** Array of error messages to display */
  errors: string[];

  /** Optional className for custom styling */
  className?: string;
}

/**
 * Configuration for the useFormSection hook.
 */
export interface UseFormSectionConfig {
  /** Unique storage key for localStorage persistence */
  storageKey: string;

  /** Initial expanded state (default: true) */
  defaultOpen?: boolean;

  /** Whether section is collapsible (default: false) */
  collapsible?: boolean;
}

/**
 * Return type for the useFormSection hook.
 */
export interface UseFormSectionReturn {
  /** Whether section is currently expanded */
  isExpanded: boolean;

  /** Toggle between expanded and collapsed */
  toggle: () => void;

  /** Expand the section */
  expand: () => void;

  /** Collapse the section */
  collapse: () => void;
}
