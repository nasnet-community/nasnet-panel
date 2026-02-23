/**
 * Cross-Resource Validation Types
 *
 * Types for displaying validation conflicts across resources
 * such as IP collisions, port conflicts, and duplicate MACs.
 *
 * @module @nasnet/ui/patterns/cross-resource-validation
 */
/**
 * Types of cross-resource conflicts
 */
export type ConflictType = 'ip_collision' | 'port_conflict' | 'duplicate_mac' | 'subnet_overlap' | 'route_conflict' | 'vlan_conflict' | 'interface_conflict' | 'name_duplicate';
/**
 * Severity of the conflict
 */
export type ConflictSeverity = 'error' | 'warning' | 'info';
/**
 * A resource involved in the conflict
 */
export interface ConflictResource {
    /** Resource type (e.g., "dhcp-server", "interface", "firewall-rule") */
    type: string;
    /** Resource identifier */
    id: string;
    /** Human-readable name */
    name: string;
    /** Path or location in config */
    path?: string;
    /** The conflicting value */
    value?: string;
}
/**
 * Resolution option for a conflict
 */
export interface ConflictResolution {
    /** Unique identifier for this resolution */
    id: string;
    /** Human-readable label */
    label: string;
    /** Detailed description of what this resolution does */
    description: string;
    /** Whether this is the recommended resolution */
    recommended?: boolean;
    /** Action to take (callback or identifier) */
    action: string;
    /** Whether this resolution is destructive */
    destructive?: boolean;
}
/**
 * A single cross-resource conflict
 */
export interface ResourceConflict {
    /** Unique identifier for this conflict */
    id: string;
    /** Type of conflict */
    type: ConflictType;
    /** Severity level */
    severity: ConflictSeverity;
    /** Human-readable title */
    title: string;
    /** Detailed description */
    description: string;
    /** Resources involved in the conflict */
    resources: ConflictResource[];
    /** Available resolutions */
    resolutions: ConflictResolution[];
    /** The value causing the conflict (e.g., "192.168.1.1") */
    conflictValue?: string;
    /** Link to documentation about this conflict type */
    helpUrl?: string;
}
/**
 * Configuration labels for conflict types
 */
export declare const CONFLICT_TYPE_LABELS: Record<ConflictType, string>;
/**
 * Icons for conflict types (Lucide icon names)
 */
export declare const CONFLICT_TYPE_ICONS: Record<ConflictType, string>;
//# sourceMappingURL=types.d.ts.map