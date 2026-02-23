/**
 * FirewallLogFilters - Responsive Pattern Component
 *
 * Filter controls for firewall log viewer with platform-specific layouts.
 * Auto-detects platform and renders appropriate presenter.
 *
 * @module @nasnet/ui/patterns/firewall-log-filters
 */
import type { FirewallLogFiltersProps } from './firewall-log-filters.types';
/**
 * Responsive firewall log filters component.
 *
 * Automatically renders the appropriate presenter based on viewport:
 * - Desktop: Sidebar layout with inline filters
 * - Mobile: Bottom sheet with card-based sections
 *
 * @example
 * ```tsx
 * const [filters, setFilters] = useState<FirewallLogFilterState>({
 *   timeRangePreset: '1h',
 *   actions: [],
 * });
 *
 * return (
 *   <FirewallLogFilters
 *     filters={filters}
 *     onFiltersChange={setFilters}
 *     availablePrefixes={['DROPPED-', 'ACCEPTED-']}
 *   />
 * );
 * ```
 */
export declare const FirewallLogFilters: import("react").NamedExoticComponent<FirewallLogFiltersProps>;
//# sourceMappingURL=FirewallLogFilters.d.ts.map