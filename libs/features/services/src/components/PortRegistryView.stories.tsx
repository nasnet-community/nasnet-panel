import type { Meta, StoryObj } from '@storybook/react';
import { PortRegistryView } from './PortRegistryView';

/**
 * PortRegistryView fetches live data via Apollo using the routerId prop.
 * In Storybook without a live backend the component will remain in a loading
 * state or show the error / empty-state UI.  The stories below document every
 * meaningful prop combination; connect an Apollo mock provider or MSW handler
 * to render fully-populated data.
 */
const meta: Meta<typeof PortRegistryView> = {
  title: 'Features/Services/PortRegistryView',
  component: PortRegistryView,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Platform-agnostic port registry display. On mobile (<640 px) it renders a card-based grouped view with 44 px touch targets; on tablet/desktop it renders a sortable, filterable DataTable. Data is fetched from the backend via `usePortAllocations(routerId)`.',
      },
    },
  },
  argTypes: {
    routerId: { control: 'text' },
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof PortRegistryView>;

/**
 * Default story — points to a plausible router ID.
 * In an environment with a live or mocked Apollo provider this will render
 * the full DataTable with sort and filter controls.
 */
export const Default: Story = {
  name: 'Default',
  args: {
    routerId: 'router-192-168-1-1',
  },
};

/**
 * Demonstrates rendering for a different router, exercising the
 * "Loading" skeleton state that appears before data arrives.
 */
export const AlternateRouter: Story = {
  name: 'Alternate Router',
  args: {
    routerId: 'router-10-0-0-1',
  },
};

/**
 * Shows the component constrained to a narrower container to verify
 * that the layout remains usable without a full-width viewport.
 */
export const NarrowContainer: Story = {
  name: 'Narrow Container',
  args: {
    routerId: 'router-172-16-0-1',
    className: 'max-w-lg',
  },
  parameters: {
    layout: 'centered',
  },
};

/**
 * Simulates what the component title / wrapper look like when the
 * routerId is an empty string — the hook's `skip: !routerId` guard
 * keeps it in a loading-like state without making a real network call.
 */
export const EmptyRouterId: Story = {
  name: 'Empty Router ID (skipped query)',
  args: {
    routerId: '',
  },
};
