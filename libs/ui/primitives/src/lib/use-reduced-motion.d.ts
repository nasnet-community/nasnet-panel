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
export declare function useReducedMotion(): boolean;
//# sourceMappingURL=use-reduced-motion.d.ts.map