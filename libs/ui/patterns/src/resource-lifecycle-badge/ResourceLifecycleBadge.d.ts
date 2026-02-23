/**
 * Resource Lifecycle Badge
 *
 * Displays the lifecycle state of a resource with appropriate colors and icons.
 * Part of Universal State v2 Resource Model.
 *
 * @see NAS-4.7: Universal State v2 Resource Model
 */
import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import type { ResourceLifecycleState } from '@nasnet/core/types';
declare const lifecycleBadgeVariants: (props?: ({
    state?: "DRAFT" | "VALIDATING" | "VALID" | "APPLYING" | "ACTIVE" | "DEGRADED" | "ERROR" | "DEPRECATED" | "ARCHIVED" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface ResourceLifecycleBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>, VariantProps<typeof lifecycleBadgeVariants> {
    /** Resource lifecycle state */
    state: ResourceLifecycleState;
    /** Override the default label */
    label?: string;
    /** Show icon before label */
    showIcon?: boolean;
    /** Show tooltip with description */
    showTooltip?: boolean;
}
export declare const ResourceLifecycleBadge: React.ForwardRefExoticComponent<ResourceLifecycleBadgeProps & React.RefAttributes<HTMLSpanElement>>;
export { lifecycleBadgeVariants };
export default ResourceLifecycleBadge;
//# sourceMappingURL=ResourceLifecycleBadge.d.ts.map