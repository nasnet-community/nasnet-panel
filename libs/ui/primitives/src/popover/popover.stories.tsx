import * as React from 'react';

import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Popover> = {
  title: 'Primitives/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A popover component built on Radix UI Popover primitive. Renders floating content anchored to a trigger element. Supports alignment (start, center, end) and side placement. Portals to document body to avoid overflow clipping. Fully keyboard accessible with Escape to close and Tab navigation support.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Basic popover with simple text content. Click the button to open/close.',
      },
    },
  },
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-muted-foreground text-sm">
          This is the popover content. It floats above the page anchored to the trigger.
        </p>
      </PopoverContent>
    </Popover>
  ),
};

export const RouterQuickSettings: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Popover with form controls for router settings. Demonstrates content with multiple input fields and labels.',
      },
    },
  },
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
        >
          Quick Settings
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-1">
            <h4 className="font-semibold leading-none">Router Settings</h4>
            <p className="text-muted-foreground text-sm">
              Adjust connection and identity settings.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label
                htmlFor="router-name"
                className="text-right text-sm"
              >
                Name
              </Label>
              <Input
                id="router-name"
                defaultValue="MikroTik-HQ"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label
                htmlFor="router-ip"
                className="text-right text-sm"
              >
                IP
              </Label>
              <Input
                id="router-ip"
                defaultValue="192.168.88.1"
                className="col-span-2 h-8 font-mono"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label
                htmlFor="router-port"
                className="text-right text-sm"
              >
                Port
              </Label>
              <Input
                id="router-port"
                defaultValue="8728"
                className="col-span-2 h-8 font-mono"
              />
            </div>
          </div>
          <Button
            size="sm"
            className="w-full"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const AlignmentVariants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates different alignment options for popover content relative to trigger: start, center, and end.',
      },
    },
  },
  render: () => (
    <div className="flex gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
          >
            Align Start
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <p className="text-sm">Aligned to the start of the trigger.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
          >
            Align Center
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center">
          <p className="text-sm">Aligned to the center of the trigger.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
          >
            Align End
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end">
          <p className="text-sm">Aligned to the end of the trigger.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const FilterPopover: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Interactive filter popover with checkboxes. Demonstrates stateful content with selection badge on trigger.',
      },
    },
  },
  render: function FilterDemo() {
    const [selected, setSelected] = React.useState<string[]>([]);
    const interfaces = ['ether1', 'ether2', 'wlan1', 'bridge1', 'vlan10'];

    const toggle = (name: string) =>
      setSelected((prev) =>
        prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
      );

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
          >
            Filter Interfaces
            {selected.length > 0 && (
              <span className="bg-primary text-primary-foreground ml-2 rounded-full px-1.5 py-0.5 text-xs">
                {selected.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56">
          <div className="grid gap-2">
            <p className="text-sm font-medium">Select interfaces</p>
            {interfaces.map((iface) => (
              <label
                key={iface}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(iface)}
                  onChange={() => toggle(iface)}
                  className="border-border h-4 w-4 rounded"
                />
                <span className="font-mono text-sm">{iface}</span>
              </label>
            ))}
            {selected.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground mt-1"
                onClick={() => setSelected([])}
              >
                Clear all
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  },
};

export const SidePlacements: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates side placement options for popover: top, bottom, left, and right positioning relative to trigger.',
      },
    },
  },
  render: () => (
    <div className="grid grid-cols-2 gap-8 p-16">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
          >
            Top
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          className="w-48"
        >
          <p className="text-sm">Opens above the trigger.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
          >
            Bottom
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          className="w-48"
        >
          <p className="text-sm">Opens below the trigger.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
          >
            Left
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="left"
          className="w-48"
        >
          <p className="text-sm">Opens to the left.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
          >
            Right
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          className="w-48"
        >
          <p className="text-sm">Opens to the right.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Popover on mobile viewport (375px). Content adapts with touch-friendly spacing and sizing.',
      },
    },
  },
  render: () => (
    <div className="p-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full"
          >
            Open Settings
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full max-w-xs">
          <div className="space-y-2">
            <h4 className="font-semibold">Quick Settings</h4>
            <p className="text-muted-foreground text-sm">Adjust your preferences here.</p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story:
          'Popover on tablet viewport (768px). Demonstrates balanced information density for tablet devices.',
      },
    },
  },
  render: () => (
    <div className="p-6">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Options</Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <div className="space-y-3">
            <h4 className="font-semibold">Advanced Options</h4>
            <p className="text-muted-foreground text-sm">
              Configure advanced settings for your device.
            </p>
            <Button
              size="sm"
              className="w-full"
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'Popover on desktop viewport (1280px). Shows full dense content layout with multiple controls.',
      },
    },
  },
  render: () => (
    <div className="p-8">
      <Popover>
        <PopoverTrigger asChild>
          <Button>Configuration Menu</Button>
        </PopoverTrigger>
        <PopoverContent className="w-96">
          <div className="grid gap-4">
            <div>
              <h4 className="mb-2 font-semibold leading-none">Configuration</h4>
              <p className="text-muted-foreground text-sm">
                Manage your router configuration settings.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
              >
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
              >
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
              >
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
              >
                Help
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
