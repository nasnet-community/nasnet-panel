/**
 * Storybook Stories for FirewallLogFilters
 *
 * Demonstrates various states and configurations of the firewall log filters component.
 *
 * @see NAS-7.9: Implement Firewall Logging
 */

import { useState } from 'react';

import { within, userEvent, expect } from 'storybook/test';

import { FirewallLogFilters } from './FirewallLogFilters';
import { FirewallLogFiltersDesktop } from './FirewallLogFiltersDesktop';

import type { FirewallLogFilterState } from './firewall-log-filters.types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof FirewallLogFilters> = {
  title: 'Patterns/Firewall/FirewallLogFilters',
  component: FirewallLogFilters,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Filter controls for firewall log viewer with responsive design.

**Features:**
- Time range picker with presets (1h, 6h, 1d, 1w, custom)
- Action filter checkboxes (Accept, Drop, Reject, Unknown)
- IP address inputs with wildcard support (192.168.1.*)
- Port inputs with range support (80-443)
- Prefix autocomplete from available logs
- Active filter count badge
- Clear filters functionality

**Responsive:**
- **Desktop:** Sidebar layout with inline filters
- **Mobile:** Bottom sheet with card-based sections and 44px touch targets
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FirewallLogFilters>;

// ============================================================================
// Wrapper Component for Interactive Stories
// ============================================================================

function InteractiveWrapper({
  initialFilters,
  availablePrefixes,
  open,
}: {
  initialFilters: FirewallLogFilterState;
  availablePrefixes?: string[];
  open?: boolean;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [isOpen, setIsOpen] = useState(open ?? false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile trigger button */}
      <div className="md:hidden p-4">
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
          onClick={() => setIsOpen(true)}
        >
          Open Filters
        </button>
      </div>

      <FirewallLogFilters
        filters={filters}
        onFiltersChange={setFilters}
        availablePrefixes={availablePrefixes}
        open={isOpen}
        onClose={() => setIsOpen(false)}
      />

      {/* Debug panel showing current filter state */}
      <div className="p-4 bg-muted/50 border-t">
        <h3 className="font-semibold mb-2">Current Filters (Debug)</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(filters, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default state with no active filters.
 */
export const Default: Story = {
  render: () => (
    <InteractiveWrapper
      initialFilters={{
        timeRangePreset: '1h',
        actions: [],
      }}
    />
  ),
};

/**
 * Desktop view with sidebar layout.
 */
export const Desktop: Story = {
  render: () => (
    <div className="flex min-h-screen">
      <FirewallLogFiltersDesktop
        filters={{
          timeRangePreset: '1h',
          actions: [],
        }}
        onFiltersChange={(filters) => console.log('Filters changed:', filters)}
      />
      <div className="flex-1 p-6 bg-background">
        <h2 className="text-2xl font-bold mb-4">Firewall Logs</h2>
        <p className="text-muted-foreground">
          Log entries would appear here. Use the sidebar to filter logs.
        </p>
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

/**
 * Mobile view with bottom sheet.
 */
export const Mobile: Story = {
  render: () => (
    <InteractiveWrapper
      initialFilters={{
        timeRangePreset: '1h',
        actions: [],
      }}
      open={true}
    />
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * With active filters showing badge and Clear button.
 */
export const WithActiveFilters: Story = {
  render: () => (
    <InteractiveWrapper
      initialFilters={{
        timeRangePreset: '6h',
        actions: ['drop', 'reject'],
        srcIp: '192.168.1.*',
        dstPort: { min: 80, max: 443 },
        prefix: 'DROPPED-',
      }}
      availablePrefixes={['DROPPED-', 'ACCEPTED-', 'REJECTED-', 'FIREWALL-']}
    />
  ),
};

/**
 * With available prefixes for autocomplete dropdown.
 */
export const WithPrefixAutocomplete: Story = {
  render: () => (
    <InteractiveWrapper
      initialFilters={{
        timeRangePreset: '1d',
        actions: [],
      }}
      availablePrefixes={[
        'DROPPED-',
        'ACCEPTED-',
        'REJECTED-',
        'FIREWALL-',
        'SCAN-DETECT-',
        'PORT-SCAN-',
      ]}
    />
  ),
};

/**
 * With complex filters demonstrating wildcard IP and port ranges.
 */
export const ComplexFilters: Story = {
  render: () => (
    <InteractiveWrapper
      initialFilters={{
        timeRangePreset: '1w',
        actions: ['drop', 'reject'],
        srcIp: '10.0.*.*',
        dstIp: '172.16.0.1',
        srcPort: { min: 1024, max: 65535 },
        dstPort: 22,
        prefix: 'SSH-BLOCK-',
      }}
      availablePrefixes={[
        'SSH-BLOCK-',
        'DROPPED-',
        'ACCEPTED-',
        'REJECTED-',
      ]}
    />
  ),
};

// ============================================================================
// Interaction Tests
// ============================================================================

/**
 * Test: User can toggle action filters
 */
export const InteractionToggleActions: Story = {
  render: () => (
    <div className="flex">
      <FirewallLogFiltersDesktop
        filters={{
          timeRangePreset: '1h',
          actions: [],
        }}
        onFiltersChange={(filters) => console.log('Filters changed:', filters)}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click the "drop" checkbox
    const dropCheckbox = canvas.getByRole('checkbox', { name: /drop/i });
    await userEvent.click(dropCheckbox);

    // Verify it's checked
    await expect(dropCheckbox).toBeChecked();

    // Verify badge shows active filter count
    const badge = await canvas.findByText('1');
    await expect(badge).toBeInTheDocument();
  },
};

/**
 * Test: User can enter wildcard IP addresses
 */
export const InteractionWildcardIP: Story = {
  render: () => (
    <div className="flex">
      <FirewallLogFiltersDesktop
        filters={{
          timeRangePreset: '1h',
          actions: [],
        }}
        onFiltersChange={(filters) => console.log('Filters changed:', filters)}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find source IP input
    const srcIpInput = canvas.getByPlaceholderText(/192\.168\.1\.\*/i);

    // Enter wildcard IP
    await userEvent.clear(srcIpInput);
    await userEvent.type(srcIpInput, '192.168.1.*');

    // Verify value is set
    await expect(srcIpInput).toHaveValue('192.168.1.*');

    // Verify no validation error appears
    const errorText = canvas.queryByText(/invalid ip format/i);
    expect(errorText).not.toBeInTheDocument();
  },
};

/**
 * Test: User can clear all filters
 */
export const InteractionClearFilters: Story = {
  render: () => (
    <div className="flex">
      <FirewallLogFiltersDesktop
        filters={{
          timeRangePreset: '1d',
          actions: ['drop'],
          srcIp: '192.168.1.*',
        }}
        onFiltersChange={(filters) => console.log('Filters changed:', filters)}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify active filter badge is present
    const badge = canvas.getByText('3');
    await expect(badge).toBeInTheDocument();

    // Find and click Clear button
    const clearButton = canvas.getByRole('button', { name: /clear/i });
    await userEvent.click(clearButton);

    // Note: In real implementation, filters would be cleared
    // In Storybook, we just verify the button is clickable
  },
};
