/**
 * useBreakpoint Hook
 * Detects current viewport breakpoint using ResizeObserver for performance
 *
 * Breakpoints aligned with Tailwind CSS and design tokens:
 * - mobile: <640px (sm)
 * - tablet: 640-1024px (sm to lg)
 * - desktop: >1024px (lg+)
 *
 * @see ADR-018: Headless Platform Presenters
 * @see Docs/design/ux-design/2-core-user-experience.md Section 2.3
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Breakpoint thresholds (in pixels)
 * Aligned with Tailwind CSS screens and design tokens
 */
export const BREAKPOINTS = {
  /** Mobile to tablet transition */
  SM: 640,
  /** Optional intermediate breakpoint */
  MD: 768,
  /** Tablet to desktop transition */
  LG: 1024,
  /** Large desktop */
  XL: 1280,
} as const;

/**
 * Breakpoint identifier
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Detect breakpoint from width
 */
function detectBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.SM) return 'xs';
  if (width < BREAKPOINTS.MD) return 'sm';
  if (width < BREAKPOINTS.LG) return 'md';
  if (width < BREAKPOINTS.XL) return 'lg';
  return 'xl';
}

/**
 * Debounce function for performance optimization
 */
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Get current viewport width safely (SSR-compatible)
 */
function getViewportWidth(): number {
  if (typeof window === 'undefined') return 1024; // Default to desktop for SSR
  return window.innerWidth;
}

/**
 * Hook to detect current breakpoint
 *
 * Features:
 * - Uses ResizeObserver for efficient updates (not window.resize)
 * - Debounced (100ms) to prevent excessive re-renders
 * - SSR-compatible with desktop default
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns Current breakpoint identifier
 *
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint();
 * // breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 *
 * if (breakpoint === 'xs' || breakpoint === 'sm') {
 *   // Mobile-specific logic
 * }
 * ```
 */
export function useBreakpoint(debounceMs = 100): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
    detectBreakpoint(getViewportWidth())
  );

  const updateBreakpoint = useCallback(() => {
    const width = getViewportWidth();
    const newBreakpoint = detectBreakpoint(width);
    setBreakpoint((prev) => (prev !== newBreakpoint ? newBreakpoint : prev));
  }, []);

  const debouncedUpdateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Skip on server
    if (typeof window === 'undefined') return;

    // Create debounced update function
    debouncedUpdateRef.current = debounce(updateBreakpoint, debounceMs);

    // Use ResizeObserver on document body for performance
    // (More efficient than window.resize for detecting viewport changes)
    const resizeObserver = new ResizeObserver(() => {
      debouncedUpdateRef.current?.();
    });

    // Observe document element (viewport changes)
    resizeObserver.observe(document.documentElement);

    // Initial update (in case SSR value differs)
    updateBreakpoint();

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateBreakpoint, debounceMs]);

  return breakpoint;
}

/**
 * Hook to get viewport width as a number
 * Useful for more granular responsive logic
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns Current viewport width in pixels
 */
export function useViewportWidth(debounceMs = 100): number {
  const [width, setWidth] = useState<number>(() => getViewportWidth());

  const debouncedUpdateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateWidth = () => {
      setWidth(getViewportWidth());
    };

    debouncedUpdateRef.current = debounce(updateWidth, debounceMs);

    const resizeObserver = new ResizeObserver(() => {
      debouncedUpdateRef.current?.();
    });

    resizeObserver.observe(document.documentElement);
    updateWidth();

    return () => {
      resizeObserver.disconnect();
    };
  }, [debounceMs]);

  return width;
}

/**
 * Check if viewport is at least the given breakpoint
 *
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint();
 * const isAtLeastTablet = isBreakpointAtLeast(breakpoint, 'sm');
 * ```
 */
export function isBreakpointAtLeast(
  current: Breakpoint,
  target: Breakpoint
): boolean {
  const order: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  return order.indexOf(current) >= order.indexOf(target);
}

/**
 * Check if viewport is at most the given breakpoint
 */
export function isBreakpointAtMost(
  current: Breakpoint,
  target: Breakpoint
): boolean {
  const order: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  return order.indexOf(current) <= order.indexOf(target);
}
