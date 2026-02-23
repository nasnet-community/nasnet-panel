/**
 * PasswordField Component
 * Displays a password with masking, show/hide toggle, and copy functionality
 * Implements FR0-16: View security profile settings with password reveal
 */
import * as React from 'react';
export interface PasswordFieldProps {
    /** The password value to display */
    password: string;
    /** Optional label for the field */
    label?: string;
    /** Optional CSS className */
    className?: string;
}
/**
 * Password Field Component
 * - Displays password masked by default
 * - Provides show/hide toggle with keyboard support
 * - Provides copy-to-clipboard functionality
 * - Shows visual feedback on successful copy
 *
 * @description Sensitive field component with password masking and reveal toggle
 */
declare function PasswordFieldComponent({ password, label, className, }: PasswordFieldProps): import("react/jsx-runtime").JSX.Element;
export declare const PasswordField: React.MemoExoticComponent<typeof PasswordFieldComponent>;
export {};
//# sourceMappingURL=PasswordField.d.ts.map