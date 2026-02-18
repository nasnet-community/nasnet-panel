/**
 * Animation Presets
 * Pre-defined Framer Motion variants for consistent animations across the app.
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 *
 * Animation guidelines:
 * - Enter: ease-out (fast start, slow end)
 * - Exit: ease-in (slow start, fast end) - 25% faster than enter
 * - Move: ease-in-out (smooth repositioning)
 */

import { transitions, durations, easings } from '@nasnet/ui/tokens';

import type { Variants, Transition } from 'framer-motion';

// ============================================================================
// Transition Exports
// ============================================================================

export const enterTransition: Transition = transitions.enter;
export const exitTransition: Transition = transitions.exit;
export const moveTransition: Transition = transitions.move;
export const springTransition: Transition = transitions.spring;
export const pageEnterTransition: Transition = transitions.pageEnter;
export const pageExitTransition: Transition = transitions.pageExit;
export const fastTransition: Transition = transitions.fast;
export const instantTransition: Transition = transitions.instant;

// ============================================================================
// Fade Variants
// ============================================================================

/**
 * Simple fade in/out animation
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: enterTransition,
  },
  exit: {
    opacity: 0,
    transition: exitTransition,
  },
};

/**
 * Fade out variant (for explicit exit animations)
 */
export const fadeOut: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: {
    opacity: 0,
    transition: exitTransition,
  },
};

// ============================================================================
// Slide Variants
// ============================================================================

/**
 * Slide up from bottom with fade
 */
export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: enterTransition,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: exitTransition,
  },
};

/**
 * Slide down from top with fade
 */
export const slideDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: enterTransition,
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: exitTransition,
  },
};

/**
 * Slide in from left with fade
 */
export const slideLeft: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: enterTransition,
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: exitTransition,
  },
};

/**
 * Slide in from right with fade
 */
export const slideRight: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: enterTransition,
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: exitTransition,
  },
};

// ============================================================================
// Scale Variants
// ============================================================================

/**
 * Scale in from slightly smaller with fade
 * Good for modals, popovers, toasts
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: enterTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: exitTransition,
  },
};

/**
 * Scale out variant (for explicit exit animations)
 */
export const scaleOut: Variants = {
  initial: { opacity: 1, scale: 1 },
  animate: { opacity: 1, scale: 1 },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: exitTransition,
  },
};

/**
 * Pop in with spring physics
 * Good for buttons, badges, attention-grabbing elements
 */
export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: exitTransition,
  },
};

// ============================================================================
// Page Transition Variants
// ============================================================================

/**
 * Page fade transition (simplest, least disorienting)
 */
export const pageFade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: pageEnterTransition,
  },
  exit: {
    opacity: 0,
    transition: pageExitTransition,
  },
};

/**
 * Page slide up transition
 */
export const pageSlideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: pageEnterTransition,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: pageExitTransition,
  },
};

// ============================================================================
// Drawer/Sheet Variants
// ============================================================================

/**
 * Drawer from right (desktop)
 */
export const drawerRight: Variants = {
  initial: { x: '100%' },
  animate: {
    x: 0,
    transition: enterTransition,
  },
  exit: {
    x: '100%',
    transition: exitTransition,
  },
};

/**
 * Drawer from left
 */
export const drawerLeft: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: 0,
    transition: enterTransition,
  },
  exit: {
    x: '-100%',
    transition: exitTransition,
  },
};

/**
 * Bottom sheet (mobile)
 */
export const bottomSheet: Variants = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: enterTransition,
  },
  exit: {
    y: '100%',
    transition: exitTransition,
  },
};

// ============================================================================
// Backdrop Variants
// ============================================================================

/**
 * Modal/drawer backdrop fade
 */
export const backdrop: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: durations.fast / 1000 },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast / 1000 },
  },
};

// ============================================================================
// Stagger Variants (for lists)
// ============================================================================

/**
 * Container for staggered children animations
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

/**
 * Individual staggered item
 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: enterTransition,
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: exitTransition,
  },
};

/**
 * Fast stagger for lists with many items
 */
export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.01,
      staggerDirection: -1,
    },
  },
};

// ============================================================================
// Reduced Motion Variants
// ============================================================================

/**
 * Minimal fade for users with reduced motion preference
 * Still provides feedback without motion
 */
export const reducedMotionFade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.1 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.05 },
  },
};

/**
 * Instant transition (no animation)
 */
export const reducedMotionInstant: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0 } },
};

// ============================================================================
// Micro-Interaction Variants
// ============================================================================

/**
 * Button press effect
 */
export const buttonPress: Variants = {
  initial: { scale: 1 },
  tap: { scale: 0.97 },
  hover: { scale: 1.02 },
};

/**
 * Subtle hover effect
 */
export const hoverLift: Variants = {
  initial: { y: 0 },
  hover: { y: -2 },
};

/**
 * Pulse animation for status indicators
 */
export const pulse: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: easings.linear,
    },
  },
};

/**
 * Connection pulse animation (for connected status)
 */
export const connectionPulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.15, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: easings.linear,
    },
  },
};

/**
 * Shimmer animation for skeleton loaders
 */
export const shimmer: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: easings.linear,
    },
  },
};

// ============================================================================
// Layout Animation Variants
// ============================================================================

/**
 * List item reorder animation
 */
export const listItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: moveTransition,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: exitTransition,
  },
};

/**
 * Collapsible content
 */
export const collapse: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: enterTransition,
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: exitTransition,
  },
};

// ============================================================================
// Success/Error State Variants
// ============================================================================

/**
 * Success checkmark animation
 */
export const successCheck: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.4, ease: easings.enter },
      opacity: { duration: 0.1 },
    },
  },
};

/**
 * Error shake animation
 */
export const errorShake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};

// ============================================================================
// Utility function for variant selection
// ============================================================================

/**
 * Get variant based on reduced motion preference
 */
export function getVariant<T extends Variants>(
  fullVariant: T,
  reducedMotion: boolean,
  reducedVariant: T = reducedMotionFade as T
): T {
  return reducedMotion ? reducedVariant : fullVariant;
}
