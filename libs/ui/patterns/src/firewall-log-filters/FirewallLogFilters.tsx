/**
 * FirewallLogFilters - Responsive Pattern Component
 *
 * Filter controls for firewall log viewer with platform-specific layouts.
 * Auto-detects platform and renders appropriate presenter.
 *
 * @module @nasnet/ui/patterns/firewall-log-filters
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { FirewallLogFiltersDesktop } from './FirewallLogFiltersDesktop';
import { FirewallLogFiltersMobile } from './FirewallLogFiltersMobile';

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
export const FirewallLogFilters = memo(function FirewallLogFilters(
  props: FirewallLogFiltersProps
) {
  const platform = usePlatform();

  return platform === 'mobile' ? (
    <FirewallLogFiltersMobile {...props} />
  ) : (
    <FirewallLogFiltersDesktop {...props} />
  );
});

FirewallLogFilters.displayName = 'FirewallLogFilters';
