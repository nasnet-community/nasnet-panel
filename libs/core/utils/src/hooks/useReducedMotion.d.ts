/**
 * useReducedMotion Hook
 *
 * Detects user's preference for reduced motion from system settings.
 * Used to disable animations for accessibility (WCAG 2.1 SC 2.3.3).
 *
 * @module @nasnet/core/utils/hooks/useReducedMotion
 */
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
export declare function useReducedMotion(): boolean;
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
export declare function getReducedMotionPreference(): boolean;
//# sourceMappingURL=useReducedMotion.d.ts.map