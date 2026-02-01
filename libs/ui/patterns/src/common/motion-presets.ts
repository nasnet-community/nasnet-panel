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
export const ANIMATION_DURATIONS = {
  /** Instant feedback for micro-interactions (50ms) */
  instant: 0.05,
  /** Fast transitions for UI feedback (150ms) */
  fast: 0.15,
  /** Normal transitions for most UI (200ms) */
  normal: 0.2,
  /** Slow transitions for emphasis (300ms) */
  slow: 0.3,
  /** Maximum safe duration for non-essential animations (500ms) */
  emphasized: 0.5,
} as const;

/**
 * Reduced motion durations (all < 150ms opacity only)
 */
export const REDUCED_MOTION_DURATIONS = {
  instant: 0,
  fast: 0,
  normal: 0.1,
  slow: 0.1,
  emphasized: 0.15,
} as const;

/**
 * Standard easing curves
 */
export const EASING = {
  /** Default ease for most transitions */
  default: [0.4, 0, 0.2, 1],
  /** Ease in for elements entering */
  easeIn: [0.4, 0, 1, 1],
  /** Ease out for elements exiting */
  easeOut: [0, 0, 0.2, 1],
  /** Ease in-out for elements moving */
  easeInOut: [0.4, 0, 0.2, 1],
  /** Spring-like bounce for emphasis */
  spring: [0.175, 0.885, 0.32, 1.275],
} as const;

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
export function getTransition(
  reducedMotion: boolean,
  duration: keyof typeof ANIMATION_DURATIONS = 'normal',
  easing: keyof typeof EASING = 'default'
): Transition {
  if (reducedMotion) {
    return {
      duration: REDUCED_MOTION_DURATIONS[duration],
      ease: 'linear',
    };
  }

  return {
    duration: ANIMATION_DURATIONS[duration],
    ease: EASING[easing],
  };
}

/**
 * Fade animation variants
 * Safe for reduced motion (opacity only)
 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Get fade animation variants with proper transition
 */
export function getFadeVariants(reducedMotion: boolean): Variants {
  const transition = getTransition(reducedMotion, 'fast');

  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition,
    },
    exit: {
      opacity: 0,
      transition,
    },
  };
}

/**
 * Scale animation variants
 * Disabled in reduced motion mode (uses fade only)
 */
export function getScaleVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return getFadeVariants(reducedMotion);
  }

  const transition = getTransition(reducedMotion, 'normal');

  return {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition,
    },
  };
}

/**
 * Slide animation variants
 * Disabled in reduced motion mode (uses fade only)
 */
export function getSlideVariants(
  reducedMotion: boolean,
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance: number = 20
): Variants {
  if (reducedMotion) {
    return getFadeVariants(reducedMotion);
  }

  const transition = getTransition(reducedMotion, 'normal');

  const offsets = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  const reset = {
    up: { y: 0 },
    down: { y: 0 },
    left: { x: 0 },
    right: { x: 0 },
  };

  return {
    hidden: { opacity: 0, ...offsets[direction] },
    visible: {
      opacity: 1,
      ...reset[direction],
      transition,
    },
    exit: {
      opacity: 0,
      ...offsets[direction],
      transition,
    },
  };
}

/**
 * Stagger children animation config
 */
export function getStaggerConfig(
  reducedMotion: boolean,
  staggerTime: number = 0.05
): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0,
        },
      },
    };
  }

  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerTime,
      },
    },
  };
}

/**
 * Hover animation (for interactive elements)
 * Disabled in reduced motion mode
 */
export function getHoverAnimation(
  reducedMotion: boolean
): TargetAndTransition | undefined {
  if (reducedMotion) {
    return undefined;
  }

  return {
    scale: 1.02,
    transition: { duration: ANIMATION_DURATIONS.fast },
  };
}

/**
 * Tap animation (for interactive elements)
 * Disabled in reduced motion mode
 */
export function getTapAnimation(
  reducedMotion: boolean
): TargetAndTransition | undefined {
  if (reducedMotion) {
    return undefined;
  }

  return {
    scale: 0.98,
    transition: { duration: ANIMATION_DURATIONS.instant },
  };
}

/**
 * Pulse animation for status indicators
 * Safe for reduced motion (uses opacity only)
 */
export function getPulseVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    // Simple opacity pulse
    return {
      initial: { opacity: 1 },
      animate: {
        opacity: [1, 0.7, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        },
      },
    };
  }

  return {
    initial: { scale: 1, opacity: 1 },
    animate: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };
}

/**
 * Skeleton loading animation
 * Uses opacity shimmer, safe for reduced motion
 */
export function getSkeletonVariants(reducedMotion: boolean): Variants {
  const duration = reducedMotion ? 1.5 : 1.2;

  return {
    initial: { opacity: 0.5 },
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };
}

/**
 * Page transition variants
 */
export function getPageTransitionVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return getFadeVariants(reducedMotion);
  }

  const transition = getTransition(reducedMotion, 'normal');

  return {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition,
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: ANIMATION_DURATIONS.fast },
    },
  };
}

/**
 * Modal/Dialog animation variants
 */
export function getModalVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return getFadeVariants(reducedMotion);
  }

  const transition = getTransition(reducedMotion, 'normal', 'easeOut');

  return {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: ANIMATION_DURATIONS.fast },
    },
  };
}

/**
 * Backdrop/Overlay animation variants
 */
export function getBackdropVariants(reducedMotion: boolean): Variants {
  const transition = getTransition(reducedMotion, 'fast');

  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition,
    },
    exit: {
      opacity: 0,
      transition,
    },
  };
}

/**
 * Drawer/Sheet animation variants
 */
export function getDrawerVariants(
  reducedMotion: boolean,
  side: 'left' | 'right' | 'top' | 'bottom' = 'right'
): Variants {
  if (reducedMotion) {
    return getFadeVariants(reducedMotion);
  }

  const transition = getTransition(reducedMotion, 'normal', 'easeOut');

  const offsets = {
    left: { x: '-100%' },
    right: { x: '100%' },
    top: { y: '-100%' },
    bottom: { y: '100%' },
  };

  const reset = {
    left: { x: 0 },
    right: { x: 0 },
    top: { y: 0 },
    bottom: { y: 0 },
  };

  return {
    hidden: { opacity: 0, ...offsets[side] },
    visible: {
      opacity: 1,
      ...reset[side],
      transition,
    },
    exit: {
      opacity: 0,
      ...offsets[side],
      transition: { duration: ANIMATION_DURATIONS.fast },
    },
  };
}

/**
 * Accordion/Collapse animation variants
 */
export function getCollapseVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0, height: 0, overflow: 'hidden' },
      visible: {
        opacity: 1,
        height: 'auto',
        overflow: 'visible',
        transition: { duration: 0.1 },
      },
      exit: {
        opacity: 0,
        height: 0,
        overflow: 'hidden',
        transition: { duration: 0.1 },
      },
    };
  }

  return {
    hidden: { opacity: 0, height: 0, overflow: 'hidden' },
    visible: {
      opacity: 1,
      height: 'auto',
      overflow: 'visible',
      transition: {
        height: { duration: ANIMATION_DURATIONS.normal },
        opacity: { duration: ANIMATION_DURATIONS.fast, delay: 0.05 },
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      overflow: 'hidden',
      transition: {
        height: { duration: ANIMATION_DURATIONS.fast, delay: 0.05 },
        opacity: { duration: ANIMATION_DURATIONS.instant },
      },
    },
  };
}

/**
 * Toast notification animation variants
 */
export function getToastVariants(
  reducedMotion: boolean,
  position: 'top' | 'bottom' = 'bottom'
): Variants {
  if (reducedMotion) {
    return getFadeVariants(reducedMotion);
  }

  const yOffset = position === 'top' ? -20 : 20;
  const transition = getTransition(reducedMotion, 'normal', 'spring');

  return {
    hidden: { opacity: 0, y: yOffset, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition,
    },
    exit: {
      opacity: 0,
      y: yOffset,
      scale: 0.9,
      transition: { duration: ANIMATION_DURATIONS.fast },
    },
  };
}
