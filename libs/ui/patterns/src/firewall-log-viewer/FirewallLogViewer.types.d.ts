/**
 * FirewallLogViewer Types
 *
 * TypeScript interfaces for the firewall log viewer pattern component.
 *
 * @module @nasnet/ui/patterns/firewall-log-viewer
 */
import type { UseFirewallLogViewerReturn } from './use-firewall-log-viewer';
/**
 * Props for FirewallLogViewer component
 */
export interface FirewallLogViewerProps {
    /**
     * Router ID to fetch logs for
     */
    routerId: string;
    /**
     * Callback when log prefix is clicked for navigation
     */
    onPrefixClick?: (prefix: string, ruleId?: string) => void;
    /**
     * Callback when "Add to Blocklist" is clicked (from stats)
     */
    onAddToBlocklist?: (ip: string) => void;
    /**
     * Container className
     */
    className?: string;
}
/**
 * Props for platform-specific presenters
 */
export interface FirewallLogViewerPresenterProps extends FirewallLogViewerProps {
    /**
     * Viewer state and actions from headless hook
     */
    viewer: UseFirewallLogViewerReturn;
    /**
     * Available log prefixes for filter autocomplete
     */
    availablePrefixes: string[];
}
/**
 * Action color mappings using semantic tokens
 */
export declare const ACTION_COLORS: {
    readonly accept: {
        readonly bg: "bg-success/10";
        readonly text: "text-success";
        readonly border: "border-success/20";
    };
    readonly drop: {
        readonly bg: "bg-error/10";
        readonly text: "text-error";
        readonly border: "border-error/20";
    };
    readonly reject: {
        readonly bg: "bg-error/10";
        readonly text: "text-error";
        readonly border: "border-error/20";
    };
    readonly unknown: {
        readonly bg: "bg-muted/50";
        readonly text: "text-muted-foreground";
        readonly border: "border-muted";
    };
};
/**
 * Helper to get action color classes
 */
export declare function getActionColorClasses(action: string): {
    readonly bg: "bg-success/10";
    readonly text: "text-success";
    readonly border: "border-success/20";
} | {
    readonly bg: "bg-error/10";
    readonly text: "text-error";
    readonly border: "border-error/20";
} | {
    readonly bg: "bg-error/10";
    readonly text: "text-error";
    readonly border: "border-error/20";
} | {
    readonly bg: "bg-muted/50";
    readonly text: "text-muted-foreground";
    readonly border: "border-muted";
};
//# sourceMappingURL=FirewallLogViewer.types.d.ts.map