import * as React from 'react';
import type { DriftedField, DriftResult } from '@nasnet/state/stores';
/**
 * Drift Diff Viewer Component
 *
 * Displays a side-by-side comparison of configuration (desired state)
 * vs deployment (actual state) for drift resolution.
 *
 * Features:
 * - Side-by-side diff view
 * - Field-level highlighting of changes
 * - Syntax highlighting for network values (IPs, MACs)
 * - JSON diff support for complex objects
 * - Categorized field grouping
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 */
export interface DriftDiffViewerProps {
    /**
     * Drift detection result containing drifted fields
     */
    result: DriftResult;
    /**
     * Additional className for the root element
     */
    className?: string;
    /**
     * Whether to show the field category badges
     * @default true
     */
    showCategories?: boolean;
    /**
     * Maximum height for the viewer (scrollable)
     */
    maxHeight?: number | string;
    /**
     * Callback when a field is selected (for partial resolution)
     */
    onFieldSelect?: (field: DriftedField) => void;
    /**
     * Currently selected fields (for partial resolution)
     */
    selectedFields?: string[];
}
export declare const DriftDiffViewer: React.ForwardRefExoticComponent<DriftDiffViewerProps & React.RefAttributes<HTMLDivElement>>;
export type { DriftedField };
//# sourceMappingURL=DriftDiffViewer.d.ts.map