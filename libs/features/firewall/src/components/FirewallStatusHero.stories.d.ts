/**
 * FirewallStatusHero Storybook Stories
 *
 * Interactive stories for the firewall status hero dashboard component.
 * Demonstrates the three protection statuses, loading skeleton, and stat cards.
 *
 * @module @nasnet/features/firewall
 */
import { FirewallStatusHero } from './FirewallStatusHero';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * FirewallStatusHero - Firewall overview stats grid
 *
 * A 4-card stats grid that summarises the current firewall posture at a glance.
 * Rendered at the top of the Firewall page as the primary status indicator.
 *
 * ## Cards
 *
 * | Card | Icon | Content |
 * |------|------|---------|
 * | Status | Shield (variant) | Protection level: Protected / Warning / Minimal |
 * | Total Rules | FileText | Combined count of filter + NAT rules |
 * | Active Rules | Shield | Enabled rules vs total (e.g., 14/16) |
 * | Updated | Clock | Timestamp of last data fetch + refresh button |
 *
 * ## Protection Status Logic
 *
 * | Status | Condition | Badge Color |
 * |--------|-----------|-------------|
 * | `protected` | Has filter rules AND at least one drop/reject rule | Green |
 * | `warning` | Has filter rules but NO drop/reject rules | Amber |
 * | `minimal` | Zero filter rules | Muted gray |
 *
 * ## Features
 *
 * - **Loading skeleton**: Animates while filter + NAT queries are pending
 * - **Refresh button**: Clock card contains a spin-on-fetch RefreshCw button
 * - **Responsive grid**: 2-column on mobile → 4-column on `md:` and above
 * - **Real-time data**: Fetches from `useFilterRules` + `useNATRules` hooks
 *
 * ## Usage
 *
 * ```tsx
 * import { FirewallStatusHero } from '@nasnet/features/firewall';
 *
 * <FirewallStatusHero className="mb-6" />
 * ```
 */
declare const meta: Meta<typeof FirewallStatusHero>;
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default
 *
 * Component as used in production — connects to the active router via React Query.
 * Displays live firewall statistics fetched from the router API.
 */
export declare const Default: Story;
/**
 * Protected Status
 *
 * Illustrates what the component looks like when the router has an active,
 * well-configured firewall with drop/reject rules present.
 *
 * The green ShieldCheck icon and "Protected" label are rendered by the component
 * when: filterRulesCount > 0 AND at least one enabled drop or reject rule exists.
 */
export declare const ProtectedStatus: Story;
/**
 * Warning Status
 *
 * Firewall has filter rules but none of them drop or reject traffic.
 * This is a partial configuration — traffic is being inspected but not blocked.
 */
export declare const WarningStatus: Story;
/**
 * Minimal Status
 *
 * No filter rules are configured at all. This is a freshly provisioned router
 * or one where all filter rules have been removed.
 */
export declare const MinimalStatus: Story;
/**
 * With Custom ClassName
 *
 * Demonstrates className prop for spacing and layout control within a page.
 */
export declare const WithCustomClassName: Story;
/**
 * Narrow Layout (2-column grid)
 *
 * Below the `md:` breakpoint, the grid collapses from 4 columns to 2 columns.
 * Shown here via a constrained container to simulate a narrow panel.
 */
export declare const NarrowLayout: Story;
//# sourceMappingURL=FirewallStatusHero.stories.d.ts.map