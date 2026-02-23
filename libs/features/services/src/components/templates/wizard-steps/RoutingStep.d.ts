/**
 * RoutingStep Component
 *
 * Fourth step of template installation wizard.
 * Optional routing rule suggestions that can be applied after installation.
 */
import React from 'react';
import type { ServiceTemplate } from '@nasnet/api-client/generated';
/**
 * Props for RoutingStep
 */
export interface RoutingStepProps {
    /** Template with routing suggestions */
    template: ServiceTemplate;
    /** Currently selected routing rule IDs */
    selectedRuleIds: string[];
    /** Callback when rule selection changes */
    onToggleRule: (ruleId: string) => void;
    /** Optional CSS class name for the container */
    className?: string;
}
/**
 * RoutingStep - Optional routing rule suggestions
 *
 * Features:
 * - Display suggested routing rules from template
 * - Checkbox selection for each rule
 * - Preview of what will be applied
 * - Skip or apply selected rules
 *
 * @example
 * ```tsx
 * <RoutingStep
 *   template={template}
 *   selectedRuleIds={selected}
 *   onToggleRule={handleToggle}
 * />
 * ```
 */
export declare const RoutingStep: React.NamedExoticComponent<RoutingStepProps>;
//# sourceMappingURL=RoutingStep.d.ts.map