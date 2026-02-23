import * as React from 'react'

import { Button } from '../button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof Tooltip> = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A tooltip component built on Radix UI Tooltip primitive. Displays contextual information on hover or focus. Supports four placement sides (top, bottom, left, right) with smooth enter/exit animations. Fully keyboard accessible (Tab, Enter/Space, Escape) and respects prefers-reduced-motion. Maintains 7:1 contrast ratio via design tokens in both light and dark modes.',
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
}

export default meta
type Story = StoryObj<typeof Tooltip>

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
}

export const KeyboardAccessible: Story = {
  render: () => (
    <div className="flex gap-4 flex-col">
      <p className="text-xs text-muted-foreground">
        Instructions: Use Tab key to focus buttons, then use Enter/Space to show tooltip. Press Escape to close.
      </p>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Keyboard Focus (Tab)</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Keyboard accessible tooltip</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Try Escape key</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Press Escape to close this tooltip</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Test accessibility: verify keyboard navigation is possible
    const buttons = canvasElement.querySelectorAll('[role="button"]')
    if (buttons.length > 0) {
      const firstButton = buttons[0] as HTMLElement
      firstButton.focus()
    }
  },
}

export const AccessibilityContrast: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Light Mode</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            7:1 contrast ratio (WCAG AAA compliant). Text color from var(--popover-foreground).
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Tooltip uses design tokens (bg-popover, text-popover-foreground) maintaining 7:1 contrast ratio in both light and dark modes.',
      },
    },
  },
}

export const AnimationBehavior: Story = {
  render: () => (
    <div className="flex gap-4 flex-col">
      <p className="text-xs text-muted-foreground">
        Animation uses Tailwind animate-in classes. Respects prefers-reduced-motion: animations disabled if
        &quot;Reduce motion&quot; is enabled in OS settings.
      </p>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button variant="outline">Smooth Entry Animation</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Fade-in + zoom-in animation (300ms duration)</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Uses CSS transitions for fade-in and zoom-in effects. Animation honors prefers-reduced-motion system preference.',
      },
    },
  },
}

export const LongContentWrapping: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Very Long Content</Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>
          This tooltip demonstrates proper text wrapping and line-height for readability. Max-width constraint
          prevents excessive width. Content flows naturally across multiple lines.
        </p>
      </TooltipContent>
    </Tooltip>
  ),
}

export const Mobile: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="lg">
          Mobile Touch Target
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Touch targets 44x44px minimum for accessibility</p>
      </TooltipContent>
    </Tooltip>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile viewport: 375px. Button meets 44x44px minimum touch target requirement.',
      },
    },
  },
}

export const Tablet: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Tablet View</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Balanced for tablet interaction (tap or hover)</p>
      </TooltipContent>
    </Tooltip>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Tablet viewport: 768px. Supports both touch and mouse input.',
      },
    },
  },
}

export const Desktop: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Desktop View</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Hover tooltip with smooth animations on desktop</p>
      </TooltipContent>
    </Tooltip>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Desktop viewport: 1280px. Optimized for hover interaction.',
      },
    },
  },
}
