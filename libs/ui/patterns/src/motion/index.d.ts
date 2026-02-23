/**
 * @nasnet/ui/patterns/motion
 *
 * Animation system for NasNetConnect using Framer Motion.
 *
 * This module provides:
 * - Animation tokens and presets
 * - AnimationProvider for context
 * - Page transition components
 * - Shared element transitions
 * - Reorderable lists
 * - Mobile bottom sheet with gestures
 * - Scroll-triggered animations
 * - Error boundaries
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */
export { AnimationProvider, useAnimation, useAnimationOptional, MotionConfig, type AnimationProviderProps, type MotionConfigProps, } from './AnimationProvider';
export { enterTransition, exitTransition, moveTransition, springTransition, pageEnterTransition, pageExitTransition, fastTransition, instantTransition, fadeIn, fadeOut, slideUp, slideDown, slideLeft, slideRight, scaleIn, scaleOut, popIn, pageFade, pageSlideUp, drawerRight, drawerLeft, bottomSheet, backdrop, staggerContainer, staggerItem, staggerContainerFast, reducedMotionFade, reducedMotionInstant, buttonPress, hoverLift, pulse, connectionPulse, shimmer, listItem, collapse, successCheck, errorShake, getVariant, } from './presets';
export { PageTransition, PageTransitionWrapper, usePageTransition, type PageTransitionProps, type PageTransitionWrapperProps, type PageTransitionVariant, } from './PageTransition';
export { SharedElement, SharedElementRoot, SharedElementGroup, SharedImage, type SharedElementProps, type SharedElementRootProps, type SharedElementGroupProps, type SharedImageProps, } from './SharedElement';
export { AnimatedList, DragHandle, StaggeredList, StaggeredItem, type AnimatedListProps, type DragHandleProps, type StaggeredListProps, type StaggeredItemProps, } from './AnimatedList';
export { BottomSheet, BottomSheetHeader, BottomSheetContent, BottomSheetFooter, useBottomSheet, type BottomSheetProps, type BottomSheetHeaderProps, type BottomSheetContentProps, type BottomSheetFooterProps, } from './BottomSheet';
export { useInViewAnimation, useScrollAnimation, useRevealAnimation, useStaggeredReveal, type UseInViewAnimationOptions, type UseInViewAnimationReturn, type UseScrollAnimationOptions, type UseRevealAnimationOptions, type UseRevealAnimationReturn, type UseStaggeredRevealOptions, } from './useInViewAnimation';
export { AnimationErrorBoundary, AnimationTimeout, withAnimationFallback, useAnimationSafety, type AnimationErrorBoundaryProps, type AnimationTimeoutProps, type WithAnimationFallbackOptions, } from './AnimationErrorBoundary';
export { motion, AnimatePresence, LayoutGroup, useAnimation as useFramerAnimation, useAnimationControls, useInView, useScroll, useTransform, useSpring, useDragControls, type Variants, type Transition, type AnimationControls, } from 'framer-motion';
//# sourceMappingURL=index.d.ts.map