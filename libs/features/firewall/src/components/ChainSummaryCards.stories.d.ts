/**
 * ChainSummaryCards Storybook Stories
 *
 * Stories for the firewall chain summary card grid component.
 * Demonstrates selection, action distribution, error/loading states, and chain variants.
 *
 * @module @nasnet/features/firewall
 */
import type { FirewallChain } from '@nasnet/core/types';
import type { StoryObj } from '@storybook/react';
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./ChainSummaryCards").ChainSummaryCardsProps>;
    tags: string[];
    decorators: ((Story: import("storybook/internal/csf").PartialStoryFn<import("@storybook/react").ReactRenderer, {
        className?: string | undefined;
        selectedChain?: (FirewallChain | null) | undefined;
        onChainSelect?: ((chain: FirewallChain | null) => void) | undefined;
    }>) => import("react/jsx-runtime").JSX.Element)[];
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
    argTypes: {
        selectedChain: {
            control: "radio";
            options: (string | null)[];
            description: string;
        };
        onChainSelect: {
            action: string;
            description: string;
        };
        className: {
            control: "text";
            description: string;
        };
    };
    args: {
        onChainSelect: import("storybook/test").Mock<(...args: any[]) => any>;
        selectedChain: null;
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default
 *
 * All three main chains with realistic rule distributions.
 * No chain is pre-selected; the header shows "Click a chain to filter rules."
 */
export declare const Default: Story;
/**
 * InputChainSelected
 *
 * The input chain card is pre-selected, showing the highlighted blue ring state.
 * The section subtitle reads "Filtering by input chain".
 */
export declare const InputChainSelected: Story;
/**
 * ForwardChainSelected
 *
 * Forward chain is selected (purple highlight). Useful for reviewing rules that
 * process traffic passing through the router between interfaces.
 */
export declare const ForwardChainSelected: Story;
/**
 * HighRuleCount
 *
 * A router with many rules across all chains — representative of a production
 * firewall deployment with 60+ rules. Tests layout at high numbers.
 */
export declare const HighRuleCount: Story;
/**
 * LoadingState
 *
 * Three skeleton placeholder cards while rule data is being fetched.
 */
export declare const LoadingState: Story;
/**
 * EmptyChains
 *
 * Router has no filter rules at all. All three chain cards show 0 rules.
 */
export declare const EmptyChains: Story;
//# sourceMappingURL=ChainSummaryCards.stories.d.ts.map