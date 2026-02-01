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

// ============================================================================
// Animation Provider & Context
// ============================================================================

export {
  AnimationProvider,
  useAnimation,
  useAnimationOptional,
  MotionConfig,
  type AnimationProviderProps,
  type MotionConfigProps,
} from './AnimationProvider';

// ============================================================================
// Animation Presets
// ============================================================================

export {
  // Transitions
  enterTransition,
  exitTransition,
  moveTransition,
  springTransition,
  pageEnterTransition,
  pageExitTransition,
  fastTransition,
  instantTransition,

  // Fade variants
  fadeIn,
  fadeOut,

  // Slide variants
  slideUp,
  slideDown,
  slideLeft,
  slideRight,

  // Scale variants
  scaleIn,
  scaleOut,
  popIn,

  // Page transition variants
  pageFade,
  pageSlideUp,

  // Drawer/sheet variants
  drawerRight,
  drawerLeft,
  bottomSheet,
  backdrop,

  // Stagger variants
  staggerContainer,
  staggerItem,
  staggerContainerFast,

  // Reduced motion variants
  reducedMotionFade,
  reducedMotionInstant,

  // Micro-interaction variants
  buttonPress,
  hoverLift,
  pulse,
  connectionPulse,
  shimmer,

  // Layout variants
  listItem,
  collapse,

  // Success/error variants
  successCheck,
  errorShake,

  // Utility
  getVariant,
} from './presets';

// ============================================================================
// Page Transitions
// ============================================================================

export {
  PageTransition,
  PageTransitionWrapper,
  usePageTransition,
  type PageTransitionProps,
  type PageTransitionWrapperProps,
  type PageTransitionVariant,
} from './PageTransition';

// ============================================================================
// Shared Element Transitions
// ============================================================================

export {
  SharedElement,
  SharedElementRoot,
  SharedElementGroup,
  SharedImage,
  type SharedElementProps,
  type SharedElementRootProps,
  type SharedElementGroupProps,
  type SharedImageProps,
} from './SharedElement';

// ============================================================================
// Animated Lists
// ============================================================================

export {
  AnimatedList,
  DragHandle,
  StaggeredList,
  StaggeredItem,
  type AnimatedListProps,
  type DragHandleProps,
  type StaggeredListProps,
  type StaggeredItemProps,
} from './AnimatedList';

// ============================================================================
// Bottom Sheet (Mobile)
// ============================================================================

export {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetContent,
  BottomSheetFooter,
  useBottomSheet,
  type BottomSheetProps,
  type BottomSheetHeaderProps,
  type BottomSheetContentProps,
  type BottomSheetFooterProps,
} from './BottomSheet';

// ============================================================================
// Scroll Animations
// ============================================================================

export {
  useInViewAnimation,
  useScrollAnimation,
  useRevealAnimation,
  useStaggeredReveal,
  type UseInViewAnimationOptions,
  type UseInViewAnimationReturn,
  type UseScrollAnimationOptions,
  type UseRevealAnimationOptions,
  type UseRevealAnimationReturn,
  type UseStaggeredRevealOptions,
} from './useInViewAnimation';

// ============================================================================
// Error Handling
// ============================================================================

export {
  AnimationErrorBoundary,
  AnimationTimeout,
  withAnimationFallback,
  useAnimationSafety,
  type AnimationErrorBoundaryProps,
  type AnimationTimeoutProps,
  type WithAnimationFallbackOptions,
} from './AnimationErrorBoundary';

// ============================================================================
// Re-exports from Framer Motion (commonly used)
// ============================================================================

export {
  motion,
  AnimatePresence,
  LayoutGroup,
  useAnimation as useFramerAnimation,
  useAnimationControls,
  useInView,
  useScroll,
  useTransform,
  useSpring,
  useDragControls,
  type Variants,
  type Transition,
  type AnimationControls,
} from 'framer-motion';
