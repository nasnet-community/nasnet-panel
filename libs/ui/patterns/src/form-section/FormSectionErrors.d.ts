/**
 * FormSectionErrors Component
 *
 * Displays a summary of validation errors at the section level.
 * Uses semantic error color tokens for accessibility.
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */
import type { FormSectionErrorsProps } from './form-section.types';
/**
 * FormSectionErrors displays validation errors for a form section.
 *
 * Features:
 * - Error count summary
 * - Individual error message list
 * - Semantic error styling (red/error color tokens)
 * - Accessible with proper ARIA live region
 *
 * @example
 * ```tsx
 * <FormSectionErrors
 *   errors={[
 *     'IP address is invalid',
 *     'Subnet mask is required',
 *   ]}
 * />
 * ```
 */
export declare function FormSectionErrors({ errors, className, }: FormSectionErrorsProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=FormSectionErrors.d.ts.map