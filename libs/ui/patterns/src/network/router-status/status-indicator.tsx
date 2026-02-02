/**
 * Status Indicator Component
 *
 * Animated dot/circle for router connection status visualization.
 * Supports multiple sizes and automatic pulse animation for connecting state.
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 */

import { cn } from '@nasnet/ui/primitives';

import type { ConnectionStatus, StatusIndicatorProps, StatusIndicatorSize } from './types';

// ===== Size Mappings =====

/**
 * Tailwind size classes for indicator dot
 */
const SIZE_CLASSES: Record<StatusIndicatorSize, string> = {
  sm: 'h-3 w-3',   // 12px
  md: 'h-4 w-4',   // 16px
  lg: 'h-6 w-6',   // 24px
};

// ===== Color Mappings =====

/**
 * Tailwind color classes for each status
 * Using semantic tokens as per design system
 */
const STATUS_COLOR_CLASSES: Record<ConnectionStatus, string> = {
  CONNECTED: 'bg-semantic-success',
  CONNECTING: 'bg-semantic-warning',
  DISCONNECTED: 'bg-gray-400 dark:bg-gray-500',
  ERROR: 'bg-semantic-error',
};

/**
 * Text color classes for status (for icons/text)
 */
export const STATUS_TEXT_COLORS: Record<ConnectionStatus, string> = {
  CONNECTED: 'text-semantic-success',
  CONNECTING: 'text-semantic-warning',
  DISCONNECTED: 'text-gray-500 dark:text-gray-400',
  ERROR: 'text-semantic-error',
};

/**
 * Background color classes with opacity for badges
 */
export const STATUS_BG_COLORS: Record<ConnectionStatus, string> = {
  CONNECTED: 'bg-semantic-success/10',
  CONNECTING: 'bg-semantic-warning/10',
  DISCONNECTED: 'bg-gray-100 dark:bg-gray-800',
  ERROR: 'bg-semantic-error/10',
};

// ===== Accessible Labels =====

/**
 * Screen reader labels for each status
 */
const STATUS_ARIA_LABELS: Record<ConnectionStatus, string> = {
  CONNECTED: 'Router is connected',
  CONNECTING: 'Router is connecting',
  DISCONNECTED: 'Router is disconnected',
  ERROR: 'Router connection error',
};

// ===== Component =====

/**
 * Status Indicator Component
 *
 * Visual status indicator dot with size variants and animation.
 * Respects prefers-reduced-motion for accessibility.
 *
 * @example
 * ```tsx
 * // Default connected status
 * <StatusIndicator status="CONNECTED" />
 *
 * // Large connecting status with animation
 * <StatusIndicator status="CONNECTING" size="lg" />
 *
 * // Small disconnected without animation
 * <StatusIndicator status="DISCONNECTED" size="sm" animated={false} />
 * ```
 */
export function StatusIndicator({
  status,
  size = 'md',
  animated = true,
  className,
  'aria-label': ariaLabel,
}: StatusIndicatorProps) {
  // Only animate for CONNECTING status
  const shouldAnimate = animated && status === 'CONNECTING';

  return (
    <span
      role="img"
      aria-label={ariaLabel || STATUS_ARIA_LABELS[status]}
      className={cn(
        // Base styles
        'inline-block rounded-full shrink-0',
        // Size
        SIZE_CLASSES[size],
        // Color
        STATUS_COLOR_CLASSES[status],
        // Animation - uses Tailwind animate-pulse which respects prefers-reduced-motion
        shouldAnimate && 'animate-pulse',
        // Custom classes
        className
      )}
    />
  );
}

// For TypeScript consumers who want the color utilities
StatusIndicator.textColors = STATUS_TEXT_COLORS;
StatusIndicator.bgColors = STATUS_BG_COLORS;
