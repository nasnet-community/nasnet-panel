/**
 * Storybook stories for ExportMenu
 *
 * ExportMenu is a pure presentational component: it accepts three callbacks
 * (CSV / JSON / PNG) and an optional disabled flag. All stories use Storybook
 * action spies so interaction testing can verify which handler fires.
 */

import { fn } from 'storybook/test';

import { ExportMenu } from './export-menu';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ExportMenu> = {
  title: 'Features/Network/InterfaceStats/ExportMenu',
  component: ExportMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**ExportMenu** renders a single "Export" button that opens a dropdown with
three export formats for interface traffic statistics:

| Option | Format | Use-case |
|--------|--------|----------|
| Export as CSV | \`.csv\` | Import into Excel / Google Sheets |
| Export as JSON | \`.json\` | Programmatic consumption / storage |
| Export Chart as PNG | \`.png\` | Screenshot for reports / tickets |

The trigger button is disabled when \`disabled={true}\`, which should be set
while data is loading or when no data is available.
        `,
      },
    },
  },
  argTypes: {
    isDisabled: {
      control: 'boolean',
      description: 'Disable the trigger button when no data is available',
    },
    onExportCsv: { action: 'export-csv' },
    onExportJson: { action: 'export-json' },
    onExportPng: { action: 'export-png' },
  },
};

export default meta;
type Story = StoryObj<typeof ExportMenu>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default enabled state – all three export handlers are wired to Storybook
 * action spies. Click "Export" to open the dropdown and select a format.
 */
export const Default: Story = {
  args: {
    onExportCsv: fn(),
    onExportJson: fn(),
    onExportPng: fn(),
    isDisabled: false,
  },
};

/**
 * Disabled state – the trigger button is greyed out and cannot be clicked.
 * Use this variant when data is still loading or when the interface has no
 * statistics available yet.
 */
export const Disabled: Story = {
  args: {
    onExportCsv: fn(),
    onExportJson: fn(),
    onExportPng: fn(),
    isDisabled: true,
  },
};

/**
 * Embedded inside a realistic card header toolbar alongside other controls.
 * Shows how ExportMenu composes with labels and sibling buttons.
 */
export const InsideCardHeader: Story = {
  render: (args) => (
    <div className="flex items-center justify-between rounded-md border bg-card px-component-sm py-component-xs shadow-sm w-[480px]">
      <div className="flex flex-col">
        <span className="text-sm font-semibold">ether1 - WAN</span>
        <span className="text-xs text-muted-foreground">Traffic Statistics</span>
      </div>
      <ExportMenu {...args} />
    </div>
  ),
  args: {
    onExportCsv: fn(),
    onExportJson: fn(),
    onExportPng: fn(),
    isDisabled: false,
  },
};

/**
 * Loading state – disabled while a data fetch is in progress.
 * In a real panel this would be driven by Apollo loading state.
 */
export const LoadingData: Story = {
  args: {
    onExportCsv: fn(),
    onExportJson: fn(),
    onExportPng: fn(),
    isDisabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Represents the state where the export button is disabled because traffic data is still being fetched.',
      },
    },
  },
};

/**
 * Multiple ExportMenu instances side-by-side – demonstrates each one is
 * independently clickable with separate handler scopes.
 */
export const MultipleMenus: Story = {
  render: () => (
    <div className="flex items-center gap-component-md">
      <div className="flex items-center gap-component-sm">
        <span className="text-sm font-medium">ether1</span>
        <ExportMenu
          onExportCsv={fn()}
          onExportJson={fn()}
          onExportPng={fn()}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">ether2</span>
        <ExportMenu
          onExportCsv={fn()}
          onExportJson={fn()}
          onExportPng={fn()}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">wlan1</span>
        <ExportMenu
          onExportCsv={fn()}
          onExportJson={fn()}
          onExportPng={fn()}
          isDisabled
        />
      </div>
    </div>
  ),
  args: {},
};
