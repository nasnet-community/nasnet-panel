import * as React from 'react';

import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Sheet> = {
  title: 'Primitives/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A slide-in panel (drawer) built on Radix UI Dialog. Supports four entry sides: top, bottom, left, and right. Includes header, footer, title, and description sub-components. Used throughout the app for detail panels, forms, and mobile navigation.',
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the sheet is open (controlled)',
    },
    children: {
      control: false,
      description: 'Sheet content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sheet>;

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>
            This is the sheet description. It provides context for the content below.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p className="text-muted-foreground text-sm">Sheet body content goes here.</p>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const RouterEditForm: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Edit Interface</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Interface — ether1</SheetTitle>
          <SheetDescription>
            Modify the WAN uplink interface settings. Changes will be applied after confirmation.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="iface-name"
              className="text-right text-sm"
            >
              Name
            </Label>
            <Input
              id="iface-name"
              defaultValue="ether1"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="iface-comment"
              className="text-right text-sm"
            >
              Comment
            </Label>
            <Input
              id="iface-comment"
              defaultValue="WAN Uplink"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="iface-mtu"
              className="text-right text-sm"
            >
              MTU
            </Label>
            <Input
              id="iface-mtu"
              defaultValue="1500"
              className="col-span-3 font-mono"
            />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Discard</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button>Apply Changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const FromLeft: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open from Left</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>App navigation panel sliding from the left.</SheetDescription>
        </SheetHeader>
        <nav className="mt-4 flex flex-col gap-2">
          {['Dashboard', 'Interfaces', 'Firewall', 'VPN', 'Services', 'Logs'].map((item) => (
            <SheetClose
              asChild
              key={item}
            >
              <button className="hover:bg-muted rounded-md px-3 py-2 text-left text-sm transition-colors">
                {item}
              </button>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  ),
};

export const FromBottom: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open from Bottom</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Router Actions</SheetTitle>
          <SheetDescription>Choose an action to perform on the selected router.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-2 py-4">
          <Button
            variant="outline"
            className="justify-start"
          >
            Ping host
          </Button>
          <Button
            variant="outline"
            className="justify-start"
          >
            Traceroute
          </Button>
          <Button
            variant="outline"
            className="justify-start"
          >
            Export config
          </Button>
          <Button
            variant="destructive"
            className="justify-start"
          >
            Reboot router
          </Button>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button
              variant="ghost"
              className="w-full"
            >
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const FromTop: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open from Top</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>System Announcement</SheetTitle>
          <SheetDescription>Important notice from the NasNetConnect platform.</SheetDescription>
        </SheetHeader>
        <p className="text-muted-foreground py-3 text-sm">
          Scheduled maintenance window: Saturday 02:00–04:00 UTC. Some routers may become
          temporarily unreachable during this period.
        </p>
        <SheetFooter>
          <SheetClose asChild>
            <Button size="sm">Dismiss</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const AllSides: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {(['right', 'left', 'top', 'bottom'] as const).map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="capitalize"
            >
              {side}
            </Button>
          </SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle className="capitalize">{side} Sheet</SheetTitle>
              <SheetDescription>Slides in from the {side}.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  ),
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Mobile Sheet</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Mobile Actions</SheetTitle>
          <SheetDescription>Touch-optimized sheet for mobile devices.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-2 py-4">
          <Button className="w-full">Action 1</Button>
          <Button className="w-full">Action 2</Button>
          <Button className="w-full">Action 3</Button>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button
              className="w-full"
              variant="ghost"
            >
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Tablet Sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Tablet Configuration</SheetTitle>
          <SheetDescription>Balanced layout for tablet devices.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p className="text-muted-foreground text-sm">Content optimized for tablet viewport.</p>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
          <Button>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Desktop Sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Desktop Settings Panel</SheetTitle>
          <SheetDescription>Detailed configuration for desktop users.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <p className="text-muted-foreground text-sm">
            This sheet optimizes the desktop experience with all details visible.
          </p>
          <div className="space-y-2">
            <Label htmlFor="setting">Configuration Option</Label>
            <Input
              id="setting"
              placeholder="Enter value"
            />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Discard</Button>
          </SheetClose>
          <Button>Apply</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};
