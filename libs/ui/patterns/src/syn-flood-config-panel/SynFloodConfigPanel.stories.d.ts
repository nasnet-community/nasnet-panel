/**
 * SynFloodConfigPanel Storybook Stories
 *
 * Interactive stories for SYN flood protection configuration panel.
 * Demonstrates presets, actions, and platform variants.
 *
 * @module @nasnet/ui/patterns/syn-flood-config-panel
 * @see NAS-7.11: Implement Connection Rate Limiting
 */
import type { StoryObj } from '@storybook/react';
/**
 * SynFloodConfigPanel - SYN flood protection configuration
 *
 * The SynFloodConfigPanel component provides an intuitive interface for configuring
 * SYN flood protection on MikroTik routers. It includes preset configurations and
 * automatically adapts to platform (mobile/tablet/desktop).
 *
 * ## Features
 *
 * - **Preset configurations**: Quick setup for common scenarios (Normal, Strict, Paranoid)
 * - **Action types**: Drop or Tarpit excess SYN packets
 * - **Live validation**: Real-time feedback for invalid limits
 * - **Burst handling**: Configure burst allowance for legitimate traffic spikes
 * - **Toggle protection**: Easy enable/disable without losing configuration
 * - **Platform adaptive**: Desktop card vs mobile panel
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Protection Actions
 *
 * - **Drop**: Immediately drops excess SYN packets (faster, more aggressive)
 * - **Tarpit**: Delays responses to slow down attackers (subtler, uses more CPU)
 *
 * ## Presets
 *
 * - **Normal**: 100 SYN/sec, burst 5 - Balanced protection for most scenarios
 * - **Strict**: 50 SYN/sec, burst 5 - Aggressive protection for high-risk environments
 * - **Paranoid**: 25 SYN/sec, burst 3 - Maximum protection, may block legitimate spikes
 *
 * ## Usage
 *
 * ```tsx
 * import { SynFloodConfigPanel } from '@nasnet/ui/patterns/syn-flood-config-panel';
 *
 * function MyComponent() {
 *   const { data: config, isLoading } = useSynFloodConfig(routerId);
 *
 *   return (
 *     <SynFloodConfigPanel
 *       config={config}
 *       loading={isLoading}
 *       onUpdate={async (newConfig) => {
 *         await updateSynFloodConfig({ routerId, config: newConfig });
 *       }}
 *     />
 *   );
 * }
 * ```
 */
declare const meta: {
    title: string;
    component: import("react").MemoExoticComponent<(props: import("./SynFloodConfigPanel").SynFloodConfigPanelProps) => import("react/jsx-runtime").JSX.Element>;
    parameters: {
        layout: string;
        docs: {
            description: {
                component: string;
            };
        };
        a11y: {
            config: {
                rules: {
                    id: string;
                    enabled: boolean;
                }[];
            };
        };
    };
    tags: string[];
    argTypes: {
        configHook: {
            control: "object";
            description: string;
        };
        loading: {
            control: "boolean";
            description: string;
        };
        className: {
            control: "text";
            description: string;
        };
    };
    args: {
        loading: false;
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Disabled State
 *
 * SYN flood protection is disabled.
 * Shows toggle to enable and helpful explanation.
 */
export declare const Disabled: Story;
/**
 * Enabled - Drop Action
 *
 * SYN flood protection enabled with drop action.
 * Normal protection level (100 SYN/sec).
 */
export declare const EnabledDrop: Story;
/**
 * Enabled - Tarpit Action
 *
 * SYN flood protection enabled with tarpit action.
 * More subtle defense that slows down attackers.
 */
export declare const EnabledTarpit: Story;
/**
 * Strict Protection Preset
 *
 * Strict preset applied (50 SYN/sec, burst 5).
 * Aggressive protection for high-risk environments.
 */
export declare const StrictProtection: Story;
/**
 * With Preset Buttons
 *
 * Shows preset configuration buttons for quick setup.
 * Normal, Strict, and Paranoid presets available.
 */
export declare const WithPresets: Story;
/**
 * Custom Configuration
 *
 * User has configured custom SYN limit and burst values.
 * Not matching any preset.
 */
export declare const CustomConfig: Story;
/**
 * Loading State
 *
 * Shows skeleton loading state while fetching configuration.
 */
export declare const Loading: Story;
/**
 * Saving State
 *
 * Shows saving state when update is in progress.
 * Save button disabled with loading spinner.
 */
export declare const Saving: Story;
/**
 * Mobile Variant
 *
 * Forces mobile presenter (stacked layout).
 * Optimized for touch: 44px targets, vertical sections.
 */
export declare const MobileView: Story;
/**
 * Desktop Variant
 *
 * Forces desktop presenter (card layout).
 * Optimized for keyboard: inline fields, grouped sections.
 */
export declare const DesktopView: Story;
/**
 * With Validation Errors
 *
 * Shows form validation for invalid inputs.
 * SYN limit too low (< 1) and burst too high.
 */
export declare const WithErrors: Story;
/**
 * Without Preset Buttons
 *
 * Hides preset configuration buttons.
 * Useful for compact layouts or when presets aren't desired.
 */
export declare const NoPresets: Story;
/**
 * Accessibility Validation
 *
 * Validates WCAG AAA compliance.
 * Check Storybook a11y addon for zero violations.
 */
export declare const AccessibilityTest: Story;
//# sourceMappingURL=SynFloodConfigPanel.stories.d.ts.map