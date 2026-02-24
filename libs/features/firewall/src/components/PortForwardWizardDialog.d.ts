/**
 * Port Forward Wizard Dialog
 *
 * 3-step wizard for creating port forwarding rules with SafetyConfirmation.
 * Simplifies the process of configuring destination NAT for incoming traffic.
 *
 * Steps:
 * 1. External Settings - Protocol, external port, WAN interface
 * 2. Internal Settings - Internal IP, internal port
 * 3. Review & Confirm - Summary with SafetyConfirmation
 *
 * @see NAS-7-2: Implement NAT Configuration
 * @see libs/core/types/src/firewall/nat-rule.types.ts - PortForwardSchema
 */
import React from 'react';
interface PortForwardWizardDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback to change the open state */
    onOpenChange: (open: boolean) => void;
    /** Router IP address */
    routerIp: string;
    /** Available WAN interfaces for selection */
    wanInterfaces?: string[];
    /** Callback when port forward is successfully created */
    onSuccess?: () => void;
    /** Optional CSS class for styling */
    className?: string;
}
/**
 * PortForwardWizardDialog Component
 *
 * @description 3-step wizard for creating port forwarding rules with
 * SafetyConfirmation integration for dangerous operations.
 *
 * @example
 * ```tsx
 * <PortForwardWizardDialog
 *   open={dialogOpen}
 *   onOpenChange={setDialogOpen}
 *   routerIp="192.168.1.1"
 *   onSuccess={handleSuccess}
 * />
 * ```
 */
export declare const PortForwardWizardDialog: React.NamedExoticComponent<PortForwardWizardDialogProps>;
export {};
//# sourceMappingURL=PortForwardWizardDialog.d.ts.map