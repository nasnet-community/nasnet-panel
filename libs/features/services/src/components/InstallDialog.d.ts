/**
 * InstallDialog Component
 *
 * Multi-step dialog for installing new service instances.
 * Step 1: Select service from marketplace
 * Step 2: Configure instance (name, VLAN, bind IP, ports)
 * Step 3: Installing with real-time progress
 * Step 4: Complete with success message
 *
 * Features:
 * - Marketplace service selection with descriptions
 * - Real-time installation progress via subscription
 * - Configuration validation
 * - Auto-rollback on errors
 * - Accessibility: keyboard navigation, ARIA labels, role attributes
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * return (
 *   <>
 *     <Button onClick={() => setOpen(true)}>Install Service</Button>
 *     <InstallDialog
 *       open={open}
 *       onClose={() => setOpen(false)}
 *       routerId={routerId}
 *       onSuccess={() => refetchServices()}
 *     />
 *   </>
 * );
 * ```
 *
 * @see docs/design/ux-design/6-component-library.md#multi-step-wizard
 */
import * as React from 'react';
/**
 * InstallDialog props
 */
export interface InstallDialogProps {
    /** Whether dialog is open */
    open: boolean;
    /** Callback when dialog should close */
    onClose: () => void;
    /** Router ID for installation context */
    routerId: string;
    /** Optional success callback after installation completes */
    onSuccess?: () => void;
    /** Optional CSS class name */
    className?: string;
}
/**
 * InstallDialog component - Multi-step wizard for service installation
 */
declare function InstallDialogComponent({ open, onClose, routerId, onSuccess, className, }: InstallDialogProps): import("react/jsx-runtime").JSX.Element;
export declare const InstallDialog: React.MemoExoticComponent<typeof InstallDialogComponent>;
export {};
//# sourceMappingURL=InstallDialog.d.ts.map