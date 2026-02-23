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
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(nextTheme);
  };

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  const currentLabel =
    theme === 'light'
      ? 'light mode'
      : theme === 'dark'
        ? 'dark mode'
        : 'system mode';
  const nextLabel =
    theme === 'light'
      ? 'dark mode'
      : theme === 'dark'
        ? 'system mode'
        : 'light mode';
  const ariaLabel = `Switch to ${nextLabel} (current: ${currentLabel})`;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={cn(
        'rounded-full hover:bg-accent transition-all duration-200',
        className
      )}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <Icon className="h-5 w-5 text-muted-foreground transition-transform duration-300 hover:rotate-12" />
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
        theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
      setTheme(nextTheme);
    };

    const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

    return (
      <div className="flex flex-col items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          className="rounded-full hover:bg-accent transition-all duration-200"
        >
          <Icon className="h-5 w-5 text-muted-foreground transition-transform duration-300 hover:rotate-12" />
        </Button>
        <p className="text-sm text-muted-foreground">
          Current mode: <span className="font-medium text-foreground">{theme}</span>
        </p>
        <p className="text-xs text-muted-foreground">
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
    <div className="flex items-center justify-between w-80 px-4 py-2 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">N</span>
        </div>
        <span className="font-semibold text-sm">NasNet Connect</span>
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
          className="rounded-full hover:bg-accent"
        >
          <Sun className="h-5 w-5 text-muted-foreground" />
        </Button>
        <span className="text-xs text-muted-foreground">Light</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-accent"
        >
          <Moon className="h-5 w-5 text-muted-foreground" />
        </Button>
        <span className="text-xs text-muted-foreground">Dark</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-accent"
        >
          <Monitor className="h-5 w-5 text-muted-foreground" />
        </Button>
        <span className="text-xs text-muted-foreground">System</span>
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
        theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
      setTheme(nextTheme);
    };

    const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
    const label = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System';

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
