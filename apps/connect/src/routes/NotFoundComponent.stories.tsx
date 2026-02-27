import type { Meta, StoryObj } from '@storybook/react';

function NotFoundComponent() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-muted text-6xl font-bold">404</h1>
        <p className="text-muted-foreground mt-4 text-xl">Page not found</p>
        <a
          href="/"
          className="bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-ring mt-6 inline-block min-h-[44px] rounded px-4 py-2 focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

const meta: Meta<typeof NotFoundComponent> = {
  title: 'App/Root/NotFound',
  component: NotFoundComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '404 Not Found component displayed when user navigates to a non-existent route.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default 404 Not Found state
 */
export const Default: Story = {
  render: () => <NotFoundComponent />,
};

/**
 * 404 page on mobile view
 */
export const MobileView: Story = {
  render: () => <NotFoundComponent />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          '404 Not Found page optimized for mobile devices with centered layout and accessible button.',
      },
    },
  },
};

/**
 * 404 page on tablet view
 */
export const TabletView: Story = {
  render: () => <NotFoundComponent />,
  parameters: {
    viewport: {
      defaultViewport: 'ipad',
    },
    docs: {
      description: {
        story: '404 Not Found page on tablet sized viewport.',
      },
    },
  },
};

/**
 * 404 page on desktop view
 */
export const Desktop: Story = {
  render: () => <NotFoundComponent />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story: '404 Not Found page optimized for desktop devices with centered layout.',
      },
    },
  },
};
