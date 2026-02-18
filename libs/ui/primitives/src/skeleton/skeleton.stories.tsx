import * as React from 'react';

import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonAvatar,
} from './skeleton';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof Skeleton> = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Loading placeholder components with animated shimmer effect. Provides visual feedback during content loading to improve perceived performance and reduce cumulative layout shift (CLS). Respects prefers-reduced-motion.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[300px]">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 w-[400px]">
      {/* Basic Skeleton */}
      <div>
        <h3 className="text-sm font-medium mb-2">Basic Skeleton</h3>
        <div className="flex gap-4 items-center">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>

      {/* SkeletonText */}
      <div>
        <h3 className="text-sm font-medium mb-2">SkeletonText</h3>
        <SkeletonText lines={4} lastLineWidth="50%" />
      </div>

      {/* SkeletonAvatar */}
      <div>
        <h3 className="text-sm font-medium mb-2">SkeletonAvatar (sizes)</h3>
        <div className="flex gap-4 items-center">
          <SkeletonAvatar size="sm" />
          <SkeletonAvatar size="md" />
          <SkeletonAvatar size="lg" />
          <SkeletonAvatar size="xl" />
        </div>
      </div>

      {/* SkeletonAvatar shapes */}
      <div>
        <h3 className="text-sm font-medium mb-2">SkeletonAvatar (shapes)</h3>
        <div className="flex gap-4 items-center">
          <SkeletonAvatar size="lg" shape="circle" />
          <SkeletonAvatar size="lg" shape="square" />
        </div>
      </div>
    </div>
  ),
};

export const TextVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-[400px]">
      <div>
        <h3 className="text-sm font-medium mb-2">Default (3 lines)</h3>
        <SkeletonText />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">5 lines, 40% last line</h3>
        <SkeletonText lines={5} lastLineWidth="40%" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Custom line height</h3>
        <SkeletonText lines={3} lineHeight={24} gap={12} />
      </div>
    </div>
  ),
};

export const CardVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-[400px]">
      <div>
        <h3 className="text-sm font-medium mb-2">Card with title only</h3>
        <SkeletonCard showTitle />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Full card</h3>
        <SkeletonCard showTitle showDescription showFooter />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Custom content height</h3>
        <SkeletonCard showTitle contentHeight={200} />
      </div>
    </div>
  ),
};

export const TableVariant: Story = {
  render: () => (
    <div className="w-[500px]">
      <h3 className="text-sm font-medium mb-2">Table skeleton</h3>
      <SkeletonTable rows={5} columns={4} showHeader />
    </div>
  ),
};

export const ChartVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-[400px]">
      <div>
        <h3 className="text-sm font-medium mb-2">Basic chart</h3>
        <SkeletonChart height={200} />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Chart with title and legend</h3>
        <SkeletonChart showTitle showLegend height={250} />
      </div>
    </div>
  ),
};

export const NoAnimation: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[300px]">
      <h3 className="text-sm font-medium mb-2">Static (no animation)</h3>
      <Skeleton className="h-4 w-full" animate={false} />
      <Skeleton className="h-4 w-3/4" animate={false} />
      <SkeletonText lines={3} animate={false} />
      <SkeletonAvatar size="lg" animate={false} />
    </div>
  ),
};

export const RouterDashboardExample: Story = {
  render: () => (
    <div className="w-[600px] space-y-6" aria-busy="true" aria-live="polite">
      {/* Header */}
      <div className="flex items-center gap-4">
        <SkeletonAvatar size="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <SkeletonCard showTitle contentHeight={60} />
        <SkeletonCard showTitle contentHeight={60} />
        <SkeletonCard showTitle contentHeight={60} />
      </div>

      {/* Traffic chart */}
      <div>
        <Skeleton className="h-5 w-32 mb-2" />
        <SkeletonChart height={200} showLegend />
      </div>

      {/* Devices table */}
      <div>
        <Skeleton className="h-5 w-40 mb-2" />
        <SkeletonTable rows={5} columns={4} />
      </div>
    </div>
  ),
};
