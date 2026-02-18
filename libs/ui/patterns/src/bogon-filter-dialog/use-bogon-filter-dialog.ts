/**
 * Headless useBogonFilterDialog Hook
 *
 * Manages bogon filter selection and rule generation.
 * Provides interface selection, category toggles, and batch rule creation.
 *
 * @module @nasnet/ui/patterns/bogon-filter-dialog
 */

import { useState, useCallback, useMemo } from 'react';

import {
  BOGON_RANGES,
  getBogonCategoryDescription,
  getBogonSecurityRec,
  type BogonCategory,
  type RawRule,
} from '@nasnet/core/types';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Hook Implementation
// ============================================================================

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
export function useBogonFilterDialog(
  options: UseBogonFilterDialogOptions = {}
): UseBogonFilterDialogReturn {
  const { availableInterfaces = [], onGenerateStart, onGenerateComplete } = options;

  // ========================================
  // State
  // ========================================

  const [selectedInterface, setSelectedInterface] = useState<string>(
    availableInterfaces[0] || ''
  );

  const [selectedCategories, setSelectedCategories] = useState<Set<BogonCategory>>(
    new Set<BogonCategory>([
      'loopback',
      'reserved',
      'linkLocal',
      'multicast',
      'futureUse',
      // NOTE: 'private' is NOT selected by default (can break LAN access)
    ])
  );

  // ========================================
  // Category Management
  // ========================================

  const allCategories = useMemo<BogonCategory[]>(() => {
    return Object.keys(BOGON_RANGES) as BogonCategory[];
  }, []);

  const toggleCategory = useCallback((category: BogonCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const selectAllCategories = useCallback(() => {
    setSelectedCategories(new Set(allCategories));
  }, [allCategories]);

  const clearCategories = useCallback(() => {
    setSelectedCategories(new Set());
  }, []);

  const isCategorySelected = useCallback(
    (category: BogonCategory) => {
      return selectedCategories.has(category);
    },
    [selectedCategories]
  );

  const getCategoryDescription = useCallback((category: BogonCategory) => {
    return getBogonCategoryDescription(category);
  }, []);

  const getSecurityRecommendation = useCallback((category: BogonCategory) => {
    return getBogonSecurityRec(category);
  }, []);

  // ========================================
  // Rule Generation
  // ========================================

  const generateRules = useCallback((): Partial<RawRule>[] => {
    const rules: Partial<RawRule>[] = [];

    // Generate one rule per IP range in selected categories
    selectedCategories.forEach((category) => {
      const ranges = BOGON_RANGES[category];

      ranges.forEach((range) => {
        rules.push({
          chain: 'prerouting',
          action: 'drop',
          srcAddress: range,
          inInterface: selectedInterface,
          comment: `Drop ${category} bogon: ${range}`,
          disabled: false,
        });
      });
    });

    onGenerateStart?.();
    // Caller will handle actual API calls
    // onGenerateComplete will be called by caller after batch creation

    return rules;
  }, [selectedInterface, selectedCategories, onGenerateStart]);

  const ruleCount = useMemo(() => {
    let count = 0;
    selectedCategories.forEach((category) => {
      count += BOGON_RANGES[category].length;
    });
    return count;
  }, [selectedCategories]);

  // ========================================
  // Validation
  // ========================================

  const isValid = useMemo(() => {
    return selectedInterface !== '' && selectedCategories.size > 0;
  }, [selectedInterface, selectedCategories]);

  const showPrivateWarning = useMemo(() => {
    return selectedCategories.has('private');
  }, [selectedCategories]);

  // ========================================
  // Return
  // ========================================

  return {
    selectedInterface,
    setSelectedInterface,
    selectedCategories,
    toggleCategory,
    selectAllCategories,
    clearCategories,
    isCategorySelected,
    allCategories,
    getCategoryDescription,
    getSecurityRecommendation,
    generateRules,
    ruleCount,
    isValid,
    showPrivateWarning,
  };
}
