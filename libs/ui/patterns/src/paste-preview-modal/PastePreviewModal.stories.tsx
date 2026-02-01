/**
 * Storybook stories for PastePreviewModal component
 * @see NAS-4.23 - Implement Clipboard Integration
 */

import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '@nasnet/ui/primitives';

import type { ParseResult } from '../hooks/usePasteImport';

import { PastePreviewModal } from './PastePreviewModal';

const ipListResult: ParseResult = {
  success: true,
  type: 'ip-list',
  items: [
    { line: 1, original: '192.168.1.1', value: '192.168.1.1' },
    { line: 2, original: '192.168.1.2', value: '192.168.1.2' },
    { line: 3, original: '192.168.1.3', value: '192.168.1.3' },
    { line: 4, original: '10.0.0.1/24', value: '10.0.0.1/24' },
    { line: 5, original: '172.16.0.1', value: '172.16.0.1' },
  ],
  errors: [],
  totalLines: 5,
  rawContent: '192.168.1.1\n192.168.1.2\n192.168.1.3\n10.0.0.1/24\n172.16.0.1',
};

const ipListWithErrors: ParseResult = {
  success: false,
  type: 'ip-list',
  items: [
    { line: 1, original: '192.168.1.1', value: '192.168.1.1' },
    { line: 3, original: '10.0.0.1/24', value: '10.0.0.1/24' },
  ],
  errors: [
    { line: 2, message: 'Invalid IP address', content: 'not-an-ip' },
    { line: 4, message: 'Invalid IP address', content: '999.999.999.999' },
  ],
  totalLines: 4,
  rawContent: '192.168.1.1\nnot-an-ip\n10.0.0.1/24\n999.999.999.999',
};

const csvResult: ParseResult = {
  success: true,
  type: 'csv',
  items: [
    { line: 2, original: 'Laptop,192.168.1.100,00:1A:2B:3C:4D:5E', value: { name: 'Laptop', ip: '192.168.1.100', mac: '00:1A:2B:3C:4D:5E' } },
    { line: 3, original: 'Phone,192.168.1.101,AA:BB:CC:DD:EE:FF', value: { name: 'Phone', ip: '192.168.1.101', mac: 'AA:BB:CC:DD:EE:FF' } },
    { line: 4, original: 'Tablet,192.168.1.102,11:22:33:44:55:66', value: { name: 'Tablet', ip: '192.168.1.102', mac: '11:22:33:44:55:66' } },
  ],
  errors: [],
  totalLines: 4,
  rawContent: 'name,ip,mac\nLaptop,192.168.1.100,00:1A:2B:3C:4D:5E\nPhone,192.168.1.101,AA:BB:CC:DD:EE:FF\nTablet,192.168.1.102,11:22:33:44:55:66',
};

const routerosResult: ParseResult = {
  success: true,
  type: 'routeros',
  items: [
    { line: 1, original: '/ip firewall filter add chain=forward action=accept', value: '/ip firewall filter add chain=forward action=accept' },
    { line: 2, original: '/ip firewall filter add chain=input action=drop', value: '/ip firewall filter add chain=input action=drop' },
  ],
  errors: [],
  totalLines: 2,
  rawContent: '/ip firewall filter add chain=forward action=accept\n/ip firewall filter add chain=input action=drop',
};

const meta: Meta<typeof PastePreviewModal> = {
  title: 'Patterns/Clipboard/PastePreviewModal',
  component: PastePreviewModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Modal for previewing and validating pasted import data.

## Features
- Shows parsed items in table or list view
- Displays validation errors with line numbers
- Type detection badge (IP List, CSV, RouterOS)
- Summary of valid/invalid items
- Optional allow applying with errors

## Usage
\`\`\`tsx
import { PastePreviewModal, usePasteImport } from '@nasnet/ui/patterns';

function ImportDialog() {
  const { parseResult, handlePaste, clearResult } = usePasteImport();

  return (
    <>
      <textarea onPaste={handlePaste} />
      <PastePreviewModal
        open={!!parseResult}
        parseResult={parseResult}
        onApply={(result) => {
          // Handle apply
          clearResult();
        }}
        onCancel={clearResult}
      />
    </>
  );
}
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    maxPreviewHeight: {
      control: { type: 'number' },
      description: 'Maximum height for the preview content',
    },
    allowApplyWithErrors: {
      control: 'boolean',
      description: 'Allow applying even with validation errors',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PastePreviewModal>;

/**
 * IP List - All valid
 */
export const IPListValid: Story = {
  args: {
    open: true,
    parseResult: ipListResult,
    onApply: (result) => console.log('Applied:', result),
    onCancel: () => console.log('Cancelled'),
  },
};

/**
 * IP List - With errors
 */
export const IPListWithErrors: Story = {
  args: {
    open: true,
    parseResult: ipListWithErrors,
    onApply: (result) => console.log('Applied:', result),
    onCancel: () => console.log('Cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows validation errors with line numbers. Apply button is disabled by default.',
      },
    },
  },
};

/**
 * IP List - Allow apply with errors
 */
export const AllowApplyWithErrors: Story = {
  args: {
    open: true,
    parseResult: ipListWithErrors,
    allowApplyWithErrors: true,
    onApply: (result) => console.log('Applied:', result),
    onCancel: () => console.log('Cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story: 'With allowApplyWithErrors=true, user can apply valid items even with errors.',
      },
    },
  },
};

/**
 * CSV Data
 */
export const CSVData: Story = {
  args: {
    open: true,
    parseResult: csvResult,
    onApply: (result) => console.log('Applied:', result),
    onCancel: () => console.log('Cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story: 'CSV data is displayed in a table format with column headers.',
      },
    },
  },
};

/**
 * RouterOS Configuration
 */
export const RouterOSConfig: Story = {
  args: {
    open: true,
    parseResult: routerosResult,
    onApply: (result) => console.log('Applied:', result),
    onCancel: () => console.log('Cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story: 'RouterOS configuration commands displayed in list format.',
      },
    },
  },
};

/**
 * Custom texts
 */
export const CustomTexts: Story = {
  args: {
    open: true,
    parseResult: ipListResult,
    title: 'Import IP Addresses',
    applyText: 'Import All',
    cancelText: 'Discard',
    onApply: (result) => console.log('Applied:', result),
    onCancel: () => console.log('Cancelled'),
  },
};

/**
 * Interactive demo
 */
export const InteractiveDemo: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [result, setResult] = useState<ParseResult | null>(null);

    const handleDemo = (demoResult: ParseResult) => {
      setResult(demoResult);
      setOpen(true);
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Click a button to open the preview modal with sample data:
        </p>
        <div className="flex gap-2">
          <Button onClick={() => handleDemo(ipListResult)}>IP List</Button>
          <Button onClick={() => handleDemo(ipListWithErrors)}>With Errors</Button>
          <Button onClick={() => handleDemo(csvResult)}>CSV Data</Button>
          <Button onClick={() => handleDemo(routerosResult)}>RouterOS</Button>
        </div>

        <PastePreviewModal
          open={open}
          parseResult={result}
          onApply={(r) => {
            console.log('Applied:', r);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </div>
    );
  },
};
