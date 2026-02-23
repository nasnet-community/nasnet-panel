/**
 * SafetyConfirmation Storybook Stories
 *
 * Interactive stories demonstrating the SafetyConfirmation component
 * in various scenarios and configurations.
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 */
import { SafetyConfirmation } from './safety-confirmation';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * # SafetyConfirmation
 *
 * Multi-step confirmation dialog for dangerous/irreversible operations.
 *
 * ## Features
 * - **Type-to-confirm**: User must type exact text to enable confirmation
 * - **Countdown timer**: Forced delay before confirming (default 10 seconds)
 * - **Urgency levels**: Visual feedback changes as countdown progresses
 * - **Platform adaptive**: Desktop uses Dialog, Mobile uses Sheet
 * - **Accessible**: Full keyboard navigation, screen reader support
 *
 * ## Use Cases
 * - Factory reset
 * - Firmware update
 * - Delete interface
 * - Clear firewall rules
 * - Disable VPN
 * - Delete certificates
 * - Restore backup
 *
 * ## Integration
 * Integrates with the configPipelineMachine for the Apply-Confirm-Merge pattern.
 * Use `useDangerousOperationConfirmation` hook for state machine integration.
 */
declare const meta: Meta<typeof SafetyConfirmation>;
export default meta;
type Story = StoryObj<typeof SafetyConfirmation>;
/**
 * Default factory reset scenario with 10 second countdown.
 * User must type "RESET" to confirm.
 */
export declare const Default: Story;
/**
 * Firmware update with longer countdown (15 seconds).
 * User must type "UPDATE" to confirm.
 */
export declare const FirmwareUpdate: Story;
/**
 * Quick delete with shorter countdown (5 seconds).
 * User must type the interface name to confirm.
 */
export declare const QuickDelete: Story;
/**
 * Mobile variant using Sheet instead of Dialog.
 * Force the mobile presenter regardless of viewport.
 */
export declare const MobileVariant: Story;
/**
 * Desktop variant using centered Dialog.
 * Force the desktop presenter regardless of viewport.
 */
export declare const DesktopVariant: Story;
/**
 * Dark theme variant to verify styling in dark mode.
 */
export declare const DarkTheme: Story;
/**
 * Restore backup scenario with standard countdown.
 */
export declare const RestoreBackup: Story;
/**
 * Case-insensitive validation.
 * User can type "reset", "RESET", or "Reset" to confirm.
 */
export declare const CaseInsensitive: Story;
/**
 * Many consequences - demonstrates scrollable list.
 */
export declare const ManyConsequences: Story;
/**
 * Controlled story with all props exposed in Storybook controls.
 */
export declare const Playground: Story;
//# sourceMappingURL=safety-confirmation.stories.d.ts.map