/**
 * Storybook stories for TracerouteTool
 *
 * Demonstrates all states and variants of the Traceroute Diagnostic Tool.
 *
 * Story NAS-5.8: Traceroute Diagnostic Tool
 * 7 comprehensive stories covering all use cases and states.
 */
import { TracerouteTool } from './TracerouteTool';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof TracerouteTool>;
export default meta;
type Story = StoryObj<typeof TracerouteTool>;
/**
 * 1. Idle State - Ready to Start
 *
 * Initial state with empty form waiting for user input.
 * Shows the form with default values and no results.
 */
export declare const Idle: Story;
/**
 * 2. Desktop Layout
 *
 * Full desktop layout with side-by-side form and real-time hop results.
 * Shows all advanced options and hop visualization with latency color-coding.
 */
export declare const Desktop: Story;
/**
 * 3. Mobile Layout
 *
 * Compact mobile layout with stacked form and bottom sheet for advanced options.
 * Optimized for touch interactions with 44px minimum touch targets.
 */
export declare const Mobile: Story;
/**
 * 4. With Callbacks
 *
 * Demonstrates all callback handlers: onComplete, onError, onCancelled, onHopDiscovered.
 * Callbacks fire on events and can be used for analytics or custom behavior.
 */
export declare const WithCallbacks: Story;
/**
 * 5. Form Validation
 *
 * Shows form validation errors for invalid inputs.
 * All fields have Zod validation with clear error messages.
 */
export declare const FormValidation: Story;
/**
 * 6. Accessibility Features
 *
 * Demonstrates WCAG AAA accessibility features.
 * Fully keyboard navigable with screen reader support.
 */
export declare const Accessibility: Story;
/**
 * 7. Interactive Demo with Mocked Real-Time Hops
 *
 * Fully interactive demo with mocked GraphQL responses and WebSocket subscription.
 * Simulates progressive hop discovery with realistic latencies.
 */
export declare const InteractiveDemo: Story;
/**
 * Protocol Variants
 *
 * Example showing different protocol options (ICMP, UDP, TCP).
 */
export declare const ProtocolVariants: Story;
/**
 * Dark Mode
 *
 * Component in dark mode theme with proper color contrast.
 */
export declare const DarkMode: Story;
//# sourceMappingURL=TracerouteTool.stories.d.ts.map