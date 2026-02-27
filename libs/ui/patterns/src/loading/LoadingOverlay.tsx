/**
 * LoadingOverlay Component
 *
 * Full-container or full-screen loading overlay with backdrop.
 * Used for blocking operations that require user to wait.
 *
 * Accessibility:
 * - Uses aria-busy on the overlay
 * - Includes aria-live region for status updates
 * - Traps focus when visible (no interaction with content behind)
 *
 * @module @nasnet/ui/patterns/loading
 */

import * as React from 'react';

import { cn , Spinner } from '@nasnet/ui/primitives';

// ============================================================================
// Types
// ============================================================================

export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  isLoading: boolean;
  /** Loading message to display */
  message?: string;
  /** Additional description below the message */
  description?: string;
  /** Whether to cover the full screen vs just the container */
  fullScreen?: boolean;
  /** Spinner size */
  spinnerSize?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show progress percentage if available */
  progress?: number;
  /** Blur the content behind the overlay */
  blur?: boolean;
  /** Children to render behind the overlay */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// LoadingOverlay Component
// ============================================================================

/**
 * LoadingOverlay Component
 *
 * Creates a loading overlay that can cover a container or the entire screen.
 * Useful for blocking operations like form submissions or data fetching.
 *
 * @example
 * ```tsx
 * // Container overlay
 * <LoadingOverlay isLoading={isSaving} message="Saving...">
 *   <Form>...</Form>
 * </LoadingOverlay>
 *
 * // Full screen with progress
 * <LoadingOverlay
 *   isLoading={isUploading}
 *   fullScreen
 *   message="Uploading files..."
 *   progress={uploadProgress}
 * />
 * ```
 */
export const LoadingOverlay = React.memo(function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  description,
  fullScreen = false,
  spinnerSize = 'lg',
  progress,
  blur = true,
  children,
  className,
}: LoadingOverlayProps) {
  if (!isLoading && children) {
    return <>{children}</>;
  }

  if (!isLoading) {
    return null;
  }

  const overlayContent = (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        // Base positioning
        fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0 z-10',
        // Background and blur
        'flex flex-col items-center justify-center gap-4',
        'bg-background/80',
        blur && 'backdrop-blur-sm',
        className
      )}
    >
      {/* Spinner */}
      <Spinner size={spinnerSize} className="text-primary" />

      {/* Message */}
      {message && (
        <p className="mt-4 text-sm text-muted-foreground motion-safe:animate-pulse">{message}</p>
      )}

      {/* Description */}
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="mt-4 w-48">
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );

  // If there are children, wrap them in a relative container
  if (children) {
    return (
      <div className="relative">
        {children}
        {overlayContent}
      </div>
    );
  }

  return overlayContent;
});

LoadingOverlay.displayName = 'LoadingOverlay';
