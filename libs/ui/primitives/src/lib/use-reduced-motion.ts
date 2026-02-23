/**
 * Hook to detect user's motion preference
 *
 * Returns true if the user has prefers-reduced-motion set to reduce
 * This is used to disable animations and transitions for accessibility
 *
 * @returns {boolean} True if reduced motion is preferred
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 * return (
 *   <div className={!prefersReducedMotion && 'transition-all duration-300'}>
 *     Animated content
 *   </div>
 * );
 * ```
 */
export function useReducedMotion(): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  // Check the prefers-reduced-motion media query
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}
