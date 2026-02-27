/**
 * AnimationProvider
 * Provides animation context throughout the app, integrating with:
 * - UI store for animation preferences (reduced motion)
 * - Platform detection for responsive animation timing
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */

import { createContext, useContext, type ReactNode, useMemo, useCallback } from 'react';

import { useUIStore } from '@nasnet/state/stores';
import { usePlatform, type Platform } from '@nasnet/ui/layouts';
import { getAnimationTokens, transitions, type AnimationTokens } from '@nasnet/ui/tokens';

import { reducedMotionFade } from './presets';

import type { Variants, Transition } from 'framer-motion';

// ============================================================================
// Context Types
// ============================================================================

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

const AnimationContext = createContext<AnimationContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

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
export function AnimationProvider({ children }: AnimationProviderProps) {
  // Get animation preference from UI store
  const animationsEnabled = useUIStore((state) => state.animationsEnabled);
  const reducedMotion = !animationsEnabled;

  // Detect platform for responsive timing
  const platform = usePlatform();

  // Get platform-adjusted tokens
  const tokens = useMemo(() => getAnimationTokens(platform), [platform]);

  // Memoized helpers
  const getVariant = useCallback(
    <T extends Variants>(full: T, reduced: T = reducedMotionFade as T): T => {
      return reducedMotion ? reduced : full;
    },
    [reducedMotion]
  );

  const getTransition = useCallback(
    (type: keyof typeof transitions): Transition => {
      if (reducedMotion) {
        return { duration: 0 };
      }
      return transitions[type];
    },
    [reducedMotion]
  );

  const getDuration = useCallback(
    (ms: number): number => {
      return reducedMotion ? 0 : ms;
    },
    [reducedMotion]
  );

  // Memoize context value
  const value = useMemo<AnimationContextValue>(
    () => ({
      reducedMotion,
      platform,
      tokens,
      getVariant,
      getTransition,
      getDuration,
      animationsEnabled,
    }),
    [reducedMotion, platform, tokens, getVariant, getTransition, getDuration, animationsEnabled]
  );

  return <AnimationContext.Provider value={value}>{children}</AnimationContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

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
export function useAnimation(): AnimationContextValue {
  const context = useContext(AnimationContext);

  if (!context) {
    throw new Error(
      'useAnimation must be used within AnimationProvider. ' +
        'Make sure AnimationProvider is in your component tree.'
    );
  }

  return context;
}

/**
 * useAnimationOptional hook
 *
 * Same as useAnimation but returns null instead of throwing
 * when used outside AnimationProvider. Useful for components
 * that may be rendered outside the provider tree.
 */
export function useAnimationOptional(): AnimationContextValue | null {
  return useContext(AnimationContext);
}

// ============================================================================
// Utility Components
// ============================================================================

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
export function MotionConfig({ children, reducedMotion: forceReducedMotion }: MotionConfigProps) {
  const parentContext = useAnimationOptional();
  const platform = usePlatform();
  const tokens = useMemo(() => getAnimationTokens(platform), [platform]);

  // Use forced value or fall back to parent/default
  const reducedMotion = forceReducedMotion ?? parentContext?.reducedMotion ?? false;
  const animationsEnabled = !reducedMotion;

  const getVariant = useCallback(
    <T extends Variants>(full: T, reduced: T = reducedMotionFade as T): T => {
      return reducedMotion ? reduced : full;
    },
    [reducedMotion]
  );

  const getTransition = useCallback(
    (type: keyof typeof transitions): Transition => {
      if (reducedMotion) {
        return { duration: 0 };
      }
      return transitions[type];
    },
    [reducedMotion]
  );

  const getDuration = useCallback(
    (ms: number): number => {
      return reducedMotion ? 0 : ms;
    },
    [reducedMotion]
  );

  const value = useMemo<AnimationContextValue>(
    () => ({
      reducedMotion,
      platform,
      tokens,
      getVariant,
      getTransition,
      getDuration,
      animationsEnabled,
    }),
    [reducedMotion, platform, tokens, getVariant, getTransition, getDuration, animationsEnabled]
  );

  return <AnimationContext.Provider value={value}>{children}</AnimationContext.Provider>;
}
