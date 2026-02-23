/**
 * useReducedMotion Hook
 * Detects user's prefers-reduced-motion preference
 *
 * WCAG AAA accessibility requirement:
 * When user has reduced motion enabled, animations should be disabled or minimized.
 *
 * @see AC 3.6: Reduced Motion Support
 * @see https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
 */
/**
 * Hook to detect user's reduced motion preference
 *
 * When true, components should:
 * - Disable or minimize animations
 * - Use instant transitions instead of timed ones
 * - Avoid parallax effects, auto-playing videos, etc.
 *
 * @returns boolean - true if user prefers reduced motion
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = useReducedMotion();
 *
 *   return (
 *     <motion.div
 *       animate={{ x: 100 }}
 *       transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
 *     >
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With Tailwind CSS
 * function TransitionComponent() {
 *   const prefersReducedMotion = useReducedMotion();
 *
 *   return (
 *     <div
 *       className={cn(
 *         prefersReducedMotion ? 'duration-0' : 'duration-200',
 *         'transition-all'
 *       )}
 *     >
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useReducedMotion(): boolean;
/**
 * Get animation duration based on reduced motion preference
 *
 * @param normalDuration - Duration to use when motion is allowed (ms)
 * @param reducedDuration - Duration to use when motion is reduced (default: 0)
 * @returns Duration in milliseconds
 *
 * @example
 * ```tsx
 * function AnimatedDiv() {
 *   const duration = useAnimationDuration(200);
 *   // duration = 200 normally, 0 if reduced motion
 *
 *   return (
 *     <div style={{ transitionDuration: `${duration}ms` }}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useAnimationDuration(normalDuration: number, reducedDuration?: number): number;
/**
 * Animation duration specifications from design system
 *
 * All values in milliseconds. Use these consistent durations across the application
 * for predictable, accessible animations. Always respect `prefers-reduced-motion` setting.
 *
 * Reference: Docs/design/DESIGN_TOKENS.md - Transition Tokens
 *
 * @see useReducedMotion for checking motion preference
 * @see useMotionConfig for motion-aware animation setup
 */
export declare const ANIMATION_DURATIONS: {
    /** Sidebar collapse/expand animation */
    readonly SIDEBAR: 200;
    /** Layout switches and platform transitions */
    readonly LAYOUT: 150;
    /** Mobile drawer, modal, sheet open/close */
    readonly DRAWER: 200;
    /** Quick micro-interactions, hover states */
    readonly QUICK: 100;
    /** Standard transitions and fades */
    readonly DEFAULT: 200;
    /** Slow, deliberate transitions with visual emphasis */
    readonly SLOW: 300;
};
/**
 * Get motion-safe animation config for Framer Motion
 *
 * @example
 * ```tsx
 * import { motion } from 'framer-motion';
 *
 * function SidebarAnimation() {
 *   const { transition, shouldAnimate } = useMotionConfig();
 *
 *   return (
 *     <motion.div
 *       initial={shouldAnimate ? { width: 256 } : false}
 *       animate={{ width: isCollapsed ? 64 : 256 }}
 *       transition={transition}
 *     >
 *       Sidebar content
 *     </motion.div>
 *   );
 * }
 * ```
 */
export declare function useMotionConfig(durationMs?: 200): {
    /** Whether animations should play */
    shouldAnimate: boolean;
    /** Transition config for Framer Motion */
    transition: {
        duration: number;
        ease?: undefined;
    } | {
        duration: number;
        ease: string;
    };
    /** Duration in milliseconds */
    duration: number;
    /** Duration in seconds (for CSS/Framer Motion) */
    durationSeconds: number;
};
/**
 * CSS class helper for reduced motion
 *
 * @returns Object with motion-safe CSS classes
 *
 * @example
 * ```tsx
 * function Component() {
 *   const { transitionClass, durationClass } = useMotionClasses();
 *
 *   return (
 *     <div className={cn(transitionClass, durationClass, 'transform')}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useMotionClasses(): {
    /** Apply transition-all with motion-safe duration */
    transitionClass: string;
    /** Duration class */
    durationClass: string;
    /** Combined transition + duration */
    motionClass: string;
};
//# sourceMappingURL=useReducedMotion.d.ts.map