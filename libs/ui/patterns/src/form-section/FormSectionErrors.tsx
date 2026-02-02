/**
 * FormSectionErrors Component
 *
 * Displays a summary of validation errors at the section level.
 * Uses semantic error color tokens for accessibility.
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */

import * as React from 'react';

import { AlertCircle } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

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
export function FormSectionErrors({
  errors,
  className,
}: FormSectionErrorsProps) {
  // Don't render if no errors
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'p-3 rounded-md',
        'bg-error/10 border border-error/30',
        className
      )}
    >
      {/* Error count header */}
      <div className="flex items-center gap-2 text-error font-medium mb-2">
        <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span>
          {errors.length} {errors.length === 1 ? 'error' : 'errors'} in this
          section
        </span>
      </div>

      {/* Error list */}
      <ul
        className="list-disc list-inside space-y-1 text-sm text-error"
        aria-label="Error list"
      >
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
