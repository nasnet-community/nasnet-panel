import * as React from 'react';


import { Button } from '../button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Tooltip> = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A tooltip component built on Radix UI Tooltip primitive. Displays contextual information on hover or focus. Supports four placement sides (top, bottom, left, right) with smooth enter/exit animations.',
      },
    },
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This is a tooltip</p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const RouterAction: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Reboot router">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Reboot router</p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const SidePlacements: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8 p-12">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm">Top</Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Tooltip on top</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm">Bottom</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Tooltip on bottom</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm">Left</Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Tooltip on left</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm">Right</Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Tooltip on right</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const WithLongContent: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Interface info</Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>
          ether1 — WAN uplink. Current speed: 1Gbps. TX: 42.3 MB/s, RX: 18.7 MB/s.
          Last link change 2h 14m ago.
        </p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const DisabledButton: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Wrap in span so tooltip still fires on a disabled button */}
        <span tabIndex={0}>
          <Button variant="destructive" disabled>
            Factory Reset
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Disabled — no active router connection</p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const CustomDelay: Story = {
  render: () => (
    <Tooltip delayDuration={800}>
      <TooltipTrigger asChild>
        <Button variant="outline">Delayed tooltip (800ms)</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Appears after an 800ms delay</p>
      </TooltipContent>
    </Tooltip>
  ),
};
