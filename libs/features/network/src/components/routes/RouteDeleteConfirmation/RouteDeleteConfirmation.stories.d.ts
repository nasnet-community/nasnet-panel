/**
 * RouteDeleteConfirmation Storybook Stories
 * NAS-6.5: Task 9.8 - Static Route Management
 *
 * Demonstrates the RouteDeleteConfirmation component with safety confirmation
 * patterns for deleting routes (CRITICAL for default route, STANDARD for others).
 */
import { RouteDeleteConfirmation } from './RouteDeleteConfirmation';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * Storybook Meta Configuration
 */
declare const meta: Meta<typeof RouteDeleteConfirmation>;
export default meta;
type Story = StoryObj<typeof RouteDeleteConfirmation>;
/**
 * CRITICAL operation: Deleting default route (0.0.0.0/0).
 * Shows 10-second countdown with red warning styling.
 * User must type "DELETE DEFAULT ROUTE" exactly.
 */
export declare const DefaultRoute: Story;
/**
 * STANDARD operation: Deleting non-critical route.
 * Shows 5-second countdown with amber warning styling.
 * User must type destination CIDR (e.g., "10.10.0.0/24").
 */
export declare const StandardRoute: Story;
/**
 * Route with custom routing mark and table.
 * Demonstrates deletion of policy routing configuration.
 */
export declare const AdvancedRoute: Story;
/**
 * Deleting an inactive/disabled route.
 * Lower impact but still requires confirmation.
 */
export declare const InactiveRoute: Story;
/**
 * Mobile viewport variant using Sheet instead of Dialog.
 * Full-width buttons and optimized spacing for touch interaction.
 */
export declare const MobileView: Story;
/**
 * Desktop viewport variant using centered Dialog.
 * Centered modal with max-width 500px and horizontal button layout.
 */
export declare const DesktopView: Story;
/**
 * Dark theme variant to verify styling in dark mode.
 * Ensures color contrast and readability with dark backgrounds.
 */
export declare const DarkMode: Story;
/**
 * Demonstration of loading state during deletion.
 * Shows spinner in confirm button with all inputs disabled.
 */
export declare const Submitting: Story;
/**
 * Controlled story with all props exposed in Storybook controls.
 * Allows customization of route properties and behavior.
 */
export declare const Playground: Story;
//# sourceMappingURL=RouteDeleteConfirmation.stories.d.ts.map