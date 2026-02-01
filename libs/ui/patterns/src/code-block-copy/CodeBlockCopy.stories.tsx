/**
 * Storybook stories for CodeBlockCopy component
 * @see NAS-4.23 - Implement Clipboard Integration
 */

import type { Meta, StoryObj } from '@storybook/react';

import { CodeBlockCopy } from './CodeBlockCopy';

const routerosFirewallRule = `/ip firewall filter
add chain=forward action=accept protocol=tcp dst-port=80,443 comment="Allow HTTP/HTTPS"
add chain=forward action=drop in-interface=ether1 comment="Drop everything else from WAN"`;

const routerosScript = `# VPN Auto-Connect Script
# Runs every 5 minutes to ensure VPN connection

:local vpnInterface "vpn-tunnel1"
:local vpnStatus [/interface get $vpnInterface running]

:if ($vpnStatus = false) do={
    :log warning "VPN disconnected, attempting reconnect..."
    /interface enable $vpnInterface
    :delay 5s
    :if ([/interface get $vpnInterface running] = true) do={
        :log info "VPN reconnected successfully"
    } else={
        :log error "VPN reconnection failed"
    }
}`;

const jsonConfig = `{
  "server": {
    "host": "192.168.88.1",
    "port": 8080,
    "ssl": true
  },
  "vpn": {
    "enabled": true,
    "protocol": "wireguard",
    "peers": [
      {
        "publicKey": "xV8b2kP9mN3qR7wY1zL4cD6hF0jT5uA=",
        "allowedIPs": ["0.0.0.0/0"]
      }
    ]
  }
}`;

const shellScript = `#!/bin/bash
# Backup RouterOS configuration

ROUTER_IP="192.168.88.1"
BACKUP_DIR="/backups/routeros"
DATE=$(date +%Y%m%d)

ssh admin@$ROUTER_IP "/export file=backup-$DATE"
scp admin@$ROUTER_IP:backup-$DATE.rsc "$BACKUP_DIR/"

echo "Backup completed: $BACKUP_DIR/backup-$DATE.rsc"`;

const meta: Meta<typeof CodeBlockCopy> = {
  title: 'Patterns/Clipboard/CodeBlockCopy',
  component: CodeBlockCopy,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Displays code/configuration blocks with copy functionality.

## Features
- Copy button in top-right corner
- Preserves formatting and comments
- Optional line numbers
- Language label hints
- Optional max height with scroll
- Toast notification on copy

## Usage
\`\`\`tsx
import { CodeBlockCopy } from '@nasnet/ui/patterns';

<CodeBlockCopy
  code={firewallConfig}
  language="routeros"
  title="Firewall Rules"
  showLineNumbers
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    language: {
      control: 'select',
      options: ['routeros', 'json', 'yaml', 'shell', 'text'],
      description: 'Language for styling hints',
    },
    showLineNumbers: {
      control: 'boolean',
      description: 'Show line numbers',
    },
    showToast: {
      control: 'boolean',
      description: 'Show toast notification on copy',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CodeBlockCopy>;

/**
 * RouterOS firewall rules
 */
export const RouterOSFirewall: Story = {
  args: {
    code: routerosFirewallRule,
    language: 'routeros',
    title: 'Firewall Rules',
  },
};

/**
 * RouterOS script with line numbers
 */
export const RouterOSScriptWithLineNumbers: Story = {
  args: {
    code: routerosScript,
    language: 'routeros',
    title: 'VPN Auto-Connect Script',
    showLineNumbers: true,
  },
};

/**
 * JSON configuration
 */
export const JSONConfig: Story = {
  args: {
    code: jsonConfig,
    language: 'json',
    title: 'Configuration',
  },
};

/**
 * Shell script
 */
export const ShellScript: Story = {
  args: {
    code: shellScript,
    language: 'shell',
    title: 'Backup Script',
    showLineNumbers: true,
  },
};

/**
 * Plain text without title
 */
export const PlainText: Story = {
  args: {
    code: '192.168.1.1\n192.168.1.2\n192.168.1.3\n192.168.1.4\n192.168.1.5',
    language: 'text',
  },
  parameters: {
    docs: {
      description: {
        story: 'Plain text without title or language label.',
      },
    },
  },
};

/**
 * With max height and scroll
 */
export const WithMaxHeight: Story = {
  args: {
    code: routerosScript,
    language: 'routeros',
    title: 'Long Script',
    showLineNumbers: true,
    maxHeight: 200,
  },
  parameters: {
    docs: {
      description: {
        story: 'Code block with limited height and scroll.',
      },
    },
  },
};

/**
 * Without toast notification
 */
export const WithoutToast: Story = {
  args: {
    code: routerosFirewallRule,
    language: 'routeros',
    showToast: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Copy without showing toast notification.',
      },
    },
  },
};

/**
 * In card context
 */
export const InCardContext: Story = {
  render: () => (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg shadow-md max-w-2xl">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
        Export Configuration
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Copy this configuration to import it on another router:
      </p>
      <CodeBlockCopy
        code={routerosFirewallRule}
        language="routeros"
        title="Firewall Export"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of CodeBlockCopy within a card layout.',
      },
    },
  },
};

/**
 * Multiple code blocks
 */
export const MultipleBlocks: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <CodeBlockCopy
        code={`/ip address add address=192.168.88.1/24 interface=bridge1`}
        language="routeros"
        title="Step 1: Configure IP"
      />
      <CodeBlockCopy
        code={`/ip dhcp-server setup dhcp-server-interface=bridge1`}
        language="routeros"
        title="Step 2: Setup DHCP"
      />
      <CodeBlockCopy
        code={`/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade`}
        language="routeros"
        title="Step 3: Enable NAT"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple code blocks in a step-by-step guide.',
      },
    },
  },
};
