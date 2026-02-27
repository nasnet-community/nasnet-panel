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
  sm: 'h-3 w-3', // 12px
  md: 'h-4 w-4', // 16px
  lg: 'h-6 w-6', // 24px
};

// ===== Color Mappings =====

/**
 * Tailwind color classes for each status
 * Using semantic tokens as per design system
 */
const STATUS_COLOR_CLASSES: Record<ConnectionStatus, string> = {
  CONNECTED: 'bg-success',
  CONNECTING: 'bg-warning',
  DISCONNECTED: 'bg-muted-foreground',
  ERROR: 'bg-error',
};

/**
 * Text color classes for status (for icons/text)
 */
export const STATUS_TEXT_COLORS: Record<ConnectionStatus, string> = {
  CONNECTED: 'text-success',
  CONNECTING: 'text-warning',
  DISCONNECTED: 'text-muted-foreground',
  ERROR: 'text-error',
};

/**
 * Background color classes with opacity for badges
 */
export const STATUS_BG_COLORS: Record<ConnectionStatus, string> = {
  CONNECTED: 'bg-success/10',
  CONNECTING: 'bg-warning/10',
  DISCONNECTED: 'bg-muted',
  ERROR: 'bg-error/10',
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
        'inline-block shrink-0 rounded-full',
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
