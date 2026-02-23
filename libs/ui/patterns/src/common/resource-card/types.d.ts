/**
 * ResourceCard Types
 *
 * TypeScript interfaces and types for the ResourceCard pattern component.
 * Provides type-safe configuration for resource display cards with platform-specific rendering.
 *
 * @see ADR-018: Headless + Platform Presenters
 */
import type { ReactNode } from 'react';
/**
 * Resource status values - Platform-agnostic status indicators
 *
 * Maps to semantic color tokens:
 * - online/connected → statusConnected (green #22C55E)
 * - offline/disconnected → statusDisconnected (gray)
 * - pending → statusPending (amber #F59E0B)
 * - error/warning → statusError (red #EF4444)
 * - unknown → gray (muted)
 */
export type ResourceStatus = 'online' | 'offline' | 'connected' | 'disconnected' | 'pending' | 'error' | 'warning' | 'unknown';
/**
 * Action button configuration for resource card actions
 *
 * Actions are rendered differently per platform:
 * - Mobile: Full-width buttons stacked vertically, or swipe-revealed menu
 * - Tablet: Horizontal button group or dropdown
 * - Desktop: Dropdown menu or visible buttons depending on space
 *
 * @example
 * ```tsx
 * const actions: ResourceAction[] = [
 *   {
 *     id: 'connect',
 *     label: 'Connect',
 *     icon: <PlugIcon />,
 *     onClick: handleConnect,
 *     variant: 'default',
 *   },
 *   {
 *     id: 'delete',
 *     label: 'Delete',
 *     onClick: handleDelete,
 *     variant: 'destructive',
 *     disabled: !canDelete,
 *   },
 * ];
 * ```
 */
export interface ResourceAction {
    /** Unique action identifier for tracking and testing */
    id: string;
    /** Translatable display label (i18n key or plain text) */
    label: string;
    /** Optional icon component to display with label */
    icon?: ReactNode;
    /** Click handler invoked when action is triggered */
    onClick: () => void;
    /** Variant for styling: affects button appearance and semantics */
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
    /** Whether the action is disabled - disabled actions are shown but non-interactive */
    disabled?: boolean;
    /** Loading/pending state - shows spinner and disables action */
    loading?: boolean;
}
/**
 * Base resource interface - All resources must extend this
 *
 * Follows the Universal State v2 8-layer model:
 * - Layer 1 (Configuration): User-editable desired state
 * - Layer 3 (Deployment): Router-applied state (in runtime.status)
 * - Layer 4 (Runtime): Live operational data (in runtime object)
 * - Layer 6 (Metadata): Timestamps, version, ULID (optional)
 *
 * ResourceCard displays configuration with runtime status indicator.
 *
 * @typeParam T - Specific resource type extending BaseResource
 */
export interface BaseResource {
    /** Unique immutable identifier (ULID, UUID, or platform-specific) */
    id: string;
    /** Display name - user-visible, editable */
    name: string;
    /** Optional detailed description - shown on detail views */
    description?: string;
    /** Runtime state container - actual observed state on router */
    runtime?: {
        /** Current operational status - drives status badge color and icon */
        status?: ResourceStatus;
        /** Last time this resource was observed/updated (ISO 8601 or Date) */
        lastSeen?: Date | string;
        /** Additional runtime metrics or state (open extension for domain-specific data) */
        [key: string]: unknown;
    };
}
/**
 * ResourceCard component props
 *
 * Follows Three-Layer Architecture: headless hook provides logic,
 * three platform presenters render layout (Mobile/Tablet/Desktop).
 * Auto-detection via usePlatform() selects appropriate presenter.
 *
 * Platform differences:
 * - Mobile: Card layout, full-width buttons, 44px touch targets, bottom sheet for actions
 * - Tablet: Hybrid, swipe-reveal or dropdown, 38-44px targets
 * - Desktop: Dense, hover states, dropdown menus, all details visible
 *
 * @typeParam T - Resource type extending BaseResource
 * @example
 * ```tsx
 * // Basic resource card with auto platform detection
 * <ResourceCard<VPNClient>
 *   resource={vpnClient}
 *   actions={clientActions}
 * />
 *
 * // With expanded state and callbacks
 * <ResourceCard<FirewallRule>
 *   resource={rule}
 *   expanded={isExpanded}
 *   onToggle={() => setExpanded(!isExpanded)}
 *   onClick={() => navigateToDetail(rule.id)}
 *   showLivePulse
 *   className="mb-4"
 * />
 * ```
 */
export interface ResourceCardProps<T extends BaseResource> {
    /** The resource to display - typed to specific resource domain */
    resource: T;
    /** Array of actions available on the card - primary action first, secondary actions after */
    actions?: ResourceAction[];
    /** Whether the card is in expanded state - for collapsible/expandable variants */
    expanded?: boolean;
    /** Callback invoked when user toggles expanded state - typically sets parent state */
    onToggle?: () => void;
    /** Callback invoked when entire card is clicked (not action buttons) */
    onClick?: () => void;
    /** Whether to show animated pulse for online/connected status - draws attention to live indicators */
    showLivePulse?: boolean;
    /** Additional CSS classes to apply to card root element */
    className?: string;
    /** Custom content to render in card body - allows flexible content composition */
    children?: ReactNode;
}
//# sourceMappingURL=types.d.ts.map