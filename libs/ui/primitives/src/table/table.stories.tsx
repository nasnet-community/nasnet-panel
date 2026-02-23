import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from './table';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Table> = {
  title: 'Primitives/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A semantic table component for displaying structured data with headers, rows, and cells. Built with semantic HTML (<table>, <thead>, <tbody>, <tr>, <th>, <td>) for accessibility and native browser support. Fully keyboard navigable with arrow keys and Enter/Space activation on interactive elements. Tables include captions for screen reader context and support striping for visual clarity.',
      },
    },
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

const invoices = [
  { invoice: 'INV001', status: 'Paid', method: 'Credit Card', amount: '$250.00' },
  { invoice: 'INV002', status: 'Pending', method: 'PayPal', amount: '$150.00' },
  { invoice: 'INV003', status: 'Unpaid', method: 'Bank Transfer', amount: '$350.00' },
  { invoice: 'INV004', status: 'Paid', method: 'Credit Card', amount: '$450.00' },
  { invoice: 'INV005', status: 'Paid', method: 'PayPal', amount: '$550.00' },
  { invoice: 'INV006', status: 'Pending', method: 'Bank Transfer', amount: '$200.00' },
  { invoice: 'INV007', status: 'Unpaid', method: 'Credit Card', amount: '$300.00' },
];

/**
 * Default table with typical invoice data showing header, body, and caption.
 * Demonstrates semantic HTML structure with proper accessibility annotations.
 */
export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

/**
 * Table with footer section for totals or summary information.
 * Demonstrates use of TableFooter component for summary rows.
 */
export const WithFooter: Story = {
  render: () => (
    <Table>
      <TableCaption>Invoice summary with totals.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.slice(0, 3).map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$750.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

const firewallRules = [
  { id: '1', chain: 'input', action: 'accept', src: '192.168.1.0/24', dst: 'any', protocol: 'tcp', port: '22' },
  { id: '2', chain: 'input', action: 'accept', src: '192.168.1.0/24', dst: 'any', protocol: 'tcp', port: '80' },
  { id: '3', chain: 'input', action: 'accept', src: '192.168.1.0/24', dst: 'any', protocol: 'tcp', port: '443' },
  { id: '4', chain: 'input', action: 'drop', src: 'any', dst: 'any', protocol: 'all', port: 'any' },
  { id: '5', chain: 'forward', action: 'accept', src: '192.168.1.0/24', dst: 'any', protocol: 'all', port: 'any' },
];

/**
 * Domain-specific example showing firewall rules with semantic status colors.
 * Demonstrates technical data presentation with monospace fonts for IP addresses.
 * Colors paired with text labels for color-blind accessibility.
 */
export const FirewallRulesExample: Story = {
  render: () => (
    <Table>
      <TableCaption>Firewall rules configuration.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px]">#</TableHead>
          <TableHead>Chain</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Destination</TableHead>
          <TableHead>Protocol</TableHead>
          <TableHead>Port</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {firewallRules.map((rule) => (
          <TableRow key={rule.id}>
            <TableCell className="font-medium">{rule.id}</TableCell>
            <TableCell>{rule.chain}</TableCell>
            <TableCell>
              <span
                className={
                  rule.action === 'accept'
                    ? 'text-success'
                    : 'text-error'
                }
              >
                {rule.action}
              </span>
            </TableCell>
            <TableCell className="font-mono text-sm">{rule.src}</TableCell>
            <TableCell className="font-mono text-sm">{rule.dst}</TableCell>
            <TableCell>{rule.protocol}</TableCell>
            <TableCell>{rule.port}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

/**
 * Empty state showing table with no data.
 * Demonstrates handling of filtered-to-empty or no-records scenarios.
 */
export const Empty: Story = {
  render: () => (
    <Table>
      <TableCaption>No data available.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center">
            No results found.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

/**
 * Table with striped rows for improved visual readability across long rows.
 * Demonstrates alternating row background colors using semantic muted tokens.
 */
export const Striped: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          { name: 'John Doe', email: 'john@example.com', role: 'Admin' },
          { name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
          { name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor' },
          { name: 'Alice Brown', email: 'alice@example.com', role: 'User' },
          { name: 'Charlie Wilson', email: 'charlie@example.com', role: 'Viewer' },
        ].map((user, index) => (
          <TableRow key={user.email} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell className="text-right">
              <button className="text-primary hover:underline">Edit</button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

/**
 * Mobile viewport (375px) showing reduced columns with scrollable overflow.
 * Demonstrates responsive table design for small screens - only essential columns shown.
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <Table>
      <TableCaption>Firewall rules (mobile view with horizontal scroll).</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Chain</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Source</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {firewallRules.slice(0, 3).map((rule) => (
          <TableRow key={rule.id}>
            <TableCell>{rule.chain}</TableCell>
            <TableCell>
              <span
                className={
                  rule.action === 'accept'
                    ? 'text-success'
                    : 'text-error'
                }
              >
                {rule.action}
              </span>
            </TableCell>
            <TableCell className="font-mono text-sm">{rule.src}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

/**
 * Tablet viewport (768px) showing balanced column density.
 * Demonstrates responsive table with moderate information density for medium screens.
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  render: () => (
    <Table>
      <TableCaption>Recent invoices (tablet view).</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.slice(0, 4).map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

/**
 * Desktop viewport (1280px) showing full density table with all columns visible.
 * Demonstrates high information density for power users on large screens.
 * All details visible without horizontal scrolling or column hiding.
 */
export const DesktopFull: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  render: () => (
    <Table>
      <TableCaption>Firewall rules with full details (desktop view).</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px]">#</TableHead>
          <TableHead>Chain</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Destination</TableHead>
          <TableHead>Protocol</TableHead>
          <TableHead>Port</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {firewallRules.map((rule) => (
          <TableRow key={rule.id}>
            <TableCell className="font-medium">{rule.id}</TableCell>
            <TableCell>{rule.chain}</TableCell>
            <TableCell>
              <span
                className={
                  rule.action === 'accept'
                    ? 'text-success'
                    : 'text-error'
                }
              >
                {rule.action}
              </span>
            </TableCell>
            <TableCell className="font-mono text-sm">{rule.src}</TableCell>
            <TableCell className="font-mono text-sm">{rule.dst}</TableCell>
            <TableCell>{rule.protocol}</TableCell>
            <TableCell>{rule.port}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
