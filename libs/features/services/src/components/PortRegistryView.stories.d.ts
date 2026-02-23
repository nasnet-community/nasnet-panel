import { PortRegistryView } from './PortRegistryView';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * PortRegistryView fetches live data via Apollo using the routerId prop.
 * In Storybook without a live backend the component will remain in a loading
 * state or show the error / empty-state UI.  The stories below document every
 * meaningful prop combination; connect an Apollo mock provider or MSW handler
 * to render fully-populated data.
 */
declare const meta: Meta<typeof PortRegistryView>;
export default meta;
type Story = StoryObj<typeof PortRegistryView>;
/**
 * Default story — points to a plausible router ID.
 * In an environment with a live or mocked Apollo provider this will render
 * the full DataTable with sort and filter controls.
 */
export declare const Default: Story;
/**
 * Demonstrates rendering for a different router, exercising the
 * "Loading" skeleton state that appears before data arrives.
 */
export declare const AlternateRouter: Story;
/**
 * Shows the component constrained to a narrower container to verify
 * that the layout remains usable without a full-width viewport.
 */
export declare const NarrowContainer: Story;
/**
 * Simulates what the component title / wrapper look like when the
 * routerId is an empty string — the hook's `skip: !routerId` guard
 * keeps it in a loading-like state without making a real network call.
 */
export declare const EmptyRouterId: Story;
//# sourceMappingURL=PortRegistryView.stories.d.ts.map