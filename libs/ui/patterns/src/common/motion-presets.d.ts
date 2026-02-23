/**
 * Motion Presets for Reduced Motion Support
 *
 * Provides animation presets that respect the user's prefers-reduced-motion preference.
 * Use these presets with Framer Motion for WCAG AAA compliant animations.
 *
 * @see NAS-4.17: Implement Accessibility (a11y) Foundation
 * @see WCAG 2.3.3: Animation from Interactions
 */
import type { Variants, Transition, TargetAndTransition } from 'framer-motion';
/**
 * Standard animation durations (in seconds)
 * All values respect WCAG guidelines for safe animation
 */
export declare const ANIMATION_DURATIONS: {
    /** Instant feedback for micro-interactions (50ms) */
    readonly instant: 0.05;
    /** Fast transitions for UI feedback (150ms) */
    readonly fast: 0.15;
    /** Normal transitions for most UI (200ms) */
    readonly normal: 0.2;
    /** Slow transitions for emphasis (300ms) */
    readonly slow: 0.3;
    /** Maximum safe duration for non-essential animations (500ms) */
    readonly emphasized: 0.5;
};
/**
 * Reduced motion durations (all < 150ms opacity only)
 */
export declare const REDUCED_MOTION_DURATIONS: {
    readonly instant: 0;
    readonly fast: 0;
    readonly normal: 0.1;
    readonly slow: 0.1;
    readonly emphasized: 0.15;
};
/**
 * Standard easing curves
 */
export declare const EASING: {
    /** Default ease for most transitions */
    readonly default: readonly [0.4, 0, 0.2, 1];
    /** Ease in for elements entering */
    readonly easeIn: readonly [0.4, 0, 1, 1];
    /** Ease out for elements exiting */
    readonly easeOut: readonly [0, 0, 0.2, 1];
    /** Ease in-out for elements moving */
    readonly easeInOut: readonly [0.4, 0, 0.2, 1];
    /** Spring-like bounce for emphasis */
    readonly spring: readonly [0.175, 0.885, 0.32, 1.275];
};
/**
 * Get transition config based on reduced motion preference
 *
 * @param reducedMotion - Whether reduced motion is preferred
 * @param duration - Duration key from ANIMATION_DURATIONS
 * @param easing - Easing key from EASING
 * @returns Transition config
 *
 * @example
 * ```tsx
 * const { reducedMotion } = useA11y();
 * const transition = getTransition(reducedMotion, 'normal');
 *
 * <motion.div
 *   animate={{ opacity: 1 }}
 *   transition={transition}
 * />
 * ```
 */
export declare function getTransition(reducedMotion: boolean, duration?: keyof typeof ANIMATION_DURATIONS, easing?: keyof typeof EASING): Transition;
/**
 * Fade animation variants
 * Safe for reduced motion (opacity only)
 */
export declare const fadeVariants: Variants;
/**
 * Get fade animation variants with proper transition
 */
export declare function getFadeVariants(reducedMotion: boolean): Variants;
/**
 * Scale animation variants
 * Disabled in reduced motion mode (uses fade only)
 */
export declare function getScaleVariants(reducedMotion: boolean): Variants;
/**
 * Slide animation variants
 * Disabled in reduced motion mode (uses fade only)
 */
export declare function getSlideVariants(reducedMotion: boolean, direction?: 'up' | 'down' | 'left' | 'right', distance?: number): Variants;
/**
 * Stagger children animation config
 */
export declare function getStaggerConfig(reducedMotion: boolean, staggerTime?: number): Variants;
/**
 * Hover animation (for interactive elements)
 * Disabled in reduced motion mode
 */
export declare function getHoverAnimation(reducedMotion: boolean): TargetAndTransition | undefined;
/**
 * Tap animation (for interactive elements)
 * Disabled in reduced motion mode
 */
export declare function getTapAnimation(reducedMotion: boolean): TargetAndTransition | undefined;
/**
 * Pulse animation for status indicators
 * Safe for reduced motion (uses opacity only)
 */
export declare function getPulseVariants(reducedMotion: boolean): Variants;
/**
 * Skeleton loading animation
 * Uses opacity shimmer, safe for reduced motion
 */
export declare function getSkeletonVariants(reducedMotion: boolean): Variants;
/**
 * Page transition variants
 */
export declare function getPageTransitionVariants(reducedMotion: boolean): Variants;
/**
 * Modal/Dialog animation variants
 */
export declare function getModalVariants(reducedMotion: boolean): Variants;
/**
 * Backdrop/Overlay animation variants
 */
export declare function getBackdropVariants(reducedMotion: boolean): Variants;
/**
 * Drawer/Sheet animation variants
 */
export declare function getDrawerVariants(reducedMotion: boolean, side?: 'left' | 'right' | 'top' | 'bottom'): Variants;
/**
 * Accordion/Collapse animation variants
 */
export declare function getCollapseVariants(reducedMotion: boolean): Variants;
/**
 * Toast notification animation variants
 */
export declare function getToastVariants(reducedMotion: boolean, position?: 'top' | 'bottom'): Variants;
//# sourceMappingURL=motion-presets.d.ts.map