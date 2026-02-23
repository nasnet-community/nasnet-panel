/**
 * DropZoneIndicator Component
 *
 * Visual indicator showing where an item will be dropped.
 * Appears between items during drag operations.
 *
 * Features:
 * - Animated appearance/disappearance
 * - Positioned before or after items
 * - Accessible (aria-hidden for decorative element)
 *
 * @see NAS-4.21: Implement Drag & Drop System
 *
 * @example
 * ```tsx
 * <DropZoneIndicator visible={isOverItem} position="before" />
 * ```
 */
import * as React from 'react';
import type { DropZoneIndicatorProps } from '../types';
/**
 * Memoized DropZoneIndicator to prevent unnecessary re-renders
 */
export declare const DropZoneIndicator: React.NamedExoticComponent<DropZoneIndicatorProps>;
/**
 * Props for InsertionLine component
 */
export interface InsertionLineProps {
    /** Whether the line is visible */
    visible: boolean;
    /** Optional CSS class name */
    className?: string;
}
/**
 * Memoized InsertionLine to prevent unnecessary re-renders
 */
export declare const InsertionLine: React.NamedExoticComponent<InsertionLineProps>;
export default DropZoneIndicator;
//# sourceMappingURL=DropZoneIndicator.d.ts.map