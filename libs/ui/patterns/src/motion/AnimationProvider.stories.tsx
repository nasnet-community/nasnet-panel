/**
 * AnimationProvider Storybook Stories
 *
 * Demonstrates the AnimationProvider context, MotionConfig override component,
 * and the useAnimation hook utilities used across the app's motion system.
 *
 * @module @nasnet/ui/patterns/motion
 */

import * as React from 'react';

import { motion } from 'framer-motion';

import { AnimationProvider, MotionConfig, useAnimationOptional } from './AnimationProvider';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Displays live values from the AnimationProvider context.
 * Uses useAnimationOptional so it degrades gracefully when no provider is present.
 */
function AnimationContextDisplay() {
  const ctx = useAnimationOptional();

  if (!ctx) {
    return (
      <div className="rounded border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        No AnimationProvider found in tree.
      </div>
    );
  }

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      <dt className="font-medium text-muted-foreground">reducedMotion</dt>
      <dd className="font-mono">{String(ctx.reducedMotion)}</dd>

      <dt className="font-medium text-muted-foreground">animationsEnabled</dt>
      <dd className="font-mono">{String(ctx.animationsEnabled)}</dd>

      <dt className="font-medium text-muted-foreground">platform</dt>
      <dd className="font-mono">{ctx.platform}</dd>

      <dt className="font-medium text-muted-foreground">getDuration(300)</dt>
      <dd className="font-mono">{ctx.getDuration(300)}ms</dd>
    </dl>
  );
}

/**
 * A simple animated box that shows enter/exit effects driven by the context.
 */
function AnimatedBox({ label }: { label: string }) {
  const ctx = useAnimationOptional();
  const reducedMotion = ctx?.reducedMotion ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.4, ease: 'easeOut' }}
      className="rounded-lg border border-border bg-card px-6 py-4 text-center shadow-sm"
    >
      <span className="text-sm font-medium">{label}</span>
    </motion.div>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof AnimationProvider> = {
  title: 'Patterns/Motion/AnimationProvider',
  component: AnimationProvider,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## AnimationProvider

Provides animation context throughout the app via React Context.
Integrates with the UI store for reduced-motion preferences and with
platform detection for responsive animation timing.

### Key Exports
- **AnimationProvider** – wraps the app tree (place high in providers.tsx)
- **MotionConfig** – override motion settings for a subtree
- **useAnimation** – hook that throws if used outside provider
- **useAnimationOptional** – hook that returns null when no provider is present

### Context Values
| Value | Type | Description |
|-------|------|-------------|
| \`reducedMotion\` | \`boolean\` | Whether reduced motion is preferred |
| \`animationsEnabled\` | \`boolean\` | Inverse of reducedMotion |
| \`platform\` | \`Platform\` | Current detected platform |
| \`tokens\` | \`AnimationTokens\` | Platform-adjusted timing tokens |
| \`getVariant(full, reduced)\` | \`fn\` | Returns appropriate Framer Motion variant |
| \`getTransition(type)\` | \`fn\` | Returns zero-duration transition when reduced |
| \`getDuration(ms)\` | \`fn\` | Returns 0 when reduced motion is on |
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AnimationProvider>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Basic usage – wraps children and exposes animation context.
 * The context display shows live values resolved by the provider.
 */
export const Default: Story = {
  render: () => (
    <AnimationProvider>
      <div className="w-80 space-y-4 rounded-xl border border-border bg-background p-6 shadow">
        <h2 className="text-base font-semibold">Animation Context</h2>
        <AnimationContextDisplay />
        <AnimatedBox label="Animated child" />
      </div>
    </AnimationProvider>
  ),
};

/**
 * MotionConfig with reduced motion forced on.
 * All animation durations resolve to 0ms and variants use instant fades.
 */
export const ReducedMotionForced: Story = {
  render: () => (
    <AnimationProvider>
      <MotionConfig reducedMotion>
        <div className="w-80 space-y-4 rounded-xl border border-destructive/30 bg-background p-6 shadow">
          <h2 className="text-base font-semibold">
            MotionConfig (reduced motion forced)
          </h2>
          <AnimationContextDisplay />
          <AnimatedBox label="Instant transition" />
        </div>
      </MotionConfig>
    </AnimationProvider>
  ),
};

/**
 * MotionConfig with reduced motion forced off, even if the OS preference is on.
 * Useful for demo sections or marketing pages that must always animate.
 */
export const MotionConfigAnimationsEnabled: Story = {
  render: () => (
    <AnimationProvider>
      <MotionConfig reducedMotion={false}>
        <div className="w-80 space-y-4 rounded-xl border border-primary/30 bg-background p-6 shadow">
          <h2 className="text-base font-semibold">
            MotionConfig (animations forced on)
          </h2>
          <AnimationContextDisplay />
          <AnimatedBox label="Always animates" />
        </div>
      </MotionConfig>
    </AnimationProvider>
  ),
};

/**
 * Nested MotionConfig – inner config overrides the outer provider's settings.
 * The outer section has animations on; the inner section forces them off.
 */
export const NestedMotionConfig: Story = {
  render: () => (
    <AnimationProvider>
      <div className="space-y-6">
        {/* Outer – animations enabled */}
        <div className="w-80 rounded-xl border border-border bg-background p-6 shadow">
          <h2 className="mb-3 text-base font-semibold">Outer provider</h2>
          <AnimationContextDisplay />
          <div className="mt-3">
            <AnimatedBox label="Outer animated box" />
          </div>
        </div>

        {/* Inner override – reduced motion */}
        <MotionConfig reducedMotion>
          <div className="w-80 rounded-xl border border-amber-400/40 bg-amber-50/30 p-6 shadow dark:bg-amber-900/10">
            <h2 className="mb-3 text-base font-semibold">
              Inner MotionConfig (reduced)
            </h2>
            <AnimationContextDisplay />
            <div className="mt-3">
              <AnimatedBox label="Inner instant box" />
            </div>
          </div>
        </MotionConfig>
      </div>
    </AnimationProvider>
  ),
};

/**
 * Missing provider – demonstrates graceful degradation with useAnimationOptional.
 * The AnimationContextDisplay renders an error state instead of throwing.
 */
export const NoProvider: Story = {
  render: () => (
    <div className="w-80 rounded-xl border border-border bg-background p-6 shadow">
      <h2 className="mb-3 text-base font-semibold">No Provider</h2>
      <AnimationContextDisplay />
    </div>
  ),
};

/**
 * Multiple sibling providers – each has independent state.
 * Useful for Storybook decorators or isolated feature sections.
 */
export const MultipleProviders: Story = {
  render: () => (
    <div className="flex gap-4">
      <AnimationProvider>
        <div className="w-60 rounded-xl border border-border bg-background p-4 shadow">
          <h2 className="mb-2 text-sm font-semibold">Provider A</h2>
          <AnimationContextDisplay />
        </div>
      </AnimationProvider>

      <AnimationProvider>
        <MotionConfig reducedMotion>
          <div className="w-60 rounded-xl border border-border bg-background p-4 shadow">
            <h2 className="mb-2 text-sm font-semibold">Provider B (reduced)</h2>
            <AnimationContextDisplay />
          </div>
        </MotionConfig>
      </AnimationProvider>
    </div>
  ),
};
