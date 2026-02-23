/**
 * SubnetCalculations Component
 * Displays calculated subnet information (network, broadcast, range, hosts, mask)
 *
 * Uses semantic design tokens for styling as per NasNetConnect design system.
 *
 * @example
 * ```tsx
 * <SubnetCalculations
 *   info={{
 *     network: '192.168.1.0',
 *     broadcast: '192.168.1.255',
 *     firstHost: '192.168.1.1',
 *     lastHost: '192.168.1.254',
 *     hostCount: 254,
 *     prefix: 24,
 *     mask: '255.255.255.0',
 *   }}
 * />
 * ```
 */
import type { SubnetCalculationsProps } from './subnet-input.types';
/**
 * SubnetCalculations Component
 *
 * Displays a panel of calculated subnet information with optional
 * collapse functionality for mobile views.
 */
export declare function SubnetCalculations({ info, collapsed, onToggleCollapse, className, }: SubnetCalculationsProps): import("react/jsx-runtime").JSX.Element;
export declare namespace SubnetCalculations {
    var displayName: string;
}
//# sourceMappingURL=subnet-calculations.d.ts.map