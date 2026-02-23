/**
 * DragHandle Component
 *
 * Optional grip icon for dragging items.
 * Can be used as an explicit drag trigger point.
 *
 * Features:
 * - 44x44px minimum touch target (WCAG AAA)
 * - Proper focus indicators
 * - Icon-only button with accessible label
 *
 * @see NAS-4.21: Implement Drag & Drop System
 *
 * @example
 * ```tsx
 * <DragHandle
 *   aria-label="Drag to reorder"
 *   {...dragHandleListeners}
 * />
 * ```
 */
import * as React from 'react';
import type { DragHandleProps } from '../types';
/**
 * Memoized DragHandle to prevent unnecessary re-renders
 */
export declare const DragHandle: React.MemoExoticComponent<React.ForwardRefExoticComponent<DragHandleProps & React.RefAttributes<HTMLButtonElement>>>;
export default DragHandle;
//# sourceMappingURL=DragHandle.d.ts.map