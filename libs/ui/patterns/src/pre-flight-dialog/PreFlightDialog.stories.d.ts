/**
 * PreFlightDialog Storybook Stories
 *
 * Comprehensive stories demonstrating all PreFlightDialog states and scenarios.
 */
import { PreFlightDialog } from './PreFlightDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof PreFlightDialog>;
export default meta;
type Story = StoryObj<typeof PreFlightDialog>;
/**
 * Slightly Over Budget
 * One service (Tor) is auto-selected and sufficient
 */
export declare const SlightlyOver: Story;
/**
 * Way Over Budget
 * Multiple services need to be stopped
 */
export declare const WayOver: Story;
/**
 * With Many Suggestions
 * Shows scrollable list of services
 */
export declare const ManySuggestions: Story;
/**
 * With Override Option
 * Allows user to bypass resource check (dangerous)
 */
export declare const WithOverride: Story;
/**
 * Mobile Variant
 * Forces mobile presentation (bottom sheet)
 */
export declare const MobileVariant: Story;
/**
 * Desktop Variant
 * Forces desktop presentation (center modal)
 */
export declare const DesktopVariant: Story;
/**
 * Controlled Example
 * Shows programmatic control of dialog state
 */
export declare const Controlled: Story;
//# sourceMappingURL=PreFlightDialog.stories.d.ts.map