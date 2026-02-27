/**
 * Animation Token System
 * Implements NAS-4.18: Animation System (Framer Motion)
 *
 * Three-tier token architecture:
 * - Tier 1: Primitive animation values (raw numbers, easings)
 * - Tier 2: Semantic animation tokens (platform-aware durations)
 * - Tier 3: Ready-to-use Framer Motion transitions
 *
 * @see Docs/design/ux-design/2-core-user-experience.md
 * @see Docs/sprint-artifacts/Epic4-State-Management-Frontend-Shell/NAS-4-18-implement-animation-system-framer-motion.md
 */
import type { Transition } from 'framer-motion';
/**
 * Framer Motion transition type for animating React components
 * @see https://www.framer.com/motion/
 */
/**
 * Raw duration values in milliseconds
 */
export declare const durations: {
  /** No animation - instant transition */
  readonly instant: 0;
  /** Micro-interactions: button hover, toggle, status change */
  readonly fast: 100;
  /** Standard animations: modal enter, content fade */
  readonly normal: 200;
  /** Page transitions, complex sequences */
  readonly slow: 300;
  /** Very slow transitions (rarely used) */
  readonly slower: 500;
};
/**
 * Easing curves per UX Design specification
 * - Enter: ease-out (fast start, slow end) - content arriving
 * - Exit: ease-in (slow start, fast end) - content leaving
 * - Move: ease-in-out (smooth repositioning)
 */
export declare const easings: {
  /** ease-out: Fast start, slow end - for entering elements */
  readonly enter: readonly [0, 0, 0.2, 1];
  /** ease-in: Slow start, fast end - for exiting elements */
  readonly exit: readonly [0.4, 0, 1, 1];
  /** ease-in-out: Smooth repositioning - for layout changes */
  readonly move: readonly [0.4, 0, 0.2, 1];
  /** Linear: Constant speed - for progress indicators */
  readonly linear: readonly [0, 0, 1, 1];
};
/**
 * Spring physics configurations for natural motion
 */
export declare const springs: {
  /** Default spring - balanced feel */
  readonly default: {
    readonly type: 'spring';
    readonly stiffness: 300;
    readonly damping: 30;
  };
  /** Gentle spring - slower, softer motion */
  readonly gentle: {
    readonly type: 'spring';
    readonly stiffness: 200;
    readonly damping: 25;
  };
  /** Bouncy spring - playful, energetic motion */
  readonly bouncy: {
    readonly type: 'spring';
    readonly stiffness: 400;
    readonly damping: 20;
  };
  /** Stiff spring - quick, snappy motion */
  readonly stiff: {
    readonly type: 'spring';
    readonly stiffness: 500;
    readonly damping: 35;
  };
};
/**
 * Combined primitive animation values
 */
export declare const animationPrimitives: {
  readonly duration: {
    /** No animation - instant transition */
    readonly instant: 0;
    /** Micro-interactions: button hover, toggle, status change */
    readonly fast: 100;
    /** Standard animations: modal enter, content fade */
    readonly normal: 200;
    /** Page transitions, complex sequences */
    readonly slow: 300;
    /** Very slow transitions (rarely used) */
    readonly slower: 500;
  };
  readonly easing: {
    /** ease-out: Fast start, slow end - for entering elements */
    readonly enter: readonly [0, 0, 0.2, 1];
    /** ease-in: Slow start, fast end - for exiting elements */
    readonly exit: readonly [0.4, 0, 1, 1];
    /** ease-in-out: Smooth repositioning - for layout changes */
    readonly move: readonly [0.4, 0, 0.2, 1];
    /** Linear: Constant speed - for progress indicators */
    readonly linear: readonly [0, 0, 1, 1];
  };
  readonly spring: {
    /** Default spring - balanced feel */
    readonly default: {
      readonly type: 'spring';
      readonly stiffness: 300;
      readonly damping: 30;
    };
    /** Gentle spring - slower, softer motion */
    readonly gentle: {
      readonly type: 'spring';
      readonly stiffness: 200;
      readonly damping: 25;
    };
    /** Bouncy spring - playful, energetic motion */
    readonly bouncy: {
      readonly type: 'spring';
      readonly stiffness: 400;
      readonly damping: 20;
    };
    /** Stiff spring - quick, snappy motion */
    readonly stiff: {
      readonly type: 'spring';
      readonly stiffness: 500;
      readonly damping: 35;
    };
  };
};
export type Platform = 'mobile' | 'tablet' | 'desktop';
/**
 * Platform-specific animation tokens for consistent timing across the application.
 * Provides platform-aware animation durations (mobile animations 25% faster for snappier feel).
 *
 * Used by Framer Motion components and CSS transitions to ensure consistent,
 * accessible, and performant animations across all device types.
 *
 * @see Docs/design/ux-design/2-core-user-experience.md
 * @example
 * ```tsx
 * const tokens = getAnimationTokens('mobile');
 * // tokens.pageTransition.enter = 225 (300ms * 0.75)
 * ```
 */
export interface AnimationTokens {
  /** Page transition timings: entering and exiting full pages */
  pageTransition: {
    enter: number;
    exit: number;
  };
  /** Modal dialog animation timings */
  modal: {
    enter: number;
    exit: number;
  };
  /** Drawer/sidebar animation timings */
  drawer: {
    enter: number;
    exit: number;
  };
  /** List item reordering animation duration */
  listReorder: number;
  /** Quick micro-interactions (button hover, toggle) duration */
  microInteraction: number;
  /** Skeleton loader pulse animation (duration in seconds, infinite repeat) */
  skeleton: {
    duration: number;
    repeat: number;
  };
  /** Connection status pulse animation (duration in seconds, infinite repeat) */
  connectionPulse: {
    duration: number;
    repeat: number;
  };
}
/**
 * Get animation tokens adjusted for the current platform
 *
 * @param platform - Target platform (mobile/tablet/desktop)
 * @returns Platform-adjusted animation tokens
 *
 * @example
 * ```tsx
 * const tokens = getAnimationTokens('mobile');
 * // tokens.pageTransition.enter = 225 (300 * 0.75)
 * ```
 */
export declare function getAnimationTokens(platform: Platform): AnimationTokens;
/**
 * Pre-configured Framer Motion transitions
 * Use these directly in motion components
 */
export declare const transitions: {
  /** Enter transition - ease-out, 200ms */
  readonly enter: Transition;
  /** Exit transition - ease-in, 150ms (25% faster) */
  readonly exit: Transition;
  /** Move transition - ease-in-out, 200ms */
  readonly move: Transition;
  /** Page enter transition - ease-out, 300ms */
  readonly pageEnter: Transition;
  /** Page exit transition - ease-in, 225ms */
  readonly pageExit: Transition;
  /** Fast transition for micro-interactions - 100ms */
  readonly fast: Transition;
  /** Default spring animation */
  readonly spring: Transition;
  /** Gentle spring animation */
  readonly springGentle: Transition;
  /** Bouncy spring animation */
  readonly springBouncy: Transition;
  /** Instant transition - no animation */
  readonly instant: Transition;
};
/**
 * Get transition based on reduced motion preference
 *
 * @param fullTransition - Normal transition to use
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns Instant transition if reduced motion, otherwise full transition
 */
export declare function getReducedMotionTransition(
  fullTransition: Transition,
  reducedMotion: boolean
): Transition;
/**
 * Convert milliseconds to seconds (for Framer Motion)
 *
 * @param ms - Duration in milliseconds
 * @returns Duration in seconds
 */
export declare function msToSeconds(ms: number): number;
/**
 * Get duration based on reduced motion preference
 *
 * Respects user's `prefers-reduced-motion` CSS media query for accessibility.
 * Decorative animations are completely disabled; functional transitions use minimal timing.
 *
 * @param ms - Duration in milliseconds
 * @param reducedMotion - Whether reduced motion is enabled (from `usePrefersReducedMotion`)
 * @returns 0 (instant) if reduced motion enabled, otherwise the original duration in milliseconds
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
 * @example
 * ```tsx
 * const prefersReducedMotion = usePrefersReducedMotion();
 * const duration = getReducedMotionDuration(300, prefersReducedMotion);
 * // If reduced motion: duration = 0 (instant)
 * // Otherwise: duration = 300
 * ```
 */
export declare function getReducedMotionDuration(ms: number, reducedMotion: boolean): number;
//# sourceMappingURL=animation.d.ts.map
