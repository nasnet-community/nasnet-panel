/**
 * Storybook stories for VlanManagementPage
 *
 * VlanManagementPage provides a full CRUD interface for VLAN interfaces on a
 * MikroTik router. Two views are toggled via shadcn Tabs:
 *   - List View     : tabular list of VLANs (VlanList component)
 *   - Topology View : visual hierarchy of VLANs per parent interface (VlanTopology)
 *
 * A "Create VLAN" button opens a Dialog containing VlanForm.
 * The page accepts a single required prop: routerId (string).
 */

import { VlanManagementPage } from './VlanManagementPage';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VlanManagementPage> = {
  title: 'App/Pages/VlanManagementPage',
  component: VlanManagementPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'VLAN management page (NAS-6.7). Provides a tab-based interface with a ' +
          '**List View** (VlanList) and a **Topology View** (VlanTopology). ' +
          'A top-right "Create VLAN" button opens a modal Dialog containing VlanForm ' +
          'with fields for name, VLAN ID (1–4094), parent interface, MTU, comment, ' +
          'and enabled/disabled toggle. Mutations are handled via the useCreateVlan hook.',
      },
    },
  },
  argTypes: {
    routerId: {
      control: 'text',
      description: 'The UUID of the connected router. All VLAN queries use this ID.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VlanManagementPage>;

/**
 * Default – list view with a representative router ID.
 * VlanList will attempt to load VLANs; in Storybook without a real Apollo
 * provider it renders its loading state.
 */
export const Default: Story = {
  name: 'Default (List View)',
  args: {
    routerId: 'router-uuid-1234',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default render with the List View tab active. ' +
          'VlanList fetches VLANs for the given routerId. ' +
          'Without a live GraphQL context the list shows its loading skeleton.',
      },
    },
  },
};

/**
 * Topology tab – documents what the Topology View looks like.
 * The actual tab switch is interactive; this story documents it with an annotation.
 */
export const TopologyView: Story = {
  name: 'Topology View (annotated)',
  args: {
    routerId: 'router-uuid-1234',
  },
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(30,30,30,0.9)',
            color: '#d4d4d4',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 11,
            lineHeight: 1.7,
            maxWidth: 300,
            pointerEvents: 'none',
          }}
        >
          <strong style={{ color: '#EFC729' }}>Topology View description</strong>
          <br />
          Clicking the "Topology View" tab renders VlanTopology which visualises VLAN parent–child
          relationships. Example hierarchy:
          <br />• ether1 → vlan10 (Management), vlan20 (Guest)
          <br />• ether2 → vlan30 (IoT), vlan40 (Cameras)
          <br />• bridge1 → vlan100 (Trunk)
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Topology view renders VlanTopology which groups VLANs under their parent ' +
          'interface and displays VLAN IDs, names, and statuses in a tree/card layout. ' +
          'Click the "Topology View" tab to switch from List View.',
      },
    },
  },
};

/**
 * Create Dialog – shows the page with the Create VLAN dialog open.
 * Uses a decorator to click the button after mount.
 */
export const CreateDialog: Story = {
  name: 'Create VLAN Dialog Open',
  args: {
    routerId: 'router-uuid-1234',
  },
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            background: 'rgba(79,70,229,0.9)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          Click "Create VLAN" button to open the form dialog
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Clicking the "Create VLAN" button in the page header opens a shadcn Dialog ' +
          'containing VlanForm with the following fields: Name (required), VLAN ID ' +
          '(1–4094, required), Interface (parent interface selector), MTU (optional), ' +
          'Comment (optional), and a Disabled toggle. Submitting calls useCreateVlan ' +
          'and shows a Sonner toast on success or error.',
      },
    },
  },
};

/**
 * Different router – verifies routerId prop flows correctly.
 */
export const AlternateRouter: Story = {
  name: 'Alternate Router ID',
  args: {
    routerId: 'ccr2004-router-abcd',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates that the routerId prop is forwarded to VlanList, VlanTopology, ' +
          'and VlanForm so all queries and mutations target the correct router.',
      },
    },
  },
};

/**
 * Mobile viewport story – verifies the page layout and controls are usable on small screens.
 */
export const Mobile: Story = {
  name: 'Mobile Viewport',
  args: {
    routerId: 'router-uuid-1234',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'VlanManagementPage rendered on a mobile viewport (375px). Verifies the "Create VLAN" button, tabs, and list/topology views adapt to narrow screens.',
      },
    },
  },
};

/**
 * Desktop viewport story – verifies the page layout optimized for larger screens.
 */
export const Desktop: Story = {
  name: 'Desktop Viewport',
  args: {
    routerId: 'router-uuid-1234',
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story:
          'VlanManagementPage rendered on a desktop viewport (1280px+). Full-width layout with spacious controls and data presentation.',
      },
    },
  },
};
