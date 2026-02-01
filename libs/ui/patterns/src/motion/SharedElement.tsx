/**
 * SharedElement
 * Enables shared element transitions between routes using Framer Motion's layoutId.
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */

import { useRef, useEffect, type ReactNode } from 'react';
import { motion, LayoutGroup, type HTMLMotionProps } from 'framer-motion';
import { useAnimation, useAnimationOptional } from './AnimationProvider';
import { moveTransition } from './presets';
import { cn } from '@nasnet/ui/primitives';

// ============================================================================
// SharedElement Component
// ============================================================================

export interface SharedElementProps extends Omit<HTMLMotionProps<'div'>, 'layoutId'> {
  /** Unique ID that matches across routes for the shared element */
  layoutId: string;
  /** Content to render */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Disable animation for this element */
  disabled?: boolean;
}

/**
 * SharedElement
 *
 * Wrap elements that should animate between routes. Elements with matching
 * layoutIds will smoothly transition between their positions/sizes.
 *
 * @example
 * ```tsx
 * // On list page
 * <SharedElement layoutId={`card-${item.id}`}>
 *   <Card>{item.title}</Card>
 * </SharedElement>
 *
 * // On detail page - same layoutId causes smooth transition
 * <SharedElement layoutId={`card-${item.id}`}>
 *   <HeroCard>{item.title}</HeroCard>
 * </SharedElement>
 * ```
 */
export function SharedElement({
  layoutId,
  children,
  className,
  disabled = false,
  ...props
}: SharedElementProps) {
  const animation = useAnimationOptional();
  const ref = useRef<HTMLDivElement>(null);

  // Clean up will-change after animation
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cleanup = () => {
      el.style.willChange = 'auto';
    };

    el.addEventListener('transitionend', cleanup);
    el.addEventListener('animationend', cleanup);

    return () => {
      el.removeEventListener('transitionend', cleanup);
      el.removeEventListener('animationend', cleanup);
    };
  }, []);

  // If reduced motion or disabled, render without animation
  if (animation?.reducedMotion || disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      layoutId={layoutId}
      className={className}
      transition={animation?.getTransition('move') ?? moveTransition}
      style={{ willChange: 'transform' }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// SharedElementRoot Component
// ============================================================================

export interface SharedElementRootProps {
  children: ReactNode;
  /** Optional group ID for scoping shared elements */
  id?: string;
}

/**
 * SharedElementRoot
 *
 * Wraps the app (or a section) to enable shared element transitions.
 * Place at the root layout level for cross-route animations.
 *
 * @example
 * ```tsx
 * // In __root.tsx
 * <SharedElementRoot>
 *   <Outlet />
 * </SharedElementRoot>
 * ```
 */
export function SharedElementRoot({ children, id }: SharedElementRootProps) {
  return <LayoutGroup id={id}>{children}</LayoutGroup>;
}

// ============================================================================
// SharedElementGroup Component
// ============================================================================

export interface SharedElementGroupProps {
  children: ReactNode;
  /** Group ID for scoping shared elements within a section */
  id: string;
}

/**
 * SharedElementGroup
 *
 * Groups shared elements to prevent unintended cross-animations.
 * Useful when you have multiple lists with similar layoutIds.
 *
 * @example
 * ```tsx
 * <SharedElementGroup id="recent-files">
 *   {recentFiles.map(file => (
 *     <SharedElement layoutId={file.id}>
 *       <FileCard file={file} />
 *     </SharedElement>
 *   ))}
 * </SharedElementGroup>
 * ```
 */
export function SharedElementGroup({ children, id }: SharedElementGroupProps) {
  return <LayoutGroup id={id}>{children}</LayoutGroup>;
}

// ============================================================================
// SharedImage Component
// ============================================================================

export interface SharedImageProps extends Omit<HTMLMotionProps<'img'>, 'layoutId'> {
  /** Unique ID that matches across routes */
  layoutId: string;
  /** Image source */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SharedImage
 *
 * Specialized SharedElement for images with proper aspect ratio handling.
 *
 * @example
 * ```tsx
 * <SharedImage
 *   layoutId={`product-image-${product.id}`}
 *   src={product.imageUrl}
 *   alt={product.name}
 *   className="w-full h-48 object-cover"
 * />
 * ```
 */
export function SharedImage({
  layoutId,
  src,
  alt,
  className,
  ...props
}: SharedImageProps) {
  const animation = useAnimationOptional();

  if (animation?.reducedMotion) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <motion.img
      layoutId={layoutId}
      src={src}
      alt={alt}
      className={cn('object-cover', className)}
      transition={animation?.getTransition('move') ?? moveTransition}
      {...props}
    />
  );
}
