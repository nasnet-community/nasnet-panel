/**
 * useReducedMotion Hook
 *
 * Detects user's preference for reduced motion from system settings.
 * Used to disable animations for accessibility (WCAG 2.1 SC 2.3.3).
 *
 * @module @nasnet/core/utils/hooks/useReducedMotion
 */

import { useState, useEffect } from 'react';

/**
 * Hook to detect if user prefers reduced motion.
 *
 * Respects the prefers-reduced-motion media query, which users
 * can set in their operating system accessibility settings. This hook
 * sets up a listener and updates the return value when the preference changes.
 *
 * @returns true if user prefers reduced motion, false otherwise
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = useReducedMotion();
 *
 *   return (
 *     <div className={prefersReducedMotion ? '' : 'animate-pulse'}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useReducedMotion(): boolean {
  // Default to false during SSR
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if the media query API is available
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers use addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Static check for reduced motion preference.
 *
 * Use this for non-reactive contexts (e.g., CSS-in-JS at module level).
 * This function does not set up event listeners, making it suitable for
 * one-time checks outside of React components.
 *
 * @returns true if user prefers reduced motion, false otherwise
 *
 * @example
 * ```tsx
 * // At module level or outside React
 * const prefersReduced = getReducedMotionPreference();
 * const animationDuration = prefersReduced ? 0 : 300;
 * ```
 */
export function getReducedMotionPreference(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
