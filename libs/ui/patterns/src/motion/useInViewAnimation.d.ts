/**
 * useInViewAnimation
 * Scroll-triggered animation hooks using Framer Motion's useInView.
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */
import { type RefObject } from 'react';
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
export declare function useInViewAnimation(options?: UseInViewAnimationOptions): UseInViewAnimationReturn;
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
export declare function useScrollAnimation(_options?: UseScrollAnimationOptions): {
    ref: RefObject<HTMLElement>;
    shouldAnimate: boolean;
};
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
    initial: {
        opacity: number;
        x?: number;
        y?: number;
    } | false;
    /** Animate-to state */
    animate: {
        opacity: number;
        x: number;
        y: number;
    };
    /** Animation transition config */
    transition: {
        duration: number;
        delay: number;
    };
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
export declare function useRevealAnimation(options?: UseRevealAnimationOptions): UseRevealAnimationReturn;
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
export declare function useStaggeredReveal(options: UseStaggeredRevealOptions): {
    ref: RefObject<HTMLElement>;
    isInView: boolean;
    shouldAnimate: boolean;
    getItemDelay: (index: number) => number;
};
//# sourceMappingURL=useInViewAnimation.d.ts.map