export interface InterfaceEditFormProps {
    /** Router ID for API requests */
    routerId: string;
    /** Interface data object to edit */
    interface: any;
    /** Callback fired on successful save */
    onSuccess?: () => void;
    /** Callback fired when user cancels editing */
    onCancel?: () => void;
}
/**
 * Interface Edit Form Component.
 *
 * Form for editing interface settings (enabled, MTU, comment) with client-side and
 * server-side validation. Supports editing a single interface with toast feedback.
 *
 * @description Editable form for interface configuration with validation and error handling
 */
export declare const InterfaceEditForm: import("react").NamedExoticComponent<InterfaceEditFormProps>;
//# sourceMappingURL=InterfaceEditForm.d.ts.map