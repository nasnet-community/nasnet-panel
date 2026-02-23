/**
 * PreFlightDialog Types
 *
 * Type definitions for the PreFlightDialog pattern component.
 * Follows the Headless + Platform Presenter pattern.
 */
/**
 * Service suggestion for stopping to free resources
 */
export interface ServiceSuggestion {
    /**
     * Unique service instance ID
     */
    id: string;
    /**
     * Service name
     */
    name: string;
    /**
     * Memory usage of this service (in MB)
     */
    memoryUsage: number;
    /**
     * Service status
     */
    status: 'running' | 'stopped' | 'pending';
    /**
     * Whether this suggestion is selected
     */
    selected: boolean;
}
/**
 * Error type for insufficient resources
 */
export interface InsufficientResourcesError {
    /**
     * Resource type (currently only 'memory')
     */
    resourceType: 'memory';
    /**
     * Required amount (in MB)
     */
    required: number;
    /**
     * Available amount (in MB)
     */
    available: number;
    /**
     * Deficit amount (in MB) - includes 10% buffer
     */
    deficit: number;
    /**
     * Suggested services to stop
     */
    suggestions: ServiceSuggestion[];
}
/**
 * Props for PreFlightDialog component
 */
export interface PreFlightDialogProps {
    /**
     * Whether the dialog is open
     */
    open: boolean;
    /**
     * Callback when the dialog open state changes
     */
    onOpenChange: (open: boolean) => void;
    /**
     * Insufficient resources error details
     */
    error: InsufficientResourcesError;
    /**
     * Callback when user confirms starting with selected services stopped
     */
    onConfirmWithStops: (selectedServiceIds: string[]) => void;
    /**
     * Callback when user chooses to override and start anyway (dangerous)
     */
    onOverrideAndStart?: () => void;
    /**
     * Service name attempting to start
     */
    serviceName: string;
    /**
     * Whether to show the "Override and Start Anyway" option
     * @default false
     */
    allowOverride?: boolean;
    /**
     * Force a specific platform variant
     */
    variant?: 'mobile' | 'desktop';
    /**
     * Additional CSS classes
     */
    className?: string;
}
//# sourceMappingURL=types.d.ts.map