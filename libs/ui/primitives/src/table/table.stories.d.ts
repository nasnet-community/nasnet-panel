import { Table } from './table';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof Table>;
/**
 * Default table with typical invoice data showing header, body, and caption.
 * Demonstrates semantic HTML structure with proper accessibility annotations.
 */
export declare const Default: Story;
/**
 * Table with footer section for totals or summary information.
 * Demonstrates use of TableFooter component for summary rows.
 */
export declare const WithFooter: Story;
/**
 * Domain-specific example showing firewall rules with semantic status colors.
 * Demonstrates technical data presentation with monospace fonts for IP addresses.
 * Colors paired with text labels for color-blind accessibility.
 */
export declare const FirewallRulesExample: Story;
/**
 * Empty state showing table with no data.
 * Demonstrates handling of filtered-to-empty or no-records scenarios.
 */
export declare const Empty: Story;
/**
 * Table with striped rows for improved visual readability across long rows.
 * Demonstrates alternating row background colors using semantic muted tokens.
 */
export declare const Striped: Story;
/**
 * Mobile viewport (375px) showing reduced columns with scrollable overflow.
 * Demonstrates responsive table design for small screens - only essential columns shown.
 */
export declare const Mobile: Story;
/**
 * Tablet viewport (768px) showing balanced column density.
 * Demonstrates responsive table with moderate information density for medium screens.
 */
export declare const Tablet: Story;
/**
 * Desktop viewport (1280px) showing full density table with all columns visible.
 * Demonstrates high information density for power users on large screens.
 * All details visible without horizontal scrolling or column hiding.
 */
export declare const DesktopFull: Story;
//# sourceMappingURL=table.stories.d.ts.map