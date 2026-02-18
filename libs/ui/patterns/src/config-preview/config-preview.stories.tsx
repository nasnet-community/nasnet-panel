/**
 * ConfigPreview Storybook Stories
 *
 * Stories demonstrating ConfigPreview component features:
 * - Syntax highlighting for RouterOS
 * - Diff view with additions/deletions
 * - Collapsible sections
 * - Copy and download actions
 * - Platform presenters (desktop/mobile)
 *
 * @see NAS-4A.21 - Build Config Preview Component
 */

import * as React from 'react';


import { ConfigPreview } from './config-preview';
import { ConfigPreviewDesktop } from './config-preview-desktop';
import { ConfigPreviewMobile } from './config-preview-mobile';

import type { Meta, StoryObj } from '@storybook/react';

// Sample RouterOS scripts
const SIMPLE_SCRIPT = `/interface ethernet
set [ find default-name=ether1 ] name=ether1-wan
set [ find default-name=ether2 ] name=ether2-lan`;

const FULL_SCRIPT = `# NasNetConnect Generated Configuration
# Router: home-router
# Date: 2026-02-03

/interface ethernet
set [ find default-name=ether1 ] name=ether1-wan
set [ find default-name=ether2 ] name=ether2-lan

/interface bridge
add name=bridge admin-mac=48:8F:5A:00:00:01 auto-mac=no

/ip address
add address=192.168.88.1/24 interface=bridge network=192.168.88.0

/ip dhcp-server
add address-pool=default-dhcp interface=bridge name=dhcp1

/ip firewall filter
add action=accept chain=input connection-state=established,related
add action=drop chain=input in-interface=ether1-wan

/ip firewall nat
add action=masquerade chain=srcnat out-interface=ether1-wan

/system identity
set name=home-router`;

const OLD_SCRIPT = `/interface ethernet
set [ find default-name=ether1 ] name=ether1-wan

/ip address
add address=192.168.1.1/24 interface=ether1-wan`;

const NEW_SCRIPT = `/interface ethernet
set [ find default-name=ether1 ] name=ether1-wan
set [ find default-name=ether2 ] name=ether2-lan

/ip address
add address=192.168.88.1/24 interface=bridge network=192.168.88.0

/ip firewall filter
add action=accept chain=input connection-state=established,related`;

const LONG_SCRIPT = Array.from(
  { length: 100 },
  (_, i) =>
    `/ip firewall filter
add action=accept chain=forward comment="Rule ${i + 1}" dst-address=192.168.${i}.0/24`
).join('\n\n');

const meta: Meta<typeof ConfigPreview> = {
  title: 'Patterns/ConfigPreview',
  component: ConfigPreview,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
RouterOS configuration preview component with syntax highlighting, diff view, and collapsible sections.

## Features
- **Syntax Highlighting**: RouterOS-specific highlighting for commands, keywords, IPs, variables
- **Diff View**: Side-by-side comparison showing additions and deletions
- **Collapsible Sections**: Group commands by section for easier navigation
- **Copy & Download**: One-click copy to clipboard or download as .rsc file
- **Platform Responsive**: Desktop (Card layout) and Mobile (simplified) presenters

## Usage
\`\`\`tsx
import { ConfigPreview } from '@nasnet/ui/patterns';

// Basic usage
<ConfigPreview
  script={routerOsConfig}
  title="Configuration Preview"
/>

// With diff view
<ConfigPreview
  script={newConfig}
  previousScript={oldConfig}
  showDiff
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    script: {
      description: 'The RouterOS script to display',
      control: 'text',
    },
    previousScript: {
      description: 'Previous script for diff comparison',
      control: 'text',
    },
    showDiff: {
      description: 'Show diff view instead of plain script',
      control: 'boolean',
    },
    title: {
      description: 'Title for the preview panel',
      control: 'text',
    },
    collapsible: {
      description: 'Show section collapse controls',
      control: 'boolean',
    },
    showLineNumbers: {
      description: 'Show line numbers',
      control: 'boolean',
    },
    maxHeight: {
      description: 'Maximum height before scrolling',
      control: 'text',
    },
    presenter: {
      description: 'Force specific presenter',
      control: 'select',
      options: ['auto', 'mobile', 'desktop'],
    },
    routerName: {
      description: 'Router name for download filename',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfigPreview>;

/**
 * Default configuration preview with syntax highlighting.
 */
export const Default: Story = {
  args: {
    script: SIMPLE_SCRIPT,
    title: 'Configuration Preview',
    showLineNumbers: true,
  },
};

/**
 * Full configuration with multiple sections.
 * Each section starts with a command path (e.g., /interface, /ip address)
 * and can be collapsed/expanded.
 */
export const WithSections: Story = {
  args: {
    script: FULL_SCRIPT,
    title: 'Router Configuration',
    collapsible: true,
    showLineNumbers: true,
    routerName: 'home-router',
  },
};

/**
 * Diff view showing changes between two configurations.
 * Green lines indicate additions, red lines indicate deletions.
 */
export const DiffView: Story = {
  args: {
    script: NEW_SCRIPT,
    previousScript: OLD_SCRIPT,
    showDiff: true,
    title: 'Configuration Changes',
    showLineNumbers: true,
  },
};

/**
 * Long script demonstrating scrolling behavior.
 * maxHeight limits the visible area with overflow scroll.
 */
export const LongScript: Story = {
  args: {
    script: LONG_SCRIPT,
    title: 'Firewall Rules (500+ lines)',
    showLineNumbers: true,
    collapsible: true,
    maxHeight: '400px',
  },
};

/**
 * Without line numbers for a cleaner look.
 */
export const WithoutLineNumbers: Story = {
  args: {
    script: SIMPLE_SCRIPT,
    title: 'Clean Preview',
    showLineNumbers: false,
  },
};

/**
 * Mobile presenter with simplified controls.
 * Buttons are stacked vertically with 44px touch targets.
 */
export const MobileVariant: Story = {
  args: {
    script: FULL_SCRIPT,
    title: 'Mobile Config',
    presenter: 'mobile',
    showLineNumbers: false,
  },
  globals: {
    viewport: {
      value: 'mobile1',
      isRotated: false
    }
  },
};

/**
 * Desktop presenter with full feature set.
 * Card layout with header toolbar and collapsible sections.
 */
export const DesktopVariant: Story = {
  args: {
    script: FULL_SCRIPT,
    title: 'Desktop Config',
    presenter: 'desktop',
    collapsible: true,
    showLineNumbers: true,
  },
};

/**
 * Empty script edge case.
 */
export const EmptyScript: Story = {
  args: {
    script: '',
    title: 'Empty Configuration',
  },
};

/**
 * No changes diff - when previous equals current.
 * Shows all lines as unchanged.
 */
export const NoChangesDiff: Story = {
  args: {
    script: SIMPLE_SCRIPT,
    previousScript: SIMPLE_SCRIPT,
    showDiff: true,
    title: 'No Changes',
  },
};

/**
 * Dark theme variant - styles adapt to dark mode.
 */
export const DarkTheme: Story = {
  args: {
    script: FULL_SCRIPT,
    title: 'Dark Theme Preview',
    collapsible: true,
    showLineNumbers: true,
  },
  decorators: [
    (Story) => (
      <div className="dark bg-background p-4 rounded-lg">
        <Story />
      </div>
    ),
  ],
  globals: {
    backgrounds: {
      value: "dark"
    }
  },
};

/**
 * Script with variables and special characters.
 * Tests syntax highlighting for complex RouterOS syntax.
 */
export const ComplexSyntax: Story = {
  args: {
    script: `# Variables and loops
:local subnet "192.168.88"
:for i from=1 to=10 do={
  /ip firewall address-list add list=allowed address="$subnet.$i"
}

# Interface configuration
/interface ethernet
set [ find default-name=ether1 ] name="WAN - \\"ISP\\" Connection"

# Boolean values
/ip service
set telnet disabled=yes
set ftp disabled=no
set www port=8080`,
    title: 'Complex Syntax',
    showLineNumbers: true,
  },
};

/**
 * Interactive example with all callbacks wired up.
 */
export const Interactive: Story = {
  args: {
    script: FULL_SCRIPT,
    title: 'Interactive Preview',
    collapsible: true,
    showLineNumbers: true,
    routerName: 'demo-router',
  },
  render: (args) => (
    <ConfigPreview
      {...args}
      onCopy={() => console.log('[ConfigPreview] Copy clicked')}
      onDownload={() => console.log('[ConfigPreview] Download clicked')}
    />
  ),
};

/**
 * Desktop presenter standalone story.
 */
export const DesktopPresenter: StoryObj<typeof ConfigPreviewDesktop> = {
  render: () => (
    <ConfigPreviewDesktop
      script={FULL_SCRIPT}
      title="Desktop Presenter"
      collapsible
      showLineNumbers
      routerName="test-router"
    />
  ),
};

/**
 * Mobile presenter standalone story.
 */
export const MobilePresenter: StoryObj<typeof ConfigPreviewMobile> = {
  render: () => (
    <div className="max-w-sm mx-auto">
      <ConfigPreviewMobile
        script={FULL_SCRIPT}
        title="Mobile Presenter"
        maxHeight={400}
      />
    </div>
  ),
};
