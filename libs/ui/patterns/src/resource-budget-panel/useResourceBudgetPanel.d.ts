/**
 * ResourceBudgetPanel Headless Hook
 *
 * Provides all logic and state for resource budget display and management.
 * Follows the Headless + Platform Presenter pattern.
 *
 * Responsibilities:
 * - Sort instance data by various columns
 * - Calculate usage percentages and status
 * - Filter instances (running only, etc.)
 * - Aggregate system totals
 * - Provide formatted values for display
 */
import type { ResourceBudgetPanelProps, EnhancedServiceInstanceResource, SortColumn, SortDirection } from './types';
import type { UsageStatus } from '../resource-usage-bar';
/**
 * State returned by useResourceBudgetPanel hook
 */
export interface UseResourceBudgetPanelReturn {
    /**
     * Enhanced and sorted instances
     */
    instances: EnhancedServiceInstanceResource[];
    /**
     * System totals
     */
    systemTotals: ResourceBudgetPanelProps['systemTotals'];
    /**
     * Current sort column
     */
    sortColumn: SortColumn;
    /**
     * Current sort direction
     */
    sortDirection: SortDirection;
    /**
     * Toggle sort column (or change direction if same column)
     */
    toggleSort: (column: SortColumn) => void;
    /**
     * Total number of instances (after filtering)
     */
    totalInstances: number;
    /**
     * System-wide usage percentage
     */
    systemUsagePercent: number;
    /**
     * System-wide usage status
     */
    systemUsageStatus: UsageStatus;
    /**
     * Formatted system total memory used
     */
    systemTotalUsedText: string;
    /**
     * Formatted system total memory available
     */
    systemTotalAvailableText: string;
    /**
     * Formatted system usage percent
     */
    systemUsagePercentText: string;
    /**
     * Whether there are any instances
     */
    hasInstances: boolean;
    /**
     * Whether data is loading
     */
    isLoading: boolean;
    /**
     * Empty state message
     */
    emptyMessage: string;
}
/**
 * Headless hook for resource budget panel state.
 *
 * Provides all the logic and derived state needed by presenters.
 * Does not render anything - that's the presenter's job.
 *
 * @example
 * ```tsx
 * function ResourceBudgetPanelDesktop(props: ResourceBudgetPanelProps) {
 *   const state = useResourceBudgetPanel(props);
 *
 *   return (
 *     <table>
 *       <thead>
 *         <tr>
 *           <th onClick={() => state.toggleSort('name')}>Name</th>
 *           <th onClick={() => state.toggleSort('memoryUsed')}>Memory Used</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         {state.instances.map(instance => (
 *           <tr key={instance.id}>
 *             <td>{instance.name}</td>
 *             <td>{instance.memoryUsed} MB</td>
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *   );
 * }
 * ```
 */
export declare function useResourceBudgetPanel(props: ResourceBudgetPanelProps): UseResourceBudgetPanelReturn;
//# sourceMappingURL=useResourceBudgetPanel.d.ts.map