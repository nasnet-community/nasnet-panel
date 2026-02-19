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
          'A popover component built on Radix UI Popover primitive. Renders floating content anchored to a trigger element. Supports alignment (start, center, end) and side placement. Portals to document body to avoid overflow clipping.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm text-muted-foreground">
          This is the popover content. It floats above the page anchored to the trigger.
        </p>
      </PopoverContent>
    </Popover>
  ),
};

export const RouterQuickSettings: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">Quick Settings</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-1">
            <h4 className="font-semibold leading-none">Router Settings</h4>
            <p className="text-sm text-muted-foreground">
              Adjust connection and identity settings.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="router-name" className="text-right text-sm">
                Name
              </Label>
              <Input
                id="router-name"
                defaultValue="MikroTik-HQ"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="router-ip" className="text-right text-sm">
                IP
              </Label>
              <Input
                id="router-ip"
                defaultValue="192.168.88.1"
                className="col-span-2 h-8 font-mono"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="router-port" className="text-right text-sm">
                Port
              </Label>
              <Input
                id="router-port"
                defaultValue="8728"
                className="col-span-2 h-8 font-mono"
              />
            </div>
          </div>
          <Button size="sm" className="w-full">Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const AlignmentVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">Align Start</Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <p className="text-sm">Aligned to the start of the trigger.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">Align Center</Button>
        </PopoverTrigger>
        <PopoverContent align="center">
          <p className="text-sm">Aligned to the center of the trigger.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">Align End</Button>
        </PopoverTrigger>
        <PopoverContent align="end">
          <p className="text-sm">Aligned to the end of the trigger.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const FilterPopover: Story = {
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
          <Button variant="outline" size="sm">
            Filter Interfaces
            {selected.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                {selected.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56">
          <div className="grid gap-2">
            <p className="text-sm font-medium">Select interfaces</p>
            {interfaces.map((iface) => (
              <label key={iface} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(iface)}
                  onChange={() => toggle(iface)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm font-mono">{iface}</span>
              </label>
            ))}
            {selected.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-muted-foreground"
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
  render: () => (
    <div className="grid grid-cols-2 gap-8 p-16">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">Top</Button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-48">
          <p className="text-sm">Opens above the trigger.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">Bottom</Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" className="w-48">
          <p className="text-sm">Opens below the trigger.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">Left</Button>
        </PopoverTrigger>
        <PopoverContent side="left" className="w-48">
          <p className="text-sm">Opens to the left.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">Right</Button>
        </PopoverTrigger>
        <PopoverContent side="right" className="w-48">
          <p className="text-sm">Opens to the right.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
