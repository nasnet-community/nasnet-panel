/**
 * AlertTemplateBrowserNew Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Showcases the platform-routing AlertTemplateBrowserNew component which
 * automatically delegates to the Desktop (≥640px) or Mobile (<640px) presenter.
 *
 * Stories cover:
 * - Default full template catalogue
 * - Category pre-filtered views (Network, Security, Resources)
 * - Loading skeleton state
 * - Error state
 * - Empty result set
 * - Mobile viewport
 */
import { AlertTemplateBrowserNew } from './AlertTemplateBrowserNew';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AlertTemplateBrowserNew>;
export default meta;
type Story = StoryObj<typeof AlertTemplateBrowserNew>;
/**
 * Default — all templates displayed with no initial category filter.
 */
export declare const Default: Story;
/**
 * Pre-filtered to the Network category.
 */
export declare const FilteredByNetwork: Story;
/**
 * Pre-filtered to the Security category.
 */
export declare const FilteredBySecurity: Story;
/**
 * Loading skeleton — long server delay forces skeleton to remain visible.
 */
export declare const Loading: Story;
/**
 * Error state — server returns an error for the templates query.
 */
export declare const LoadError: Story;
/**
 * Empty — server returns an empty template list.
 */
export declare const Empty: Story;
/**
 * Mobile viewport — renders the AlertTemplateBrowserMobile presenter.
 */
export declare const Mobile: Story;
//# sourceMappingURL=AlertTemplateBrowserNew.stories.d.ts.map