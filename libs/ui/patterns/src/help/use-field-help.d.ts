/**
 * useFieldHelp Hook
 * Headless hook for field-level contextual help
 *
 * This hook manages:
 * - Loading help content from i18n based on field key and mode
 * - Open/closed state of the help popover/sheet
 * - ARIA labels for accessibility
 * - Integration with global help mode store
 *
 * @see NAS-4A.12: Build Help System Components
 * @see ADR-018: Headless Platform Presenters
 */
import type { FieldHelpConfig, UseFieldHelpReturn } from './help.types';
/**
 * Hook for managing field-level contextual help
 *
 * Provides all logic needed by both mobile and desktop presenters:
 * - Content loading from i18n with Simple/Technical mode support
 * - Open/closed state management
 * - ARIA labels for accessibility
 *
 * @param config - Configuration for the field help
 * @returns Help state and control functions
 *
 * @example
 * ```tsx
 * function FieldHelpDesktop({ field, placement }: FieldHelpProps) {
 *   const helpState = useFieldHelp({ field, placement });
 *   const { content, isOpen, setIsOpen, ariaLabel } = helpState;
 *
 *   return (
 *     <Popover open={isOpen} onOpenChange={setIsOpen}>
 *       <PopoverTrigger aria-label={ariaLabel}>
 *         <HelpCircle />
 *       </PopoverTrigger>
 *       <PopoverContent>
 *         <h4>{content.title}</h4>
 *         <p>{content.description}</p>
 *       </PopoverContent>
 *     </Popover>
 *   );
 * }
 * ```
 */
export declare function useFieldHelp(config: FieldHelpConfig): UseFieldHelpReturn;
//# sourceMappingURL=use-field-help.d.ts.map