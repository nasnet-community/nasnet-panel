/**
 * AnimatedList
 * Reorderable list with smooth layout animations using Framer Motion.
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */
import { type ReactNode } from 'react';
import { type DragControls, type HTMLMotionProps } from 'framer-motion';
export interface AnimatedListProps<T> {
    /** List items with unique keys */
    items: T[];
    /** Callback when items are reordered */
    onReorder: (items: T[]) => void;
    /** Render function for each item */
    children: (item: T, index: number, dragControls: DragControls) => ReactNode;
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
export declare function AnimatedList<T>({ items, onReorder, children, getKey, className, itemClassName, axis, disabled, animateEntrance, layoutMode, }: AnimatedListProps<T>): import("react/jsx-runtime").JSX.Element;
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
export declare function DragHandle({ disabled, className, ...props }: DragHandleProps): import("react/jsx-runtime").JSX.Element;
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
export declare function StaggeredList({ children, className, animateOnMount, }: StaggeredListProps): import("react/jsx-runtime").JSX.Element;
export interface StaggeredItemProps extends HTMLMotionProps<'div'> {
    children: ReactNode;
}
/**
 * StaggeredItem
 *
 * Individual item in a StaggeredList with entrance animation.
 */
export declare function StaggeredItem({ children, className, ...props }: StaggeredItemProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AnimatedList.d.ts.map