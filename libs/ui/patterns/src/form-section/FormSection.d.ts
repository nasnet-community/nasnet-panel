/**
 * FormSection Component
 *
 * A consistent form section wrapper that provides uniform structure,
 * validation display, and collapsibility across all forms.
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */
import type { FormSectionProps } from './form-section.types';
/**
 * FormSection provides consistent structure for form sections.
 *
 * Features:
 * - Section title with optional help integration
 * - Error summary display at section level
 * - Collapsible behavior with smooth animations
 * - State persistence via localStorage
 * - Platform-responsive design (mobile/desktop)
 * - Full WCAG AAA accessibility compliance
 *
 * Semantic HTML:
 * - Non-collapsible sections use `<fieldset>` with `<legend>` for form context
 * - Collapsible sections use `<section>` with `aria-labelledby` for proper accessibility
 *
 * @example
 * ```tsx
 * // Basic non-collapsible section
 * <FormSection title="Network Settings" description="Configure your network">
 *   <FormField name="ipAddress" />
 *   <FormField name="subnet" />
 * </FormSection>
 *
 * // Collapsible section with errors
 * <FormSection
 *   title="Advanced Options"
 *   collapsible
 *   defaultOpen={false}
 *   errors={['MTU must be between 68 and 65535']}
 * >
 *   <FormField name="mtu" />
 * </FormSection>
 * ```
 */
export declare function FormSection({ title, description, collapsible, defaultOpen, children, errors, storageKey, helpId, className, asFieldset, }: FormSectionProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=FormSection.d.ts.map