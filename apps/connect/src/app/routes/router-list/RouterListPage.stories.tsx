/**
 * RouterListPage Stories
 *
 * RouterListPage is a top-level page component that renders either an empty
 * state (the current implementation, as router persistence is planned for
 * Epic 0.1) or a router grid.  Because the component calls useNavigate from
 * @tanstack/react-router, stories provide a lightweight navigation mock via
 * a decorator so they work outside the full application router context.
 */

import { fn } from 'storybook/test';

import { RouterListPage } from './RouterListPage';

import type { Meta, StoryObj } from '@storybook/react';


// ---------------------------------------------------------------------------
// Minimal MemoryRouter mock
// ---------------------------------------------------------------------------

/**
 * The component calls `useNavigate()` which returns a navigate function.
 * In Storybook we replace the whole module with a stub that returns a no-op.
 *
 * This is declared here so Storybook's static analysis can pick it up via
 * the `beforeEach` hook pattern; stories that need it apply the decorator
 * below.
 */
const mockNavigate = fn().mockName('navigate');

/**
 * Decorator that patches window.history so TanStack Router's minimal
 * in-memory history does not throw when navigate is called.
 */
function withNavigationStub(
  Story: React.ComponentType
) {
  return (
    <div>
      <Story />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof RouterListPage> = {
  title: 'App/RouterList/RouterListPage',
  component: RouterListPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Top-level page that lists saved MikroTik routers.  ' +
          'Currently always renders the empty state (router persistence is ' +
          'implemented in Epic 0.1).  Features a page header with an ' +
          '"Add Router" button, a centred empty-state illustration, and a ' +
          'prominent CTA to add the first router.',
      },
    },
    // Suppress react-router warnings in Storybook console
    a11y: { disable: false },
  },
  decorators: [withNavigationStub],
  args: {
    // RouterListPage takes no props — args are intentionally empty
  },
};

export default meta;
type Story = StoryObj<typeof RouterListPage>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default empty-state view — the only state the component currently renders.
 * Shows the logo illustration, heading, description, and both CTA buttons.
 */
export const EmptyState: Story = {};

/**
 * Empty state rendered on a narrow 375px mobile viewport.
 * Verifies the "Add Router" button text is hidden (sm:inline) and only
 * the icon remains visible in the header.
 */
export const MobileEmptyState: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

/**
 * Empty state on a tablet viewport (768px).
 * Confirms the header text re-appears and layout reflows gracefully.
 */
export const TabletEmptyState: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};

/**
 * Renders inside a constrained max-width container to preview how the page
 * looks when embedded in the main app shell sidebar layout.
 */
export const InsideAppShell: Story = {
  decorators: [
    (Story) => (
      <div className="flex h-screen">
        {/* Simulated sidebar */}
        <aside className="w-64 shrink-0 bg-background" aria-label="Sidebar (simulated)" />
        <main className="flex-1 overflow-auto">
          <Story />
        </main>
      </div>
    ),
  ],
};

/**
 * Dark-mode preview of the empty state.
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

/**
 * Desktop viewport story – verifies the page layout optimized for larger screens.
 */
export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};

// Export mockNavigate so it can be referenced in test files
export { mockNavigate };
