import type { Meta, StoryObj } from '@storybook/react';

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

const meta: Meta<typeof Table> = {
  title: 'Primitives/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A semantic table component for displaying structured data with headers, rows, and cells.',
      },
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
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
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
