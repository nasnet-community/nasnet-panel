/**
 * Storybook stories for PingTool
 *
 * Demonstrates all states and variants of the Ping Diagnostic Tool.
 */
import { PingTool } from './PingTool';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof PingTool>;
export default meta;
type Story = StoryObj<typeof PingTool>;
/**
 * Idle State - Ready to Start
 *
 * Initial state with empty form waiting for user input.
 */
export declare const Idle: Story;
/**
 * Desktop Layout
 *
 * Full desktop layout with side-by-side form and results.
 * Shows all advanced options and results in a grid layout.
 */
export declare const Desktop: Story;
/**
 * Mobile Layout
 *
 * Compact mobile layout with stacked form and bottom sheet for results.
 * Only shows essential fields (target, count, timeout).
 */
export declare const Mobile: Story;
/**
 * With Callbacks
 *
 * Demonstrates onComplete and onError callbacks.
 */
export declare const WithCallbacks: Story;
/**
 * Form Validation
 *
 * Shows form validation errors for invalid inputs.
 */
export declare const FormValidation: Story;
/**
 * IPv6 Target
 *
 * Example with IPv6 target address.
 */
export declare const IPv6Target: Story;
/**
 * Hostname Target
 *
 * Example with hostname instead of IP address.
 */
export declare const HostnameTarget: Story;
/**
 * Custom Settings
 *
 * Example with custom count, size, and timeout values.
 */
export declare const CustomSettings: Story;
/**
 * Accessibility Features
 *
 * Demonstrates WCAG AAA accessibility features.
 */
export declare const Accessibility: Story;
/**
 * Dark Mode
 *
 * Component in dark mode theme.
 */
export declare const DarkMode: Story;
/**
 * Interactive Demo
 *
 * Fully interactive demo with mocked GraphQL responses.
 * Click "Start Ping" to see simulated results.
 */
export declare const InteractiveDemo: Story;
//# sourceMappingURL=PingTool.stories.d.ts.map