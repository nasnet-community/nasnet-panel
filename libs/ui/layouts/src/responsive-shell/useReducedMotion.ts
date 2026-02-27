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

import { useState, useEffect } from 'react';

/**
 * Media query for prefers-reduced-motion CSS preference
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
 * @internal
 */
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Check if reduced motion is preferred (SSR-safe)
 *
 * Checks the user's system-level motion preference via matchMedia API.
 * Returns false on server-side rendering or if API is unavailable.
 *
 * @returns true if user has enabled reduced motion preference
 * @internal
 */
function getReducedMotionPreference(): boolean {
  // SSR safety: default to false if window is not available
  if (typeof window === 'undefined') return false;

  // Check if browser supports matchMedia
  if (!window.matchMedia) return false;

  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

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
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() =>
    getReducedMotionPreference()
  );

  useEffect(() => {
    // Skip on server
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);

    // Update state when preference changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers use addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Legacy browsers (Safari < 14)
      mediaQuery.addListener(handleChange);
    }

    // Initial sync (in case SSR value differs)
    setPrefersReducedMotion(mediaQuery.matches);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
}

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
export function useAnimationDuration(normalDuration: number, reducedDuration = 0): number {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? reducedDuration : normalDuration;
}

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
export const ANIMATION_DURATIONS = {
  /** Sidebar collapse/expand animation */
  SIDEBAR: 200,
  /** Layout switches and platform transitions */
  LAYOUT: 150,
  /** Mobile drawer, modal, sheet open/close */
  DRAWER: 200,
  /** Quick micro-interactions, hover states */
  QUICK: 100,
  /** Standard transitions and fades */
  DEFAULT: 200,
  /** Slow, deliberate transitions with visual emphasis */
  SLOW: 300,
} as const;

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
export function useMotionConfig(durationMs = ANIMATION_DURATIONS.DEFAULT) {
  const prefersReducedMotion = useReducedMotion();

  return {
    /** Whether animations should play */
    shouldAnimate: !prefersReducedMotion,
    /** Transition config for Framer Motion */
    transition:
      prefersReducedMotion ? { duration: 0 } : { duration: durationMs / 1000, ease: 'easeOut' },
    /** Duration in milliseconds */
    duration: prefersReducedMotion ? 0 : durationMs,
    /** Duration in seconds (for CSS/Framer Motion) */
    durationSeconds: prefersReducedMotion ? 0 : durationMs / 1000,
  };
}

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
export function useMotionClasses() {
  const prefersReducedMotion = useReducedMotion();

  return {
    /** Apply transition-all with motion-safe duration */
    transitionClass: prefersReducedMotion ? 'transition-none' : 'transition-all',
    /** Duration class */
    durationClass: prefersReducedMotion ? 'duration-0' : 'duration-200',
    /** Combined transition + duration */
    motionClass: prefersReducedMotion ? 'transition-none' : 'transition-all duration-200 ease-out',
  };
}
