/**
 * Field Help Storybook Stories
 *
 * Demonstrates the FieldHelp component and its variants.
 *
 * @module @nasnet/ui/patterns/help
 * @see NAS-4A.12: Build Help System Components
 */
import { FieldHelp, HelpModeToggle, HelpIcon, HelpPopover, HelpSheet } from './index';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * FieldHelp displays contextual help for form fields with Simple/Technical mode toggle.
 *
 * **Features:**
 * - Platform-responsive: Popover on desktop, bottom sheet on mobile
 * - Simple/Technical mode toggle for different audiences
 * - i18n integration with lazy-loaded translations
 * - RTL support for Persian and Arabic
 * - WCAG AAA accessible with proper ARIA labels
 *
 * **Usage Patterns:**
 * - Place next to form labels for contextual help
 * - Use HelpModeToggle in settings to let users choose terminology level
 * - All help content comes from i18n (network:help namespace)
 *
 * @see ADR-018: Headless + Platform Presenters
 */
declare const meta: Meta<typeof FieldHelp>;
export default meta;
type Story = StoryObj<typeof FieldHelp>;
/**
 * Basic IP Address help - demonstrates default behavior.
 */
export declare const IPAddressHelp: Story;
/**
 * Gateway help with bottom placement.
 */
export declare const GatewayHelp: Story;
/**
 * Subnet/CIDR help with top placement.
 */
export declare const SubnetHelp: Story;
/**
 * Technical mode - shows advanced terminology.
 */
export declare const TechnicalMode: Story;
/**
 * Simple mode - shows user-friendly explanations.
 */
export declare const SimpleMode: Story;
/**
 * Mobile variant - shows bottom sheet instead of popover.
 */
export declare const MobileVariant: Story;
/**
 * All field types showcase - demonstrates help for various network fields.
 */
export declare const AllFieldTypes: Story;
/**
 * Help Mode Toggle - allows users to switch between Simple and Technical modes.
 */
export declare const ModeToggle: StoryObj<typeof HelpModeToggle>;
/**
 * Compact Mode Toggle - for inline use.
 */
export declare const CompactModeToggle: StoryObj<typeof HelpModeToggle>;
/**
 * Form field integration - shows how FieldHelp integrates with form fields.
 */
export declare const FormFieldIntegration: Story;
/**
 * Dark theme - demonstrates appearance in dark mode.
 */
export declare const DarkTheme: Story;
/**
 * RTL layout - demonstrates Persian/Arabic right-to-left support.
 */
export declare const RTLLayout: Story;
/**
 * Help Icon standalone - just the trigger icon.
 */
export declare const HelpIconStandalone: StoryObj<typeof HelpIcon>;
/**
 * Help Popover standalone - desktop content display.
 */
export declare const HelpPopoverStandalone: StoryObj<typeof HelpPopover>;
/**
 * Help Sheet standalone - mobile content display.
 */
export declare const HelpSheetStandalone: StoryObj<typeof HelpSheet>;
/**
 * Keyboard navigation - demonstrates keyboard accessibility.
 */
export declare const KeyboardNavigation: Story;
/**
 * Minimal content - help with no examples or link.
 */
export declare const MinimalContent: Story;
//# sourceMappingURL=field-help.stories.d.ts.map