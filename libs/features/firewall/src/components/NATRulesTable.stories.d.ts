/**
 * NATRulesTable Storybook Stories
 *
 * Interactive stories for the NAT rules table component.
 * Demonstrates action badge variants, chain filtering, sorting, and row actions.
 *
 * @module @nasnet/features/firewall
 */
import { NATRulesTable } from './NATRulesTable';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * NATRulesTable - NAT rules management table
 *
 * Displays all NAT rules from the MikroTik router in a sortable data table.
 * Supports srcnat (outgoing masquerade / src-nat) and dstnat (port forwarding / redirect) chains.
 *
 * ## Action Badge Variants
 *
 * | Action | Badge | Typical Use |
 * |--------|-------|-------------|
 * | `masquerade` | Blue (info) | Internet sharing, hide LAN behind WAN IP |
 * | `dst-nat` | Secondary | Port forwarding — redirect inbound traffic to internal host |
 * | `src-nat` | Default | Manual SNAT — explicit source address translation |
 * | `redirect` | Yellow (warning) | Transparent proxy — redirect locally |
 *
 * ## Columns
 *
 * `#` · Chain · Action · Protocol · Src Address · Dst Address · To Addresses · To Ports · Comment · Actions
 *
 * ## Features
 *
 * - **Sortable columns**: Click any column header to sort ascending/descending
 * - **Row actions**: Edit (triggers `onEditRule`), Toggle enable/disable, Delete with `SafetyConfirmation`
 * - **Disabled rules**: Rendered with `opacity-50` and strikethrough text
 * - **Chain filter**: Optional `chain` prop scopes to `srcnat` or `dstnat`
 * - **SafetyConfirmation**: 3-second countdown before destructive delete
 *
 * ## Usage
 *
 * ```tsx
 * import { NATRulesTable } from '@nasnet/features/firewall';
 *
 * <NATRulesTable
 *   chain="dstnat"
 *   onEditRule={(rule) => setEditingRule(rule)}
 * />
 * ```
 */
declare const meta: Meta<typeof NATRulesTable>;
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default (All Chains)
 *
 * Shows all NAT rules across srcnat and dstnat chains.
 * In a live environment this connects to the router API.
 */
export declare const Default: Story;
/**
 * Srcnat Chain (Masquerade / Internet Sharing)
 *
 * Typical srcnat chain contains masquerade rules for internet sharing.
 * These rules translate the source address of outgoing packets.
 */
export declare const SrcnatChain: Story;
/**
 * Dstnat Chain (Port Forwarding)
 *
 * The dstnat chain typically holds port forwarding rules (dst-nat)
 * and transparent proxy redirects.
 */
export declare const DstnatChain: Story;
/**
 * With Edit Rule Callback
 *
 * Demonstrates the onEditRule callback interaction.
 * Click the "Edit" action on any row to fire the callback (visible in Actions panel).
 */
export declare const WithEditCallback: Story;
/**
 * All Chain
 *
 * Explicitly passing chain="all" behaves identically to the default
 * (no chain filtering) — shows all NAT rules.
 */
export declare const AllChain: Story;
/**
 * Mobile Viewport
 *
 * NATRulesTable renders the desktop table on all viewports.
 * On very small screens, the table scrolls horizontally.
 * The mobile-specific layout lives in NATRulesTableMobile.
 */
export declare const MobileViewport: Story;
//# sourceMappingURL=NATRulesTable.stories.d.ts.map