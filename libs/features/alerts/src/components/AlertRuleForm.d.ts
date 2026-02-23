import { type AlertRuleFormData } from '../schemas/alert-rule.schema';
/**
 * @interface AlertRuleFormProps
 * @description Props for AlertRuleForm component
 */
interface AlertRuleFormProps {
    /** Initial form data (for editing existing rules) */
    initialData?: Partial<AlertRuleFormData>;
    /** Rule ID (if editing existing rule) */
    ruleId?: string;
    /** Callback on successful save */
    onSuccess?: () => void;
    /** Callback on cancel */
    onCancel?: () => void;
    /** Optional CSS className for custom styling */
    className?: string;
}
/**
 * Form for creating and editing alert rules with conditions, severity, and channels.
 * Supports both new rule creation and editing existing rules. Auto-disables submit
 * when no changes detected. Shows loading state during save operations.
 *
 * @component
 * @example
 * return <AlertRuleForm ruleId="rule-1" onSuccess={handleSuccess} />;
 */
declare const AlertRuleForm: import("react").NamedExoticComponent<AlertRuleFormProps>;
export { AlertRuleForm };
export type { AlertRuleFormProps };
//# sourceMappingURL=AlertRuleForm.d.ts.map