/**
 * useReducedMotion Hook
 *
 * Detects user's preference for reduced motion from system settings.
 * Used to disable animations for accessibility (WCAG 2.1 SC 2.3.3).
 *
 * Respects the `prefers-reduced-motion` media query, which is set in
 * operating system accessibility settings. Returns a boolean that updates
 * when the user changes their preference while the app is running.
 *
 * @module @nasnet/ui/primitives/hooks
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = useReducedMotion();
 *
 *   return (
 *     <div className={prefersReducedMotion ? '' : 'animate-pulse'}>
 *       Content animates only if motion is not reduced
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns {boolean} true if user prefers reduced motion, false otherwise
 */
export declare function useReducedMotion(): boolean;
//# sourceMappingURL=useReducedMotion.d.ts.map