/**
 * Resource Health Indicator
 *
 * Displays the runtime health status of a resource.
 * Part of Universal State v2 Resource Model.
 *
 * @see NAS-4.7: Universal State v2 Resource Model
 */
import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import type { RuntimeState } from '@nasnet/core/types';
declare const healthDotVariants: (props?: ({
    health?: "DEGRADED" | "WARNING" | "HEALTHY" | "CRITICAL" | "FAILED" | "UNKNOWN" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
    pulse?: boolean | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
declare const healthLabelVariants: (props?: ({
    health?: "DEGRADED" | "WARNING" | "HEALTHY" | "CRITICAL" | "FAILED" | "UNKNOWN" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface ResourceHealthIndicatorProps extends React.HTMLAttributes<HTMLDivElement>, Omit<VariantProps<typeof healthDotVariants>, 'health'> {
    /** Runtime health status */
    health: RuntimeState['health'] | undefined | null;
    /** Show label next to dot */
    showLabel?: boolean;
    /** Custom label override */
    label?: string;
    /** Show pulse animation for active states */
    animate?: boolean;
    /** Layout direction */
    direction?: 'row' | 'column';
}
export declare const ResourceHealthIndicator: React.ForwardRefExoticComponent<ResourceHealthIndicatorProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Inline health indicator with dot and label
 */
export declare const ResourceHealthBadge: React.MemoExoticComponent<(props: Omit<ResourceHealthIndicatorProps, "showLabel" | "direction">) => import("react/jsx-runtime").JSX.Element>;
/**
 * Compact health dot only
 */
export declare const ResourceHealthDot: React.MemoExoticComponent<(props: Omit<ResourceHealthIndicatorProps, "showLabel" | "direction">) => import("react/jsx-runtime").JSX.Element>;
export { healthDotVariants, healthLabelVariants };
export default ResourceHealthIndicator;
//# sourceMappingURL=ResourceHealthIndicator.d.ts.map