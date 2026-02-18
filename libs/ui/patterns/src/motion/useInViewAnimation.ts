/**
 * useInViewAnimation
 * Scroll-triggered animation hooks using Framer Motion's useInView.
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */

import { useRef, useMemo, type RefObject } from 'react';

import { useInView, type UseInViewOptions } from 'framer-motion';

import { useAnimationOptional } from './AnimationProvider';

// ============================================================================
// Types
// ============================================================================

export interface UseInViewAnimationOptions {
  /** Only trigger animation once */
  once?: boolean;
  /** Amount of element visible before triggering (0-1) */
  amount?: 'some' | 'all' | number;
  /** Root element for intersection observer */
  root?: RefObject<Element | null>;
}

export interface UseInViewAnimationReturn {
  /** Ref to attach to the element */
  ref: RefObject<HTMLElement>;
  /** Whether the element is currently in view */
  isInView: boolean;
  /** Whether animation should be shown (respects reduced motion) */
  shouldAnimate: boolean;
}

// ============================================================================
// useInViewAnimation Hook
// ============================================================================

/**
 * useInViewAnimation
 *
 * Hook for scroll-triggered animations with reduced motion support.
 *
 * @example
 * ```tsx
 * function FadeInSection() {
 *   const { ref, isInView, shouldAnimate } = useInViewAnimation({
 *     once: true,
 *     amount: 0.3,
 *   });
 *
 *   return (
 *     <motion.div
 *       ref={ref}
 *       initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
 *       animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
 *       transition={{ duration: 0.5 }}
 *     >
 *       Content that fades in on scroll
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useInViewAnimation(
  options: UseInViewAnimationOptions = {}
): UseInViewAnimationReturn {
  const { once = true, amount = 0.3, root } = options;

  const animation = useAnimationOptional();
  const reducedMotion = animation?.reducedMotion ?? false;

  const ref = useRef<HTMLElement>(null);

  const inViewOptions: UseInViewOptions = useMemo(
    () => ({
      once,
      amount,
      root,
    }),
    [once, amount, root]
  );

  const isInView = useInView(ref as RefObject<Element>, inViewOptions);

  // If reduced motion, always show content immediately
  const shouldAnimate = !reducedMotion;
  const effectiveIsInView = reducedMotion ? true : isInView;

  return {
    ref: ref as RefObject<HTMLElement>,
    isInView: effectiveIsInView,
    shouldAnimate,
  };
}

// ============================================================================
// useScrollAnimation Hook
// ============================================================================

export interface UseScrollAnimationOptions {
  /** Start value (0-1) for animation progress */
  start?: number;
  /** End value (0-1) for animation progress */
  end?: number;
  /** Whether to clamp values between 0-1 */
  clamp?: boolean;
}

/**
 * useScrollAnimation
 *
 * Hook for scroll-linked animations (not just in-view triggers).
 * Returns a progress value (0-1) based on scroll position.
 *
 * Note: This is a simplified version. For advanced scroll-linked
 * animations, use framer-motion's useScroll and useTransform directly.
 *
 * @example
 * ```tsx
 * function ParallaxSection() {
 *   const { ref, progress, shouldAnimate } = useScrollAnimation();
 *
 *   const y = useTransform(progress, [0, 1], [0, -50]);
 *
 *   return (
 *     <motion.div ref={ref} style={shouldAnimate ? { y } : undefined}>
 *       Parallax content
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useScrollAnimation(_options: UseScrollAnimationOptions = {}) {
  const animation = useAnimationOptional();
  const reducedMotion = animation?.reducedMotion ?? false;

  const ref = useRef<HTMLElement>(null);

  // For scroll-linked animations, we'd typically use useScroll here
  // but that requires more complex setup. This is a placeholder.
  // In practice, you'd use:
  // const { scrollYProgress } = useScroll({ target: ref });

  return {
    ref: ref as RefObject<HTMLElement>,
    shouldAnimate: !reducedMotion,
    // progress would come from useScroll in real implementation
  };
}

// ============================================================================
// useRevealAnimation Hook
// ============================================================================

export interface UseRevealAnimationOptions extends UseInViewAnimationOptions {
  /** Delay before animation starts (in ms) */
  delay?: number;
  /** Direction to reveal from */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Distance to animate from (in px) */
  distance?: number;
}

export interface UseRevealAnimationReturn extends UseInViewAnimationReturn {
  /** Initial animation state */
  initial: { opacity: number; x?: number; y?: number } | false;
  /** Animate-to state */
  animate: { opacity: number; x: number; y: number };
  /** Animation transition config */
  transition: { duration: number; delay: number };
}

/**
 * useRevealAnimation
 *
 * Convenience hook that returns ready-to-use animation props.
 *
 * @example
 * ```tsx
 * function RevealCard() {
 *   const { ref, isInView, initial, animate, transition } = useRevealAnimation({
 *     direction: 'up',
 *     delay: 100,
 *   });
 *
 *   return (
 *     <motion.div
 *       ref={ref}
 *       initial={initial}
 *       animate={isInView ? animate : initial}
 *       transition={transition}
 *     >
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useRevealAnimation(
  options: UseRevealAnimationOptions = {}
): UseRevealAnimationReturn {
  const {
    delay = 0,
    direction = 'up',
    distance = 20,
    ...inViewOptions
  } = options;

  const { ref, isInView, shouldAnimate } = useInViewAnimation(inViewOptions);

  // Calculate offset based on direction
  const offset = useMemo(() => {
    switch (direction) {
      case 'up':
        return { x: 0, y: distance };
      case 'down':
        return { x: 0, y: -distance };
      case 'left':
        return { x: distance, y: 0 };
      case 'right':
        return { x: -distance, y: 0 };
      case 'none':
      default:
        return { x: 0, y: 0 };
    }
  }, [direction, distance]);

  const initial = useMemo(
    () =>
      shouldAnimate
        ? { opacity: 0, x: offset.x, y: offset.y }
        : false,
    [shouldAnimate, offset]
  );

  const animate = useMemo(
    () => ({ opacity: 1, x: 0, y: 0 }),
    []
  );

  const transition = useMemo(
    () => ({ duration: 0.5, delay: delay / 1000 }),
    [delay]
  );

  return {
    ref,
    isInView,
    shouldAnimate,
    initial,
    animate,
    transition,
  };
}

// ============================================================================
// useStaggeredReveal Hook
// ============================================================================

export interface UseStaggeredRevealOptions extends UseInViewAnimationOptions {
  /** Number of items in the list */
  itemCount: number;
  /** Stagger delay between items (in ms) */
  staggerDelay?: number;
  /** Base delay before first item (in ms) */
  baseDelay?: number;
}

/**
 * useStaggeredReveal
 *
 * Hook for staggered reveal animations on scroll.
 *
 * @example
 * ```tsx
 * function StaggeredList({ items }) {
 *   const { ref, isInView, getItemDelay } = useStaggeredReveal({
 *     itemCount: items.length,
 *     staggerDelay: 50,
 *   });
 *
 *   return (
 *     <div ref={ref}>
 *       {items.map((item, i) => (
 *         <motion.div
 *           key={item.id}
 *           initial={{ opacity: 0, y: 10 }}
 *           animate={isInView ? { opacity: 1, y: 0 } : undefined}
 *           transition={{ delay: getItemDelay(i) }}
 *         >
 *           {item.name}
 *         </motion.div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useStaggeredReveal(options: UseStaggeredRevealOptions) {
  const {
    itemCount,
    staggerDelay = 50,
    baseDelay = 0,
    ...inViewOptions
  } = options;

  const { ref, isInView, shouldAnimate } = useInViewAnimation(inViewOptions);

  const getItemDelay = useMemo(
    () => (index: number) => {
      if (!shouldAnimate) return 0;
      return (baseDelay + index * staggerDelay) / 1000;
    },
    [shouldAnimate, baseDelay, staggerDelay]
  );

  return {
    ref,
    isInView,
    shouldAnimate,
    getItemDelay,
  };
}
