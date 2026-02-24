/**
 * AddServiceDialog - Form dialog for adding/editing custom service ports
 *
 * Provides a user-friendly form for creating and editing custom service port definitions.
 * Features:
 * - Add new custom services (port + name + protocol + description)
 * - Edit existing custom services
 * - Validation with Zod schema (CustomServicePortInputSchema)
 * - Conflict detection (built-in + custom service names)
 * - i18n support (firewall.servicePorts namespace)
 * - Form state management with React Hook Form
 *
 * @module @nasnet/features/firewall/components/AddServiceDialog
 */
import React from 'react';
import { type CustomServicePortInput } from '@nasnet/core/types';
export interface AddServiceDialogProps {
    /** Control dialog open state */
    open: boolean;
    /** Handler for dialog open state changes */
    onOpenChange: (open: boolean) => void;
    /** Service to edit (undefined = add mode, defined = edit mode) */
    editService?: CustomServicePortInput;
}
/**
 * Dialog for adding or editing custom service port definitions
 *
 * Features:
 * - Service name with conflict detection
 * - Protocol selection (TCP/UDP/Both)
 * - Port number validation (1-65535)
 * - Optional description
 * - Full form validation with Zod
 *
 * @example
 * ```tsx
 * // Add mode
 * <AddServiceDialog
 *   open={isAddDialogOpen}
 *   onOpenChange={setIsAddDialogOpen}
 * />
 *
 * // Edit mode
 * <AddServiceDialog
 *   open={isEditDialogOpen}
 *   onOpenChange={setIsEditDialogOpen}
 *   editService={{
 *     port: 9999,
 *     service: 'my-app',
 *     protocol: 'tcp',
 *     description: 'My custom application'
 *   }}
 * />
 * ```
 *
 * @param props - Component props
 * @returns Dialog component for service management
 */
export declare const AddServiceDialog: React.NamedExoticComponent<AddServiceDialogProps>;
//# sourceMappingURL=AddServiceDialog.d.ts.map