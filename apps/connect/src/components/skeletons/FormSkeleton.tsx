/**
 * FormSkeleton Component
 *
 * Loading skeleton for form views.
 * Used for configuration forms, settings pages, etc.
 *
 * @module @/components/skeletons/FormSkeleton
 */

import { Skeleton , cn } from '@nasnet/ui/primitives';

export interface FormSkeletonProps {
  /** Number of form field groups to display */
  fields?: number;
  /** Show section dividers */
  showSections?: boolean;
  /** Number of sections (if showSections is true) */
  sections?: number;
  /** Show form actions (submit/cancel buttons) */
  showActions?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FormSkeleton Component
 *
 * Provides a skeleton layout for form pages:
 * - Section headers
 * - Form fields with labels
 * - Helper text
 * - Action buttons
 *
 * @example
 * ```tsx
 * // Simple form
 * <FormSkeleton fields={5} showActions />
 *
 * // Sectioned form
 * <FormSkeleton sections={3} fields={4} showSections showActions />
 * ```
 */
export function FormSkeleton({
  fields = 5,
  showSections = false,
  sections = 2,
  showActions = true,
  className,
}: FormSkeletonProps) {
  const renderFields = (count: number) => (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          {/* Label */}
          <Skeleton className="h-4 w-24" />
          {/* Input */}
          <Skeleton className="h-10 w-full max-w-md" />
          {/* Helper text (50% chance) */}
          {i % 2 === 0 && <Skeleton className="h-3 w-48" />}
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={cn('space-y-8', className)}
      aria-busy="true"
      aria-label="Loading form"
    >
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Form Content */}
      {showSections ? (
        // Sectioned layout
        <div className="space-y-8">
          {Array.from({ length: sections }).map((_, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              {/* Section header */}
              <div className="border-b pb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-1 h-3 w-56" />
              </div>
              {/* Section fields */}
              {renderFields(Math.ceil(fields / sections))}
            </div>
          ))}
        </div>
      ) : (
        // Flat layout
        renderFields(fields)
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-3 pt-4 border-t">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      )}
    </div>
  );
}

FormSkeleton.displayName = 'FormSkeleton';
