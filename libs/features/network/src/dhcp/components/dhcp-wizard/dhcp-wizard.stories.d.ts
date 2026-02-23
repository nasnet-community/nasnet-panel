/**
 * DHCP Wizard Storybook Stories
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 *
 * NOTE: DHCPWizard is a full-page orchestrator that relies on router
 * connection state, routing, and API mutations. These stories demonstrate
 * the individual sub-components (WizardStepReview) that can be rendered
 * in isolation, along with the overall wizard's Live Preview panel.
 *
 * The WizardStepReview component is separately showcased for design review.
 */
import type { StoryObj } from '@storybook/react';
interface LivePreviewPanelProps {
    interfaceData?: {
        interface?: string;
        interfaceIP?: string;
    };
    poolData?: {
        poolStart?: string;
        poolEnd?: string;
    };
    networkData?: {
        gateway?: string;
        dnsServers?: string[];
        leaseTime?: string;
        domain?: string;
        ntpServer?: string;
    };
}
declare function LivePreviewPanel({ interfaceData, poolData, networkData, }: LivePreviewPanelProps): import("react/jsx-runtime").JSX.Element;
declare const meta: {
    title: string;
    component: typeof LivePreviewPanel;
    parameters: {
        layout: string;
        docs: {
            description: {
                component: string;
            };
        };
    };
    tags: string[];
    argTypes: {
        interfaceData: {
            description: string;
            control: "object";
        };
        poolData: {
            description: string;
            control: "object";
        };
        networkData: {
            description: string;
            control: "object";
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Initial empty state — shown before the user fills in any wizard step.
 */
export declare const Empty: Story;
/**
 * After completing Step 1 – Interface selected.
 */
export declare const AfterInterfaceStep: Story;
/**
 * After completing Step 2 – Address Pool configured.
 */
export declare const AfterPoolStep: Story;
/**
 * After completing Step 3 – Network Settings filled in (full preview).
 */
export declare const FullPreview: Story;
/**
 * Network settings without optional domain and NTP fields.
 */
export declare const MinimalNetworkSettings: Story;
/**
 * Large enterprise pool spanning a /22 block.
 */
export declare const LargeEnterprisePool: Story;
//# sourceMappingURL=dhcp-wizard.stories.d.ts.map