/**
 * PPPoE Client Configuration Wizard
 *
 * Multi-step wizard for configuring PPPoE WAN connection (5 steps):
 * 1. Interface selection
 * 2. Credentials (username/password)
 * 3. Advanced options (MTU, MRU, DNS, routing)
 * 4. Preview (RouterOS commands)
 * 5. Apply & Confirm
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */
/**
 * PPPoE Wizard Props
 * @description Configuration options for the PPPoE wizard component
 */
export interface PppoeWizardProps {
    /** Router ID for configuration */
    routerId: string;
    /** Callback when wizard is completed successfully */
    onComplete?: (result: any) => void;
    /** Callback when wizard is cancelled */
    onCancel?: () => void;
    /** Optional CSS class name */
    className?: string;
}
/**
 * PPPoE Configuration Wizard
 *
 * Guides user through PPPoE WAN setup with safety checks and preview.
 *
 * Features:
 * - 5-step guided flow with progress tracking
 * - Interface selection with filtering
 * - Secure password input (never logged/cached)
 * - MTU/MRU presets for common scenarios
 * - RouterOS command preview before apply
 * - Safety confirmation for default route changes
 * - Error handling and rollback support
 *
 * @example
 * ```tsx
 * <PppoeWizard
 *   routerId="router-123"
 *   onComplete={(result) => console.log('Configured!', result)}
 *   onCancel={() => console.log('Cancelled')}
 * />
 * ```
 */
export declare const PppoeWizard: import("react").NamedExoticComponent<PppoeWizardProps>;
//# sourceMappingURL=PppoeWizard.d.ts.map