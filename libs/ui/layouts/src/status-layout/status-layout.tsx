import * as React from 'react';
import { useCallback } from 'react';

import { X } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

/**
 * Status Layout Component
 *
 * Sticky status/alert banner for displaying temporary status messages.
 * Uses semantic colors to indicate success, warning, error, or info states.
 * Optionally sticky-positioned and dismissible.
 *
 * Features:
 * - Four semantic status states (success, warning, error, info)
 * - Optional sticky positioning
 * - Optional dismiss button with accessible label
 * - Smooth transitions and animations
 * - Semantic HTML (<section> element)
 * - Responsive padding (mobile/desktop)
 * - Uses semantic color tokens (never hardcoded colors)
 * - Full WCAG AAA accessibility support
 *
 * @example
 * ```tsx
 * <StatusLayout
 *   status="error"
 *   visible={isError}
 *   onDismiss={() => setIsError(false)}
 * >
 *   Configuration failed: Please check your settings and try again.
 * </StatusLayout>
 * ```
 *
 * @see {@link StatusLayoutProps} for prop interface
 */

/**
 * StatusLayout component props
 * @interface StatusLayoutProps
 */
export interface StatusLayoutProps {
  /** Content to display inside the status banner */
  children: React.ReactNode;
  /** Semantic status type determining color and context */
  status?: 'success' | 'warning' | 'error' | 'info';
  /** Control visibility of the status banner */
  visible?: boolean;
  /** Whether banner sticks to top of viewport (true) or scrolls (false) */
  sticky?: boolean;
  /** Optional custom className for root element */
  className?: string;
  /** Optional callback when dismiss button is clicked */
  onDismiss?: () => void;
}

/**
 * Maps status values to semantic color token classes
 * Uses semantic tokens: success (green), warning (amber), error (red), info (blue)
 * @internal
 */
const statusClasses = {
  success: 'bg-success text-white border-success',
  warning: 'bg-warning text-white border-warning',
  error: 'bg-error text-white border-error',
  info: 'bg-info text-white border-info',
};

/**
 * StatusLayout - Sticky status/alert banner component
 * Displays temporary status messages with semantic color coding and optional dismiss button.
 * Provides automatic role and aria-live announcements for accessibility.
 */
const StatusLayoutImpl = React.forwardRef<HTMLElement, StatusLayoutProps>(
  (
    {
      children,
      status = 'info',
      visible = true,
      sticky = true,
      className,
      onDismiss,
    },
    ref
  ) => {
    // Memoize dismiss handler for stable reference
    const handleDismiss = useCallback(() => {
      onDismiss?.();
    }, [onDismiss]);

    if (!visible) return null;

    return (
      <section
        ref={ref}
        className={cn(
          'z-30 border-b transition-all duration-200 ease-in-out',
          sticky && 'sticky top-0',
          statusClasses[status],
          className
        )}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="relative px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">{children}</div>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className={cn(
                  'flex-shrink-0 rounded-md p-1',
                  'hover:bg-white/20 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2'
                )}
                aria-label="Dismiss status message"
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }
);

StatusLayoutImpl.displayName = 'StatusLayout';

/**
 * StatusLayout - Sticky status/alert banner
 */
const StatusLayout = React.memo(StatusLayoutImpl);

export { StatusLayout };




























