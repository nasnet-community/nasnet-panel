/**
 * TimezoneSelector Storybook Stories
 *
 * Showcases the searchable timezone picker used in quiet hours configuration.
 * Demonstrates pre-selected timezones, disabled state, and search interaction.
 */

import { fn } from 'storybook/test';

import { TimezoneSelector } from './TimezoneSelector';

import type { Meta, StoryObj } from '@storybook/react';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof TimezoneSelector> = {
  title: 'Features/Alerts/QuietHoursConfig/TimezoneSelector',
  component: TimezoneSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A searchable timezone picker that groups IANA timezone identifiers by region. Shows a curated list of common timezones at the top when no search query is entered. Falls back to the common timezone list when the `Intl.supportedValuesOf` API is unavailable. Complies with WCAG AAA with a 44px touch target on the trigger.',
      },
    },
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Currently selected IANA timezone string',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the selector is disabled',
    },
    onChange: {
      description: 'Callback fired with the newly selected IANA timezone string',
      action: 'changed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TimezoneSelector>;

// =============================================================================
// Stories
// =============================================================================

/**
 * Default — Eastern US timezone pre-selected.
 */
export const Default: Story = {
  args: {
    value: 'America/New_York',
    onChange: fn(),
    disabled: false,
  },
};

/**
 * UTC-equivalent — UTC itself is not in the IANA list produced by
 * Intl.supportedValuesOf, so this story exercises the component with
 * a common European timezone.
 */
export const EuropeanTimezone: Story = {
  args: {
    value: 'Europe/London',
    onChange: fn(),
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component with a European timezone pre-selected.',
      },
    },
  },
};

/**
 * Asia/Pacific timezone — verifies correct grouping under the Asia region.
 */
export const AsianTimezone: Story = {
  args: {
    value: 'Asia/Tokyo',
    onChange: fn(),
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'A timezone from the Asia region to verify correct regional grouping in the list.',
      },
    },
  },
};

/**
 * Australian timezone.
 */
export const AustralianTimezone: Story = {
  args: {
    value: 'Australia/Sydney',
    onChange: fn(),
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Australia/Pacific region timezone selection.',
      },
    },
  },
};

/**
 * Disabled state — selector is rendered but not interactive.
 */
export const Disabled: Story = {
  args: {
    value: 'America/Chicago',
    onChange: fn(),
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state used when the quiet hours feature is toggled off or the form is read-only.',
      },
    },
  },
};

/**
 * No pre-selection — shows the placeholder text.
 */
export const NoSelection: Story = {
  args: {
    value: '',
    onChange: fn(),
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'When no timezone is selected the trigger displays the placeholder text prompting the user to select one.',
      },
    },
  },
};
