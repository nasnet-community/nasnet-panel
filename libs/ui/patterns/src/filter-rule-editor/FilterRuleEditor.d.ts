/**
 * FilterRuleEditor Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <FilterRuleEditor
 *   routerId="router-1"
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSave={async (rule) => {
 *     await createFilterRule({ routerId, rule });
 *   }}
 * />
 * ```
 *
 * @module @nasnet/ui/patterns/filter-rule-editor
 * @see NAS-7.1: Implement Firewall Filter Rules
 */
import type { FilterRuleEditorProps } from './filter-rule-editor.types';
/**
 * FilterRuleEditor - Filter rule creation and editing
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Sheet with card-based form sections, 44px touch targets
 * - Tablet/Desktop (>=640px): Dialog with inline form and live preview panel
 */
export declare const FilterRuleEditor: import("react").NamedExoticComponent<FilterRuleEditorProps>;
export default FilterRuleEditor;
//# sourceMappingURL=FilterRuleEditor.d.ts.map