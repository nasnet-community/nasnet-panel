/**
 * AnimationProvider
 * Provides animation context throughout the app, integrating with:
 * - UI store for animation preferences (reduced motion)
 * - Platform detection for responsive animation timing
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */
import { type ReactNode } from 'react';
import { type Platform } from '@nasnet/ui/layouts';
import { transitions, type AnimationTokens } from '@nasnet/ui/tokens';
import type { Variants, Transition } from 'framer-motion';
interface AnimationContextValue {
    /** Whether reduced motion is preferred */
    reducedMotion: boolean;
    /** Current platform (mobile/tablet/desktop) */
    platform: Platform;
    /** Platform-adjusted animation tokens */
    tokens: AnimationTokens;
    /**
     * Get variant based on reduced motion preference
     * Returns reduced variant if reduced motion is enabled
     */
    getVariant: <T extends Variants>(full: T, reduced?: T) => T;
    /**
     * Get transition based on type, respects reduced motion
     */
    getTransition: (type: keyof typeof transitions) => Transition;
    /**
     * Get duration, returns 0 if reduced motion
     */
    getDuration: (ms: number) => number;
    /**
     * Whether animations are enabled (not reduced motion)
     */
    animationsEnabled: boolean;
}
export interface AnimationProviderProps {
    children: ReactNode;
}
/**
 * AnimationProvider
 *
 * Provides animation utilities throughout the app. Must be placed high
 * in the component tree, typically in providers.tsx.
 *
 * @example
 * ```tsx
 * // In providers.tsx
 * <AnimationProvider>
 *   <App />
 * </AnimationProvider>
 *
 * // In a component
 * const { reducedMotion, getVariant, getTransition } = useAnimation();
 *
 * return (
 *   <motion.div
 *     variants={getVariant(fadeIn)}
 *     initial="initial"
 *     animate="animate"
 *     exit="exit"
 *     transition={getTransition('enter')}
 *   >
 *     Content
 *   </motion.div>
 * );
 * ```
 */
export declare function AnimationProvider({ children }: AnimationProviderProps): import("react/jsx-runtime").JSX.Element;
/**
 * useAnimation hook
 *
 * Access animation context values and utilities.
 * Must be used within AnimationProvider.
 *
 * @throws Error if used outside AnimationProvider
 *
 * @example
 * ```tsx
 * const { reducedMotion, getVariant, tokens } = useAnimation();
 *
 * // Use with framer-motion
 * <motion.div
 *   variants={getVariant(slideUp)}
 *   initial="initial"
 *   animate="animate"
 * />
 *
 * // Check reduced motion
 * if (reducedMotion) {
 *   // Skip expensive animations
 * }
 *
 * // Access timing tokens
 * const enterDuration = tokens.modal.enter;
 * ```
 */
export declare function useAnimation(): AnimationContextValue;
/**
 * useAnimationOptional hook
 *
 * Same as useAnimation but returns null instead of throwing
 * when used outside AnimationProvider. Useful for components
 * that may be rendered outside the provider tree.
 */
export declare function useAnimationOptional(): AnimationContextValue | null;
export interface MotionConfigProps {
    children: ReactNode;
    /** Force reduced motion for this subtree */
    reducedMotion?: boolean;
}
/**
 * MotionConfig - Override motion settings for a subtree
 *
 * Useful for disabling animations in specific areas or
 * for testing purposes.
 *
 * @example
 * ```tsx
 * <MotionConfig reducedMotion>
 *   <FormFields /> // No animations in form
 * </MotionConfig>
 * ```
 */
export declare function MotionConfig({ children, reducedMotion: forceReducedMotion, }: MotionConfigProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=AnimationProvider.d.ts.map