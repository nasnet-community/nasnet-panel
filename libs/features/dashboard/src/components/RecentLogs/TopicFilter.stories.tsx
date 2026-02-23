/**
 * Storybook stories for TopicFilter
 *
 * Multi-select popover for filtering logs by RouterOS topic/facility.
 * WCAG AAA compliant with ARIA listbox + option roles and 44px touch targets.
 * Story NAS-5.6: Recent Logs with Filtering.
 */

import { fn } from 'storybook/test';

import type { LogTopic } from '@nasnet/core/types';

import { TopicFilter } from './TopicFilter';

import type { TopicFilterProps } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof TopicFilter> = {
  title: 'Features/Dashboard/RecentLogs/TopicFilter',
  component: TopicFilter,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multi-select dropdown for filtering the Recent Logs widget by RouterOS ' +
          'topic/facility (system, firewall, wireless, dhcp, dns, ppp, vpn, interface, ' +
          'route, script). ' +
          'Displays a badge with the selected count and a "Clear filters" button when ' +
          'at least one topic is active. ' +
          'Uses Radix Popover with ARIA listbox semantics and 44px minimum touch targets.',
      },
    },
  },
  argTypes: {
    selectedTopics: {
      control: 'check',
      options: [
        'system',
        'firewall',
        'wireless',
        'dhcp',
        'dns',
        'ppp',
        'vpn',
        'interface',
        'route',
        'script',
      ] satisfies LogTopic[],
      description: 'Currently selected topics',
    },
    onSelectionChange: { action: 'onSelectionChange' },
  },
};

export default meta;
type Story = StoryObj<typeof TopicFilter>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** No topics selected — the trigger shows only the filter icon with no badge. */
export const NoFilters: Story = {
  args: {
    selectedTopics: [],
    onSelectionChange: fn(),
  } satisfies TopicFilterProps,
};

/** Single topic active — badge shows count of 1. */
export const SingleTopicSelected: Story = {
  args: {
    selectedTopics: ['firewall'],
    onSelectionChange: fn(),
  } satisfies TopicFilterProps,
};

/** Multiple topics active — badge shows count, "Clear filters" button visible. */
export const MultipleTopicsSelected: Story = {
  args: {
    selectedTopics: ['system', 'firewall', 'dhcp'],
    onSelectionChange: fn(),
  } satisfies TopicFilterProps,
};

/** All available filter topics selected — badge shows maximum count. */
export const AllTopicsSelected: Story = {
  args: {
    selectedTopics: [
      'system',
      'firewall',
      'wireless',
      'dhcp',
      'dns',
      'ppp',
      'vpn',
      'interface',
      'route',
      'script',
    ] satisfies LogTopic[],
    onSelectionChange: fn(),
  } satisfies TopicFilterProps,
};

/** Network-related topics — DNS, route, interface, and VPN pre-selected. */
export const NetworkTopics: Story = {
  args: {
    selectedTopics: ['dns', 'route', 'interface', 'vpn'],
    onSelectionChange: fn(),
  } satisfies TopicFilterProps,
};
