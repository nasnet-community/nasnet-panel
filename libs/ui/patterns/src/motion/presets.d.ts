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
import type { Variants, Transition } from 'framer-motion';
export declare const enterTransition: Transition;
export declare const exitTransition: Transition;
export declare const moveTransition: Transition;
export declare const springTransition: Transition;
export declare const pageEnterTransition: Transition;
export declare const pageExitTransition: Transition;
export declare const fastTransition: Transition;
export declare const instantTransition: Transition;
/**
 * Simple fade in/out animation
 */
export declare const fadeIn: Variants;
/**
 * Fade out variant (for explicit exit animations)
 */
export declare const fadeOut: Variants;
/**
 * Slide up from bottom with fade
 */
export declare const slideUp: Variants;
/**
 * Slide down from top with fade
 */
export declare const slideDown: Variants;
/**
 * Slide in from left with fade
 */
export declare const slideLeft: Variants;
/**
 * Slide in from right with fade
 */
export declare const slideRight: Variants;
/**
 * Scale in from slightly smaller with fade
 * Good for modals, popovers, toasts
 */
export declare const scaleIn: Variants;
/**
 * Scale out variant (for explicit exit animations)
 */
export declare const scaleOut: Variants;
/**
 * Pop in with spring physics
 * Good for buttons, badges, attention-grabbing elements
 */
export declare const popIn: Variants;
/**
 * Page fade transition (simplest, least disorienting)
 */
export declare const pageFade: Variants;
/**
 * Page slide up transition
 */
export declare const pageSlideUp: Variants;
/**
 * Drawer from right (desktop)
 */
export declare const drawerRight: Variants;
/**
 * Drawer from left
 */
export declare const drawerLeft: Variants;
/**
 * Bottom sheet (mobile)
 */
export declare const bottomSheet: Variants;
/**
 * Modal/drawer backdrop fade
 */
export declare const backdrop: Variants;
/**
 * Container for staggered children animations
 */
export declare const staggerContainer: Variants;
/**
 * Individual staggered item
 */
export declare const staggerItem: Variants;
/**
 * Fast stagger for lists with many items
 */
export declare const staggerContainerFast: Variants;
/**
 * Minimal fade for users with reduced motion preference
 * Still provides feedback without motion
 */
export declare const reducedMotionFade: Variants;
/**
 * Instant transition (no animation)
 */
export declare const reducedMotionInstant: Variants;
/**
 * Button press effect
 */
export declare const buttonPress: Variants;
/**
 * Subtle hover effect
 */
export declare const hoverLift: Variants;
/**
 * Pulse animation for status indicators
 */
export declare const pulse: Variants;
/**
 * Connection pulse animation (for connected status)
 */
export declare const connectionPulse: Variants;
/**
 * Shimmer animation for skeleton loaders
 */
export declare const shimmer: Variants;
/**
 * List item reorder animation
 */
export declare const listItem: Variants;
/**
 * Collapsible content
 */
export declare const collapse: Variants;
/**
 * Success checkmark animation
 */
export declare const successCheck: Variants;
/**
 * Error shake animation
 */
export declare const errorShake: Variants;
/**
 * Get variant based on reduced motion preference
 */
export declare function getVariant<T extends Variants>(fullVariant: T, reducedMotion: boolean, reducedVariant?: T): T;
//# sourceMappingURL=presets.d.ts.map