/**
 * LanguageSwitcher Storybook Stories
 * Language and locale selection dropdown
 */

import { fn } from 'storybook/test';
import { LanguageSwitcher } from './LanguageSwitcher';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LanguageSwitcher> = {
  title: 'Patterns/Common/LanguageSwitcher',
  component: LanguageSwitcher,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Dropdown menu for switching between supported languages with native language names and RTL support.',
      },
    },
    layout: 'padded',
  },
  args: {
    showLabel: false,
    onBeforeChange: fn(),
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    showLabel: {
      control: 'boolean',
      description: 'Show language name label next to icon',
    },
    onBeforeChange: {
      action: 'onBeforeChange',
      description: 'Callback before language change',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LanguageSwitcher>;

/**
 * Default language switcher - icon only
 */
export const Default: Story = {
  render: (args) => <LanguageSwitcher {...args} />,
};

/**
 * With language name label
 */
export const WithLabel: Story = {
  args: {
    showLabel: true,
  },
  render: (args) => <LanguageSwitcher {...args} />,
};

/**
 * Custom styling
 */
export const CustomStyle: Story = {
  args: {
    showLabel: true,
    className: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  render: (args) => <LanguageSwitcher {...args} />,
};

/**
 * With confirmation callback
 */
export const WithConfirmation: Story = {
  args: {
    showLabel: true,
    onBeforeChange: fn(async (newLang: string) => {
      const confirmed = await new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(true), 500);
      });
      return confirmed;
    }),
  },
  render: (args) => (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Language change requires confirmation (simulated delay)
      </p>
      <LanguageSwitcher {...args} />
    </div>
  ),
};

/**
 * In a header/navbar context
 */
export const InHeader: Story = {
  render: (args) => (
    <div className="bg-background flex items-center gap-2 border-b p-4">
      <div className="flex-1">
        <p className="font-semibold">App Header</p>
      </div>
      <LanguageSwitcher
        {...args}
        showLabel={true}
      />
    </div>
  ),
};

/**
 * Mobile layout
 */
export const MobileLayout: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: (args) => (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Mobile-sized viewport</p>
      <LanguageSwitcher
        {...args}
        showLabel={true}
      />
    </div>
  ),
};

/**
 * Desktop layout
 */
export const DesktopLayout: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  render: (args) => (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Desktop-sized viewport</p>
      <LanguageSwitcher
        {...args}
        showLabel={true}
      />
    </div>
  ),
};

/**
 * Multiple switchers
 */
export const Multiple: Story = {
  render: (args) => (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Multiple language switchers</p>
      <div className="flex gap-2">
        <LanguageSwitcher
          {...args}
          showLabel={false}
        />
        <LanguageSwitcher
          {...args}
          showLabel={false}
        />
        <LanguageSwitcher
          {...args}
          showLabel={true}
        />
      </div>
    </div>
  ),
};

/**
 * Dark mode
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: (args) => (
    <div className="dark">
      <div className="rounded bg-slate-950 p-4">
        <LanguageSwitcher
          {...args}
          showLabel={true}
        />
      </div>
    </div>
  ),
};
