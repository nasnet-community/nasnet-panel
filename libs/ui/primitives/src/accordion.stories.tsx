import * as React from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Accordion> = {
  title: 'Primitives/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Accordion component built on @radix-ui/react-collapsible. Supports single and multiple open items simultaneously. Commonly used in mobile layouts for collapsible settings sections, configuration panels, and FAQ-style content. Fully accessible with keyboard navigation (Tab, Enter/Space) and screen reader support. Respects prefers-reduced-motion for animations.',
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
      description: 'Whether only one or multiple items can be open at once',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <Accordion type="single">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is NasNetConnect?</AccordionTrigger>
        <AccordionContent>
          NasNetConnect is an enterprise-grade MikroTik router management platform running as a
          single Docker container directly on the router.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How do I add a router?</AccordionTrigger>
        <AccordionContent>
          Navigate to the router list page and click "Add Router". Enter the router's IP address,
          credentials, and click Connect.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>What protocols are supported?</AccordionTrigger>
        <AccordionContent>
          NasNetConnect supports RouterOS API, SSH, and Telnet protocols for connecting to MikroTik
          devices.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const SingleOpen: Story = {
  args: {
    type: 'single',
    defaultValue: 'item-1',
  },
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem value="item-1">
        <AccordionTrigger>General Settings</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Router Name</span>
              <span className="font-mono">MikroTik-Home</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Firmware</span>
              <span className="font-mono">7.13.2</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Network Interfaces</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ether1</span>
              <span className="text-success">Up</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ether2</span>
              <span className="text-success">Up</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">wlan1</span>
              <span className="text-warning">Scanning</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Security</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Firewall</span>
              <span className="text-success">Enabled</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VPN</span>
              <span className="text-success">Connected</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const MultipleOpen: Story = {
  render: () => (
    <Accordion
      type="multiple"
      defaultValue={['vpn', 'firewall']}
    >
      <AccordionItem value="vpn">
        <AccordionTrigger>VPN Configuration</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>WireGuard</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Endpoint</span>
              <span className="font-mono">vpn.example.com:51820</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="text-success">Connected</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="firewall">
        <AccordionTrigger>Firewall Rules</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Filter rules</span>
              <span>24 active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NAT rules</span>
              <span>6 active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Blocked IPs</span>
              <span>142</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="dhcp">
        <AccordionTrigger>DHCP Leases</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active leases</span>
              <span>18</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pool</span>
              <span className="font-mono">192.168.1.100-200</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Controlled: Story = {
  render: function ControlledAccordion() {
    const [value, setValue] = React.useState<string>('');

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {['step-1', 'step-2', 'step-3'].map((step, i) => (
            <button
              key={step}
              onClick={() => setValue(step)}
              className={`rounded px-3 py-1 text-xs font-medium ${
                value === step ?
                  'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground border'
              }`}
            >
              Step {i + 1}
            </button>
          ))}
        </div>
        <Accordion
          type="single"
          value={value}
          onValueChange={(newValue) =>
            setValue(Array.isArray(newValue) ? (newValue[0] ?? '') : newValue)
          }
        >
          <AccordionItem value="step-1">
            <AccordionTrigger>Step 1: Router Discovery</AccordionTrigger>
            <AccordionContent>
              Scan your local network to discover MikroTik routers automatically, or enter the IP
              address manually.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="step-2">
            <AccordionTrigger>Step 2: Authentication</AccordionTrigger>
            <AccordionContent>
              Enter your router credentials. We support username/password and SSH key
              authentication.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="step-3">
            <AccordionTrigger>Step 3: Configuration</AccordionTrigger>
            <AccordionContent>
              Choose which services to monitor and configure initial settings for your router
              management experience.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  },
};

export const NoneOpenByDefault: Story = {
  render: () => (
    <Accordion type="single">
      <AccordionItem value="advanced">
        <AccordionTrigger>Advanced Options</AccordionTrigger>
        <AccordionContent>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>Connection timeout: 30s</p>
            <p>Retry attempts: 3</p>
            <p>Polling interval: 5s</p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="danger">
        <AccordionTrigger>Danger Zone</AccordionTrigger>
        <AccordionContent>
          <div className="border-error/30 bg-error/5 rounded-md border p-3">
            <p className="text-error text-sm">
              Factory reset will wipe all router configuration. This action cannot be undone.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Mobile: Story = {
  render: () => (
    <Accordion
      type="single"
      defaultValue="item-1"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>Network Settings</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="text-success font-medium">Connected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Signal</span>
              <span>-62 dBm</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Security</AccordionTrigger>
        <AccordionContent>
          <p className="text-muted-foreground text-sm">WPA3 Enabled</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  render: () => (
    <Accordion
      type="multiple"
      defaultValue={['vpn', 'firewall']}
    >
      <AccordionItem value="vpn">
        <AccordionTrigger>VPN Configuration</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>WireGuard</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="text-success">Connected</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="firewall">
        <AccordionTrigger>Firewall Rules</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rules</span>
              <span>24 active</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const Desktop: Story = {
  render: () => (
    <div className="max-w-2xl">
      <Accordion
        type="single"
        defaultValue="general"
      >
        <AccordionItem value="general">
          <AccordionTrigger>General Configuration</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Router Name</span>
                <span className="font-mono">MikroTik-Primary</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model</span>
                <span className="font-mono">RB4011iGS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Firmware</span>
                <span className="font-mono">7.13.2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uptime</span>
                <span>45 days 3 hours</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="network">
          <AccordionTrigger>Network Interfaces (4 interfaces)</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm">
              {['ether1', 'ether2', 'ether3', 'ether4'].map((iface) => (
                <div
                  key={iface}
                  className="flex justify-between border-b pb-2 last:border-b-0"
                >
                  <span className="text-muted-foreground font-mono">{iface}</span>
                  <span className="text-success">Up (1 Gbps)</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

export const WithLongContent: Story = {
  render: () => (
    <Accordion type="single">
      <AccordionItem value="docs">
        <AccordionTrigger>Documentation & Help</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 text-sm">
            <p>
              <strong>Router Configuration Help</strong>
            </p>
            <p className="text-muted-foreground leading-relaxed">
              This section covers the basic configuration of your MikroTik router. You can expand or
              collapse sections to find specific information. All settings are applied immediately
              to the router.
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-1">
              <li>Network interfaces configuration</li>
              <li>DHCP server setup</li>
              <li>DNS resolver settings</li>
              <li>Firewall and NAT rules</li>
              <li>Routing and bridging</li>
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
