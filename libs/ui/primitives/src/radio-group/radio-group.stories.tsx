import * as React from 'react';

import { RadioGroup, RadioGroupItem } from './radio-group';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof RadioGroup> = {
  title: 'Primitives/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A set of checkable buttons — called radio buttons — where no more than one button can be checked at a time. Built on Radix UI RadioGroup with full keyboard navigation, WCAG-compliant focus rings, and a 44px minimum touch target. Use `RadioGroupItem` for each option and pair with `Label` for accessibility.',
      },
    },
  },
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'The value of the radio item that should be checked by default.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables all radio items in the group.',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the radio group.',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to merge',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="mikrotik-api">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="mikrotik-api" id="mikrotik-api" />
        <label htmlFor="mikrotik-api" className="text-sm font-medium text-foreground cursor-pointer">
          MikroTik API (port 8728)
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="ssh" id="ssh" />
        <label htmlFor="ssh" className="text-sm font-medium text-foreground cursor-pointer">
          SSH (port 22)
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="winbox" id="winbox" />
        <label htmlFor="winbox" className="text-sm font-medium text-foreground cursor-pointer">
          Winbox (port 8291)
        </label>
      </div>
    </RadioGroup>
  ),
};

export const WithDescriptions: Story = {
  render: () => (
    <RadioGroup defaultValue="dhcp" className="gap-3">
      <div className="flex items-start gap-3">
        <RadioGroupItem value="dhcp" id="dhcp" className="mt-0.5" />
        <div>
          <label htmlFor="dhcp" className="text-sm font-medium text-foreground cursor-pointer">
            DHCP Client
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automatically obtain an IP address from your ISP.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <RadioGroupItem value="static" id="static" className="mt-0.5" />
        <div>
          <label htmlFor="static" className="text-sm font-medium text-foreground cursor-pointer">
            Static IP
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manually configure a fixed IP address, gateway, and DNS.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <RadioGroupItem value="pppoe" id="pppoe" className="mt-0.5" />
        <div>
          <label htmlFor="pppoe" className="text-sm font-medium text-foreground cursor-pointer">
            PPPoE
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Use PPPoE dialing — common with DSL and fibre ISPs.
          </p>
        </div>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="aes256" disabled>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="aes128" id="aes128" />
        <label htmlFor="aes128" className="text-sm font-medium text-foreground cursor-not-allowed opacity-50">
          AES-128
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="aes256" id="aes256" />
        <label htmlFor="aes256" className="text-sm font-medium text-foreground cursor-not-allowed opacity-50">
          AES-256
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="chacha20" id="chacha20" />
        <label htmlFor="chacha20" className="text-sm font-medium text-foreground cursor-not-allowed opacity-50">
          ChaCha20-Poly1305
        </label>
      </div>
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="5ghz" orientation="horizontal" className="flex flex-row gap-6">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="2ghz" id="2ghz" />
        <label htmlFor="2ghz" className="text-sm font-medium text-foreground cursor-pointer">
          2.4 GHz
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="5ghz" id="5ghz" />
        <label htmlFor="5ghz" className="text-sm font-medium text-foreground cursor-pointer">
          5 GHz
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="6ghz" id="6ghz" />
        <label htmlFor="6ghz" className="text-sm font-medium text-foreground cursor-pointer">
          6 GHz
        </label>
      </div>
    </RadioGroup>
  ),
};

export const Controlled: Story = {
  render: function ControlledExample() {
    const [value, setValue] = React.useState('info');

    const levels = [
      { value: 'debug', label: 'Debug', description: 'Verbose — all events' },
      { value: 'info', label: 'Info', description: 'Standard operational messages' },
      { value: 'warning', label: 'Warning', description: 'Potential issues only' },
      { value: 'error', label: 'Error', description: 'Failures and critical errors' },
    ];

    return (
      <div className="flex flex-col gap-4 w-72">
        <p className="text-sm font-semibold text-foreground">Log Level</p>
        <RadioGroup value={value} onValueChange={setValue} className="gap-3">
          {levels.map((level) => (
            <div key={level.value} className="flex items-start gap-3">
              <RadioGroupItem value={level.value} id={`level-${level.value}`} className="mt-0.5" />
              <div>
                <label
                  htmlFor={`level-${level.value}`}
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  {level.label}
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">{level.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
        <p className="text-xs text-muted-foreground">
          Selected: <span className="font-mono text-primary">{value}</span>
        </p>
      </div>
    );
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <RadioGroup defaultValue="option1" className="gap-2">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option1" id="option1" />
        <label htmlFor="option1" className="text-sm font-medium text-foreground cursor-pointer">
          Option 1
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option2" id="option2" />
        <label htmlFor="option2" className="text-sm font-medium text-foreground cursor-pointer">
          Option 2
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option3" id="option3" />
        <label htmlFor="option3" className="text-sm font-medium text-foreground cursor-pointer">
          Option 3
        </label>
      </div>
    </RadioGroup>
  ),
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  render: () => (
    <RadioGroup defaultValue="static" className="gap-3">
      <div className="flex items-start gap-3">
        <RadioGroupItem value="dhcp" id="dhcp-t" className="mt-0.5" />
        <div>
          <label htmlFor="dhcp-t" className="text-sm font-medium text-foreground cursor-pointer">
            DHCP Client
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automatically obtain an IP address from your ISP.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <RadioGroupItem value="static" id="static-t" className="mt-0.5" />
        <div>
          <label htmlFor="static-t" className="text-sm font-medium text-foreground cursor-pointer">
            Static IP
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manually configure a fixed IP address, gateway, and DNS.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <RadioGroupItem value="pppoe" id="pppoe-t" className="mt-0.5" />
        <div>
          <label htmlFor="pppoe-t" className="text-sm font-medium text-foreground cursor-pointer">
            PPPoE
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Use PPPoE dialing — common with DSL and fibre ISPs.
          </p>
        </div>
      </div>
    </RadioGroup>
  ),
};

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  render: () => (
    <RadioGroup defaultValue="mikrotik-api" className="gap-2">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="mikrotik-api" id="mikrotik-api-d" />
        <label htmlFor="mikrotik-api-d" className="text-sm font-medium text-foreground cursor-pointer">
          MikroTik API (port 8728)
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="ssh" id="ssh-d" />
        <label htmlFor="ssh-d" className="text-sm font-medium text-foreground cursor-pointer">
          SSH (port 22)
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="winbox" id="winbox-d" />
        <label htmlFor="winbox-d" className="text-sm font-medium text-foreground cursor-pointer">
          Winbox (port 8291)
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="rest-api" id="rest-api-d" />
        <label htmlFor="rest-api-d" className="text-sm font-medium text-foreground cursor-pointer">
          REST API (port 8080)
        </label>
      </div>
    </RadioGroup>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="h-5 bg-muted rounded animate-pulse w-32" />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse flex-1 max-w-48" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse flex-1 max-w-40" />
        </div>
      </div>
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div className="space-y-2 p-4 rounded-lg border border-error/20 bg-error/5">
      <p className="text-sm font-medium text-error">Failed to load options</p>
      <p className="text-xs text-error/80">Unable to retrieve configuration options. Please try again.</p>
      <button className="text-xs font-medium text-error hover:underline mt-2">Retry</button>
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="p-8 text-center space-y-3">
      <div className="text-4xl text-muted-foreground">○</div>
      <p className="text-sm font-medium text-foreground">No options available</p>
      <p className="text-xs text-muted-foreground max-w-xs">
        There are no selectable options at this time.
      </p>
    </div>
  ),
};
