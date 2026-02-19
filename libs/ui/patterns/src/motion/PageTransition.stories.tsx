/**
 * PageTransition Storybook Stories
 *
 * Demonstrates PageTransition and PageTransitionWrapper – the Framer Motion
 * components that animate route changes in NasNetConnect.
 *
 * @module @nasnet/ui/patterns/motion
 */

import * as React from 'react';

import { motion } from 'framer-motion';

import { PageTransitionWrapper } from './PageTransition';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Note on PageTransition vs PageTransitionWrapper
// ============================================================================
// PageTransition relies on @tanstack/react-router (useRouterState) which is
// not available in Storybook. We therefore showcase PageTransitionWrapper,
// which is the simpler, router-agnostic variant, and demonstrate how
// PageTransition would be configured via its props.

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof PageTransitionWrapper> = {
  title: 'Patterns/Motion/PageTransition',
  component: PageTransitionWrapper,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## PageTransition / PageTransitionWrapper

Smooth animated transitions between route pages using Framer Motion.

### Components
| Component | Use case |
|-----------|----------|
| \`PageTransition\` | Root-level wrapper in \`__root.tsx\` — uses \`useRouterState\` to key animations on the pathname |
| \`PageTransitionWrapper\` | Per-page wrapper — animates without managing exit animations or router state |

### Variants
| Variant | Effect |
|---------|--------|
| \`fade\` | Simple opacity fade (default) |
| \`slideUp\` | Slides up from below while fading in |
| \`none\` | Instant transition (reduced-motion safe) |

### Reduced Motion
Both components check \`useAnimationOptional()\`. When \`reducedMotion\` is
\`true\` (or the OS preference is set), the \`reducedMotionFade\` variant
(zero-duration opacity change) is used automatically.

### Props
\`\`\`tsx
<PageTransition
  variant="slideUp"   // fade | slideUp | none
  mode="wait"         // wait | sync | popLayout
  className="..."
>
  <Outlet />
</PageTransition>

<PageTransitionWrapper
  variant="fade"
  pageKey="dashboard"
  className="..."
>
  <DashboardContent />
</PageTransitionWrapper>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['fade', 'slideUp', 'none'],
      description: 'Animation variant to use',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes applied to the motion div',
    },
    pageKey: {
      control: 'text',
      description: 'Unique key that re-triggers the animation when changed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageTransitionWrapper>;

// ============================================================================
// Mock page content
// ============================================================================

function MockPage({
  title,
  color = 'bg-card',
}: {
  title: string;
  color?: string;
}) {
  return (
    <div
      className={`w-72 rounded-xl border border-border ${color} p-6 shadow-sm`}
    >
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This simulates page content that animates in on route change.
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Router online — 99.9% uptime
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400" />3 firewall rules
          pending
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          WireGuard VPN active
        </li>
      </ul>
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default fade transition – the most common variant used throughout the app.
 */
export const FadeVariant: Story = {
  args: {
    variant: 'fade',
    pageKey: 'dashboard',
  },
  render: (args) => (
    <PageTransitionWrapper {...args}>
      <MockPage title="Dashboard" />
    </PageTransitionWrapper>
  ),
};

/**
 * SlideUp variant – content enters from slightly below with an opacity fade.
 * Used for secondary pages and sub-routes.
 */
export const SlideUpVariant: Story = {
  args: {
    variant: 'slideUp',
    pageKey: 'network',
  },
  render: (args) => (
    <PageTransitionWrapper {...args}>
      <MockPage title="Network" />
    </PageTransitionWrapper>
  ),
};

/**
 * None variant – instant transition with no animation.
 * Equivalent to what is rendered when reduced motion is preferred.
 */
export const NoAnimation: Story = {
  args: {
    variant: 'none',
    pageKey: 'firewall',
  },
  render: (args) => (
    <PageTransitionWrapper {...args}>
      <MockPage title="Firewall" />
    </PageTransitionWrapper>
  ),
};

/**
 * Interactive page switcher – click buttons to swap the pageKey and watch
 * the transition re-trigger with the chosen variant.
 */
export const InteractivePageSwitch: Story = {
  render: () => {
    const pages = [
      { key: 'dashboard', label: 'Dashboard', color: 'bg-card' },
      { key: 'network', label: 'Network', color: 'bg-blue-50 dark:bg-blue-950/30' },
      { key: 'firewall', label: 'Firewall', color: 'bg-orange-50 dark:bg-orange-950/30' },
    ] as const;

    const [currentPage, setCurrentPage] = React.useState<string>(pages[0].key);
    const [variant, setVariant] = React.useState<'fade' | 'slideUp' | 'none'>('fade');

    const page = pages.find((p) => p.key === currentPage) ?? pages[0];

    return (
      <div className="flex flex-col items-center gap-5">
        {/* Variant selector */}
        <div className="flex gap-2">
          {(['fade', 'slideUp', 'none'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                variant === v
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:bg-muted'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Page switcher */}
        <div className="flex gap-2">
          {pages.map((p) => (
            <button
              key={p.key}
              onClick={() => setCurrentPage(p.key)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                currentPage === p.key
                  ? 'border-primary bg-primary/10 font-medium text-primary'
                  : 'hover:bg-muted'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Animated content */}
        <PageTransitionWrapper
          key={currentPage}
          pageKey={currentPage}
          variant={variant}
        >
          <MockPage title={page.label} color={page.color} />
        </PageTransitionWrapper>
      </div>
    );
  },
};

/**
 * Custom Framer Motion variants passed directly to PageTransitionWrapper.
 * Shows how to bypass the built-in variant map for bespoke animations.
 */
export const CustomVariants: Story = {
  render: () => {
    const scaleVariants = {
      initial: { opacity: 0, scale: 0.92 },
      animate: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
      },
    };

    return (
      <motion.div
        variants={scaleVariants}
        initial="initial"
        animate="animate"
      >
        <MockPage title="Custom scale-in animation" />
      </motion.div>
    );
  },
};

/**
 * Multiple simultaneous wrappers showing independent keying.
 * Each wrapper animates independently when its pageKey prop changes.
 */
export const MultipleWrappers: Story = {
  render: () => (
    <div className="flex gap-4">
      <PageTransitionWrapper pageKey="left-panel" variant="fade">
        <MockPage title="Left Panel" />
      </PageTransitionWrapper>

      <PageTransitionWrapper pageKey="right-panel" variant="slideUp">
        <MockPage title="Right Panel" />
      </PageTransitionWrapper>
    </div>
  ),
};
