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

// ============================================================================
// Tier 1: Primitive Animation Values
// ============================================================================

/**
 * Raw duration values in milliseconds
 */
export const durations = {
  /** No animation - instant transition */
  instant: 0,
  /** Micro-interactions: button hover, toggle, status change */
  fast: 100,
  /** Standard animations: modal enter, content fade */
  normal: 200,
  /** Page transitions, complex sequences */
  slow: 300,
  /** Very slow transitions (rarely used) */
  slower: 500,
} as const;

/**
 * Easing curves per UX Design specification
 * - Enter: ease-out (fast start, slow end) - content arriving
 * - Exit: ease-in (slow start, fast end) - content leaving
 * - Move: ease-in-out (smooth repositioning)
 */
export const easings = {
  /** ease-out: Fast start, slow end - for entering elements */
  enter: [0, 0, 0.2, 1] as const,
  /** ease-in: Slow start, fast end - for exiting elements */
  exit: [0.4, 0, 1, 1] as const,
  /** ease-in-out: Smooth repositioning - for layout changes */
  move: [0.4, 0, 0.2, 1] as const,
  /** Linear: Constant speed - for progress indicators */
  linear: [0, 0, 1, 1] as const,
} as const;

/**
 * Spring physics configurations for natural motion
 */
export const springs = {
  /** Default spring - balanced feel */
  default: { type: 'spring' as const, stiffness: 300, damping: 30 },
  /** Gentle spring - slower, softer motion */
  gentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
  /** Bouncy spring - playful, energetic motion */
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 20 },
  /** Stiff spring - quick, snappy motion */
  stiff: { type: 'spring' as const, stiffness: 500, damping: 35 },
} as const;

/**
 * Combined primitive animation values
 */
export const animationPrimitives = {
  duration: durations,
  easing: easings,
  spring: springs,
} as const;

// ============================================================================
// Tier 2: Semantic Animation Tokens (Platform-Aware)
// ============================================================================

export type Platform = 'mobile' | 'tablet' | 'desktop';

/**
 * Platform-specific animation tokens
 * Mobile animations are 25% faster for snappier feel
 */
export interface AnimationTokens {
  pageTransition: { enter: number; exit: number };
  modal: { enter: number; exit: number };
  drawer: { enter: number; exit: number };
  listReorder: number;
  microInteraction: number;
  skeleton: { duration: number; repeat: number };
  connectionPulse: { duration: number; repeat: number };
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
export function getAnimationTokens(platform: Platform): AnimationTokens {
  // Mobile animations are 25% faster for snappy feel
  const mobileFactor = platform === 'mobile' ? 0.75 : 1;

  return {
    pageTransition: {
      enter: durations.slow * mobileFactor,
      exit: durations.slow * mobileFactor * 0.75, // 25% faster exit
    },
    modal: {
      enter: durations.normal * mobileFactor,
      exit: durations.normal * mobileFactor * 0.75,
    },
    drawer: {
      enter: durations.normal * mobileFactor,
      exit: durations.normal * mobileFactor * 0.75,
    },
    listReorder: durations.normal * mobileFactor,
    microInteraction: durations.fast * mobileFactor,
    skeleton: {
      duration: 1.5,
      repeat: Infinity,
    },
    connectionPulse: {
      duration: 2,
      repeat: Infinity,
    },
  };
}

// ============================================================================
// Tier 3: Ready-to-Use Framer Motion Transitions
// ============================================================================

/**
 * Pre-configured Framer Motion transitions
 * Use these directly in motion components
 */
export const transitions = {
  /** Enter transition - ease-out, 200ms */
  enter: {
    duration: durations.normal / 1000,
    ease: easings.enter,
  } as Transition,

  /** Exit transition - ease-in, 150ms (25% faster) */
  exit: {
    duration: (durations.normal * 0.75) / 1000,
    ease: easings.exit,
  } as Transition,

  /** Move transition - ease-in-out, 200ms */
  move: {
    duration: durations.normal / 1000,
    ease: easings.move,
  } as Transition,

  /** Page enter transition - ease-out, 300ms */
  pageEnter: {
    duration: durations.slow / 1000,
    ease: easings.enter,
  } as Transition,

  /** Page exit transition - ease-in, 225ms */
  pageExit: {
    duration: (durations.slow * 0.75) / 1000,
    ease: easings.exit,
  } as Transition,

  /** Fast transition for micro-interactions - 100ms */
  fast: {
    duration: durations.fast / 1000,
    ease: easings.enter,
  } as Transition,

  /** Default spring animation */
  spring: springs.default as Transition,

  /** Gentle spring animation */
  springGentle: springs.gentle as Transition,

  /** Bouncy spring animation */
  springBouncy: springs.bouncy as Transition,

  /** Instant transition - no animation */
  instant: {
    duration: 0,
  } as Transition,
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get transition based on reduced motion preference
 *
 * @param fullTransition - Normal transition to use
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns Instant transition if reduced motion, otherwise full transition
 */
export function getReducedMotionTransition(
  fullTransition: Transition,
  reducedMotion: boolean
): Transition {
  return reducedMotion ? transitions.instant : fullTransition;
}

/**
 * Convert milliseconds to seconds (for Framer Motion)
 *
 * @param ms - Duration in milliseconds
 * @returns Duration in seconds
 */
export function msToSeconds(ms: number): number {
  return ms / 1000;
}

/**
 * Get duration based on reduced motion preference
 *
 * @param ms - Duration in milliseconds
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns 0 if reduced motion, otherwise the duration
 */
export function getReducedMotionDuration(
  ms: number,
  reducedMotion: boolean
): number {
  return reducedMotion ? 0 : ms;
}
