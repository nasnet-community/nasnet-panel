/**
 * useServiceTemplateCard Hook
 *
 * Headless hook containing all business logic for ServiceTemplateCard.
 * Platform presenters consume this hook for shared state and behavior.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import type { ServiceTemplateCardProps, TemplateAction, TemplateScope, TemplateCategory } from './types';
/**
 * Return type for useServiceTemplateCard hook
 */
export interface UseServiceTemplateCardReturn {
    templateId: string;
    name: string;
    description: string;
    category: TemplateCategory;
    scope: TemplateScope;
    icon: React.ReactNode | string | undefined;
    verified: boolean;
    scopeColors: {
        bg: string;
        text: string;
        label: string;
    };
    categoryColor: string;
    serviceCount: number;
    variableCount: number;
    formattedVariableCount: string;
    author: string | undefined;
    downloads: number | undefined;
    formattedDownloads: string | undefined;
    rating: number | undefined;
    updatedAt: string | undefined;
    version: string | undefined;
    sizeEstimate: string | undefined;
    primaryAction: TemplateAction | undefined;
    secondaryActions: TemplateAction[];
    hasActions: boolean;
    showMetadata: boolean;
    hasMetadata: boolean;
    handleClick: () => void;
    handlePrimaryAction: () => void;
}
/**
 * Headless hook for ServiceTemplateCard pattern
 *
 * Contains all business logic, state management, and computed values.
 * Event handlers are memoized for stable references.
 *
 * @example
 * ```tsx
 * function ServiceTemplateCardMobile(props: ServiceTemplateCardProps) {
 *   const {
 *     name,
 *     scopeColors,
 *     primaryAction,
 *     handlePrimaryAction,
 *   } = useServiceTemplateCard(props);
 *
 *   return (
 *     <Card>
 *       <h3>{name}</h3>
 *       <Badge className={scopeColors.bg}>{scopeColors.label}</Badge>
 *       {primaryAction && (
 *         <Button onClick={handlePrimaryAction}>{primaryAction.label}</Button>
 *       )}
 *     </Card>
 *   );
 * }
 * ```
 */
export declare function useServiceTemplateCard(props: ServiceTemplateCardProps): UseServiceTemplateCardReturn;
//# sourceMappingURL=useServiceTemplateCard.d.ts.map