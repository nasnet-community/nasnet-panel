import type { Meta, StoryObj } from '@storybook/react';

/**
 * SettingsLayout is a local (non-exported) component in settings.tsx
 * that simply renders a TanStack Router <Outlet />.
 * We create a placeholder component for story documentation purposes.
 */
function SettingsLayoutPlaceholder() {
  return (
    <div className="min-h-screen bg-muted p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 px-2">
          <h1 className="text-2xl md:text-3xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Parent layout route for all settings pages
          </p>
        </div>
        <div
          style={{
            border: '2px dashed #6b7280',
            borderRadius: 12,
            padding: 32,
            textAlign: 'center',
            color: '#9ca3af',
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
            Child Route Outlet
          </p>
          <p style={{ fontSize: 12 }}>
            Settings sub-pages (notifications, webhooks, etc.) render here via
            TanStack Router Outlet.
          </p>
        </div>
      </div>
    </div>
  );
}

const meta: Meta<typeof SettingsLayoutPlaceholder> = {
  title: 'App/Settings/SettingsLayout',
  component: SettingsLayoutPlaceholder,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings parent layout route at "/settings". This route acts as a layout wrapper ' +
          'that renders a TanStack Router Outlet for child settings pages (notifications, ' +
          'webhooks, etc.). The SettingsLayout component is defined locally in the route file ' +
          'and is not exported.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SettingsLayoutPlaceholder>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default settings layout showing the outlet placeholder where child routes render. ' +
          'In the live app, sub-pages like Notifications and Webhooks appear in this area.',
      },
    },
  },
};

export const MobileViewport: Story = {
  name: 'Mobile Viewport',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Settings layout at mobile viewport. Content area adjusts padding ' +
          'for smaller screens.',
      },
    },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story:
          'Settings layout at desktop viewport. Full width layout with optimal spacing and readability.',
      },
    },
  },
};

export const WithAnnotation: Story = {
  name: 'With Child Routes Annotation',
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(30,30,30,0.88)',
            color: '#d4d4d4',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 11,
            lineHeight: 1.6,
            maxWidth: 280,
            pointerEvents: 'none',
          }}
        >
          <strong style={{ color: '#EFC729' }}>Child Routes</strong>
          <br />
          Known settings sub-routes:
          <br />- /settings/notifications
          <br />- /settings/notifications/webhooks
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Annotated view showing which child routes are expected to render ' +
          'within the settings layout Outlet.',
      },
    },
  },
};
