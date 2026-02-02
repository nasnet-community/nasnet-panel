/**
 * FormSection Component Exports
 *
 * Provides consistent form section wrapper with collapsibility,
 * validation display, and accessibility compliance.
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */

// Main component
export { FormSection } from './FormSection';

// Sub-components
export { FormSectionHeader } from './FormSectionHeader';
export { FormSectionErrors } from './FormSectionErrors';

// Hook
export { useFormSection, slugify } from './useFormSection';

// Types
export type {
  FormSectionProps,
  FormSectionHeaderProps,
  FormSectionErrorsProps,
  UseFormSectionConfig,
  UseFormSectionReturn,
} from './form-section.types';
