/**
 * AnimatedList
 * Reorderable list with smooth layout animations using Framer Motion.
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */

import {
  type ReactNode,
  type CSSProperties,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {
  Reorder,
  motion,
  AnimatePresence,
  useDragControls,
  type DragControls,
  type HTMLMotionProps,
} from 'framer-motion';
import { useAnimation, useAnimationOptional } from './AnimationProvider';
import {
  staggerContainer,
  staggerItem,
  listItem,
  reducedMotionFade,
  moveTransition,
} from './presets';
import { cn } from '@nasnet/ui/primitives';

// ============================================================================
// Types
// ============================================================================

export interface AnimatedListProps<T> {
  /** List items with unique keys */
  items: T[];
  /** Callback when items are reordered */
  onReorder: (items: T[]) => void;
  /** Render function for each item */
  children: (
    item: T,
    index: number,
    dragControls: DragControls
  ) => ReactNode;
  /** Get unique key for each item */
  getKey: (item: T) => string | number;
  /** Additional CSS classes for the list */
  className?: string;
  /** Additional CSS classes for items */
  itemClassName?: string;
  /** Axis for reordering (x, y, or both) */
  axis?: 'x' | 'y';
  /** Disable reordering */
  disabled?: boolean;
  /** Show entrance animations */
  animateEntrance?: boolean;
  /** Layout animation mode */
  layoutMode?: 'position' | 'size' | true | false;
}

// ============================================================================
// AnimatedList Component
// ============================================================================

/**
 * AnimatedList
 *
 * A drag-and-drop reorderable list with smooth animations.
 *
 * @example
 * ```tsx
 * const [items, setItems] = useState(initialItems);
 *
 * <AnimatedList
 *   items={items}
 *   onReorder={setItems}
 *   getKey={(item) => item.id}
 * >
 *   {(item, index, dragControls) => (
 *     <div className="flex items-center gap-2">
 *       <DragHandle onPointerDown={(e) => dragControls.start(e)} />
 *       <span>{item.name}</span>
 *     </div>
 *   )}
 * </AnimatedList>
 * ```
 */
export function AnimatedList<T>({
  items,
  onReorder,
  children,
  getKey,
  className,
  itemClassName,
  axis = 'y',
  disabled = false,
  animateEntrance = true,
  layoutMode = 'position',
}: AnimatedListProps<T>) {
  const animation = useAnimationOptional();
  const reducedMotion = animation?.reducedMotion ?? false;

  // If disabled or reduced motion, render static list
  if (disabled || reducedMotion) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {items.map((item, index) => {
          const dragControls = useDragControls();
          return (
            <div key={getKey(item)} className={itemClassName}>
              {children(item, index, dragControls)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Reorder.Group
      axis={axis}
      values={items}
      onReorder={onReorder}
      className={cn('flex flex-col gap-2', className)}
      as="div"
    >
      <AnimatePresence initial={animateEntrance}>
        {items.map((item, index) => (
          <AnimatedListItem
            key={getKey(item)}
            item={item}
            index={index}
            itemClassName={itemClassName}
            layoutMode={layoutMode}
          >
            {children}
          </AnimatedListItem>
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
}

// ============================================================================
// AnimatedListItem Component
// ============================================================================

interface AnimatedListItemProps<T> {
  item: T;
  index: number;
  children: (item: T, index: number, dragControls: DragControls) => ReactNode;
  itemClassName?: string;
  layoutMode?: 'position' | 'size' | true | false;
}

function AnimatedListItem<T>({
  item,
  index,
  children,
  itemClassName,
  layoutMode,
}: AnimatedListItemProps<T>) {
  const dragControls = useDragControls();
  const ref = useRef<HTMLDivElement>(null);

  // Apply will-change during drag
  const handleDragStart = useCallback(() => {
    if (ref.current) {
      ref.current.style.willChange = 'transform';
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (ref.current) {
      ref.current.style.willChange = 'auto';
    }
  }, []);

  return (
    <Reorder.Item
      ref={ref}
      value={item}
      dragListener={false}
      dragControls={dragControls}
      variants={listItem}
      initial="initial"
      animate="animate"
      exit="exit"
      layout={layoutMode === false ? undefined : layoutMode === 'size' ? true : layoutMode}
      transition={moveTransition}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn('cursor-default', itemClassName)}
      as="div"
    >
      {children(item, index, dragControls)}
    </Reorder.Item>
  );
}

// ============================================================================
// DragHandle Component
// ============================================================================

export interface DragHandleProps extends HTMLMotionProps<'button'> {
  /** Whether drag is disabled */
  disabled?: boolean;
}

/**
 * DragHandle
 *
 * A visual drag handle for AnimatedList items.
 * Pass the onPointerDown to dragControls.start() to initiate drag.
 *
 * @example
 * ```tsx
 * <AnimatedList ...>
 *   {(item, index, dragControls) => (
 *     <div className="flex items-center gap-2">
 *       <DragHandle onPointerDown={(e) => dragControls.start(e)} />
 *       <span>{item.name}</span>
 *     </div>
 *   )}
 * </AnimatedList>
 * ```
 */
export function DragHandle({
  disabled = false,
  className,
  ...props
}: DragHandleProps) {
  return (
    <motion.button
      type="button"
      className={cn(
        'flex cursor-grab items-center justify-center p-1 touch-none',
        'text-muted-foreground hover:text-foreground',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.1 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      {...props}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="4" cy="4" r="1.5" />
        <circle cx="12" cy="4" r="1.5" />
        <circle cx="4" cy="8" r="1.5" />
        <circle cx="12" cy="8" r="1.5" />
        <circle cx="4" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
      </svg>
      <span className="sr-only">Drag to reorder</span>
    </motion.button>
  );
}

// ============================================================================
// StaggeredList Component
// ============================================================================

export interface StaggeredListProps {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate on mount */
  animateOnMount?: boolean;
}

/**
 * StaggeredList
 *
 * Wraps a list to add staggered entrance animations.
 * Children should be wrapped in motion.div or use StaggeredItem.
 *
 * @example
 * ```tsx
 * <StaggeredList>
 *   {items.map(item => (
 *     <StaggeredItem key={item.id}>
 *       <Card>{item.name}</Card>
 *     </StaggeredItem>
 *   ))}
 * </StaggeredList>
 * ```
 */
export function StaggeredList({
  children,
  className,
  animateOnMount = true,
}: StaggeredListProps) {
  const animation = useAnimationOptional();

  if (animation?.reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial={animateOnMount ? 'initial' : false}
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// StaggeredItem Component
// ============================================================================

export interface StaggeredItemProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
}

/**
 * StaggeredItem
 *
 * Individual item in a StaggeredList with entrance animation.
 */
export function StaggeredItem({
  children,
  className,
  ...props
}: StaggeredItemProps) {
  const animation = useAnimationOptional();

  if (animation?.reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={staggerItem} className={className} {...props}>
      {children}
    </motion.div>
  );
}
