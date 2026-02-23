/**
 * Headless useBogonFilterDialog Hook
 *
 * Manages bogon filter selection and rule generation.
 * Provides interface selection, category toggles, and batch rule creation.
 *
 * @module @nasnet/ui/patterns/bogon-filter-dialog
 */
import { type BogonCategory, type RawRule } from '@nasnet/core/types';
export interface UseBogonFilterDialogOptions {
    /** Available interfaces for selection */
    availableInterfaces?: string[];
    /** Callback when rule generation starts */
    onGenerateStart?: () => void;
    /** Callback when rule generation completes */
    onGenerateComplete?: (ruleCount: number) => void;
}
export interface UseBogonFilterDialogReturn {
    /** Selected interface */
    selectedInterface: string;
    /** Set selected interface */
    setSelectedInterface: (iface: string) => void;
    /** Selected categories */
    selectedCategories: Set<BogonCategory>;
    /** Toggle category selection */
    toggleCategory: (category: BogonCategory) => void;
    /** Select all categories */
    selectAllCategories: () => void;
    /** Clear all categories */
    clearCategories: () => void;
    /** Is category selected */
    isCategorySelected: (category: BogonCategory) => boolean;
    /** All available categories */
    allCategories: BogonCategory[];
    /** Get category description */
    getCategoryDescription: (category: BogonCategory) => string;
    /** Get security recommendation */
    getSecurityRecommendation: (category: BogonCategory) => string;
    /** Generate RAW rules for selected categories */
    generateRules: () => Partial<RawRule>[];
    /** Total rule count that will be generated */
    ruleCount: number;
    /** Is form valid (interface + at least one category selected) */
    isValid: boolean;
    /** Show warning about private category */
    showPrivateWarning: boolean;
}
/**
 * Headless hook for bogon filter dialog logic.
 *
 * Manages interface selection, category toggles, and rule generation.
 *
 * @example
 * ```tsx
 * const dialog = useBogonFilterDialog({
 *   availableInterfaces: ['ether1-wan', 'ether2-wan'],
 *   onGenerateComplete: (count) => {
 *     console.log(`Generated ${count} rules`);
 *   }
 * });
 *
 * return (
 *   <Dialog>
 *     <Select
 *       value={dialog.selectedInterface}
 *       onChange={dialog.setSelectedInterface}
 *     />
 *     {dialog.allCategories.map((cat) => (
 *       <Checkbox
 *         checked={dialog.isCategorySelected(cat)}
 *         onChange={() => dialog.toggleCategory(cat)}
 *       />
 *     ))}
 *     <Button
 *       disabled={!dialog.isValid}
 *       onClick={() => {
 *         const rules = dialog.generateRules();
 *         // Create rules via API
 *       }}
 *     >
 *       Generate {dialog.ruleCount} Rules
 *     </Button>
 *   </Dialog>
 * );
 * ```
 */
export declare function useBogonFilterDialog(options?: UseBogonFilterDialogOptions): UseBogonFilterDialogReturn;
//# sourceMappingURL=use-bogon-filter-dialog.d.ts.map