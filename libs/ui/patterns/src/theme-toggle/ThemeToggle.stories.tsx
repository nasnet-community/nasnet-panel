import * as React from 'react';

import { Moon, Sun, Monitor } from 'lucide-react';

import { Button, cn } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

// Mock ThemeToggle for Storybook since it depends on Zustand store
type ThemeMode = 'light' | 'dark' | 'system';

interface MockThemeToggleProps {
  initialTheme?: ThemeMode;
  className?: string;
}

function MockThemeToggle({ initialTheme = 'light', className }: MockThemeToggleProps) {
  const [theme, setTheme] = React.useState<ThemeMode>(initialTheme);

  const handleToggle = () => {
    const nextTheme: ThemeMode =
      theme === 'light' ? 'dark'
      : theme === 'dark' ? 'system'
      : 'light';
    setTheme(nextTheme);
  };

  const Icon =
    theme === 'dark' ? Moon
    : theme === 'light' ? Sun
    : Monitor;

  const currentLabel =
    theme === 'light' ? 'light mode'
    : theme === 'dark' ? 'dark mode'
    : 'system mode';
  const nextLabel =
    theme === 'light' ? 'dark mode'
    : theme === 'dark' ? 'system mode'
    : 'light mode';
  const ariaLabel = `Switch to ${nextLabel} (current: ${currentLabel})`;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={cn('hover:bg-accent rounded-full transition-all duration-200', className)}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <Icon className="text-muted-foreground h-5 w-5 transition-transform duration-300 hover:rotate-12" />
    </Button>
  );
}

const meta: Meta<typeof MockThemeToggle> = {
  title: 'Patterns/Common/ThemeToggle',
  component: MockThemeToggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A theme toggle button that cycles through three modes: Light (Sun icon), Dark (Moon icon), and System (Monitor icon). Follows OS preference in system mode. Keyboard accessible with proper ARIA labels and smooth animations.',
      },
    },
  },
  argTypes: {
    initialTheme: {
      control: 'select',
      options: ['light', 'dark', 'system'],
      description: 'Initial theme mode',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MockThemeToggle>;

export const Default: Story = {
  args: {
    initialTheme: 'light',
  },
};

export const DarkMode: Story = {
  args: {
    initialTheme: 'dark',
  },
};

export const SystemMode: Story = {
  args: {
    initialTheme: 'system',
  },
};

export const Interactive: Story = {
  render: () => {
    const [theme, setTheme] = React.useState<ThemeMode>('light');

    const handleToggle = () => {
      const nextTheme: ThemeMode =
        theme === 'light' ? 'dark'
        : theme === 'dark' ? 'system'
        : 'light';
      setTheme(nextTheme);
    };

    const Icon =
      theme === 'dark' ? Moon
      : theme === 'light' ? Sun
      : Monitor;

    return (
      <div className="flex flex-col items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          className="hover:bg-accent rounded-full transition-all duration-200"
        >
          <Icon className="text-muted-foreground h-5 w-5 transition-transform duration-300 hover:rotate-12" />
        </Button>
        <p className="text-muted-foreground text-sm">
          Current mode: <span className="text-foreground font-medium">{theme}</span>
        </p>
        <p className="text-muted-foreground text-xs">
          Click to cycle: Light → Dark → System → Light
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing the three-state toggle cycle.',
      },
    },
  },
};

export const InHeader: Story = {
  render: () => (
    <div className="bg-card flex w-80 items-center justify-between rounded-lg border px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
          <span className="text-primary text-sm font-bold">N</span>
        </div>
        <span className="text-sm font-semibold">NasNet Connect</span>
      </div>
      <MockThemeToggle initialTheme="light" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ThemeToggle used in a header context.',
      },
    },
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex gap-8">
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent rounded-full"
        >
          <Sun className="text-muted-foreground h-5 w-5" />
        </Button>
        <span className="text-muted-foreground text-xs">Light</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent rounded-full"
        >
          <Moon className="text-muted-foreground h-5 w-5" />
        </Button>
        <span className="text-muted-foreground text-xs">Dark</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent rounded-full"
        >
          <Monitor className="text-muted-foreground h-5 w-5" />
        </Button>
        <span className="text-muted-foreground text-xs">System</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All three theme mode icons displayed side by side.',
      },
    },
  },
};

export const WithLabel: Story = {
  render: () => {
    const [theme, setTheme] = React.useState<ThemeMode>('light');

    const handleToggle = () => {
      const nextTheme: ThemeMode =
        theme === 'light' ? 'dark'
        : theme === 'dark' ? 'system'
        : 'light';
      setTheme(nextTheme);
    };

    const Icon =
      theme === 'dark' ? Moon
      : theme === 'light' ? Sun
      : Monitor;
    const label =
      theme === 'dark' ? 'Dark'
      : theme === 'light' ? 'Light'
      : 'System';

    return (
      <Button
        variant="outline"
        onClick={handleToggle}
        className="gap-2"
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Alternative variant with visible label.',
      },
    },
  },
};
