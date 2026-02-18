/**
 * PageTransition
 * Provides smooth transitions between routes using Framer Motion.
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */

import { type ReactNode, useMemo } from 'react';

import { useRouterState } from '@tanstack/react-router';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

import { useAnimation, useAnimationOptional } from './AnimationProvider';
import {
  pageFade,
  pageSlideUp,
  reducedMotionFade,
  pageEnterTransition,
  pageExitTransition,
} from './presets';

// ============================================================================
// Types
// ============================================================================

export type PageTransitionVariant = 'fade' | 'slideUp' | 'none';

export interface PageTransitionProps {
  children: ReactNode;
  /** Animation variant to use */
  variant?: PageTransitionVariant;
  /** Custom variants (overrides variant prop) */
  variants?: Variants;
  /** Additional CSS classes */
  className?: string;
  /** AnimatePresence mode: 'wait' (sequential) or 'sync' (simultaneous) */
  mode?: 'wait' | 'sync' | 'popLayout';
}

// ============================================================================
// Variant Map
// ============================================================================

const variantMap: Record<PageTransitionVariant, Variants> = {
  fade: pageFade,
  slideUp: pageSlideUp,
  none: reducedMotionFade,
};

// ============================================================================
// PageTransition Component
// ============================================================================

/**
 * PageTransition
 *
 * Wraps page content to animate route transitions.
 * Uses the current route key to trigger animations.
 *
 * @example
 * ```tsx
 * // In __root.tsx
 * <PageTransition>
 *   <Outlet />
 * </PageTransition>
 *
 * // With custom variant
 * <PageTransition variant="slideUp">
 *   <Outlet />
 * </PageTransition>
 * ```
 */
export function PageTransition({
  children,
  variant = 'fade',
  variants: customVariants,
  className,
  mode = 'wait',
}: PageTransitionProps) {
  const animation = useAnimationOptional();
  const routerState = useRouterState();

  // Get the current route key for animation triggers
  const routeKey = routerState.location.pathname;

  // Select variants based on reduced motion and props
  const variants = useMemo(() => {
    if (animation?.reducedMotion) {
      return reducedMotionFade;
    }
    return customVariants ?? variantMap[variant];
  }, [animation?.reducedMotion, customVariants, variant]);

  // Get transitions
  const transitions = useMemo(() => {
    if (animation?.reducedMotion) {
      return { duration: 0 };
    }
    return undefined; // Use variant's built-in transitions
  }, [animation?.reducedMotion]);

  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={routeKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transitions}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// PageTransitionWrapper Component
// ============================================================================

export interface PageTransitionWrapperProps {
  children: ReactNode;
  /** Unique key for this page (defaults to pathname) */
  pageKey?: string;
  /** Animation variant */
  variant?: PageTransitionVariant;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PageTransitionWrapper
 *
 * Simpler wrapper that doesn't use AnimatePresence.
 * Use this when you want to animate individual page content
 * without managing exit animations at the root level.
 *
 * @example
 * ```tsx
 * // In a page component
 * export function DashboardPage() {
 *   return (
 *     <PageTransitionWrapper>
 *       <h1>Dashboard</h1>
 *       <DashboardContent />
 *     </PageTransitionWrapper>
 *   );
 * }
 * ```
 */
export function PageTransitionWrapper({
  children,
  pageKey,
  variant = 'fade',
  className,
}: PageTransitionWrapperProps) {
  const animation = useAnimationOptional();

  const variants = useMemo(() => {
    if (animation?.reducedMotion) {
      return reducedMotionFade;
    }
    return variantMap[variant];
  }, [animation?.reducedMotion, variant]);

  return (
    <motion.div
      key={pageKey}
      variants={variants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// usePageTransition Hook
// ============================================================================

/**
 * usePageTransition
 *
 * Hook for accessing page transition utilities.
 *
 * @example
 * ```tsx
 * const { variants, reducedMotion, enterTransition } = usePageTransition('slideUp');
 *
 * return (
 *   <motion.div
 *     variants={variants}
 *     initial="initial"
 *     animate="animate"
 *     transition={enterTransition}
 *   >
 *     Content
 *   </motion.div>
 * );
 * ```
 */
export function usePageTransition(variant: PageTransitionVariant = 'fade') {
  const animation = useAnimationOptional();
  const reducedMotion = animation?.reducedMotion ?? false;

  const variants = useMemo(() => {
    if (reducedMotion) {
      return reducedMotionFade;
    }
    return variantMap[variant];
  }, [reducedMotion, variant]);

  const enterTransition = useMemo(() => {
    if (reducedMotion) {
      return { duration: 0 };
    }
    return pageEnterTransition;
  }, [reducedMotion]);

  const exitTransition = useMemo(() => {
    if (reducedMotion) {
      return { duration: 0 };
    }
    return pageExitTransition;
  }, [reducedMotion]);

  return {
    variants,
    reducedMotion,
    enterTransition,
    exitTransition,
  };
}
