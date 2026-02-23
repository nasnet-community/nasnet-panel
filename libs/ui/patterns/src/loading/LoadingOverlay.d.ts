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
export declare const LoadingOverlay: React.NamedExoticComponent<LoadingOverlayProps>;
//# sourceMappingURL=LoadingOverlay.d.ts.map