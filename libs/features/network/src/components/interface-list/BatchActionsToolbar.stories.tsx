/**
 * BatchActionsToolbar Stories
 *
 * The BatchActionsToolbar renders a selection count, a "Batch Actions" dropdown
 * (Enable / Disable), and a "Clear Selection" button. It shows a BatchConfirmDialog
 * before executing any operation.
 *
 * Because it depends on the `useBatchInterfaceOperation` Apollo mutation, stories
 * use MockedProvider to supply controlled responses.
 */

import { useState } from 'react';

import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { fn } from 'storybook/test';

import { BatchInterfaceAction } from '@nasnet/api-client/generated';
import { BATCH_INTERFACE_OPERATION } from '@nasnet/api-client/queries';

import { BatchActionsToolbar } from './BatchActionsToolbar';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared mock interfaces
// ---------------------------------------------------------------------------

const mockInterfaces = [
  { id: '*1', name: 'ether1', type: 'ETHERNET', status: 'UP', enabled: true, usedBy: ['gateway'] },
  { id: '*2', name: 'ether2', type: 'ETHERNET', status: 'UP', enabled: true, usedBy: [] },
  {
    id: '*3',
    name: 'bridge1',
    type: 'BRIDGE',
    status: 'UP',
    enabled: true,
    usedBy: ['dhcp-server'],
  },
  { id: '*4', name: 'ether3', type: 'ETHERNET', status: 'DOWN', enabled: false, usedBy: [] },
];

// ---------------------------------------------------------------------------
// Apollo mocks
// ---------------------------------------------------------------------------

const successMock: MockedResponse = {
  request: {
    query: BATCH_INTERFACE_OPERATION,
    variables: {
      routerId: 'router-1',
      input: {
        interfaceIds: ['*1', '*2'],
        action: BatchInterfaceAction.Enable,
      },
    },
  },
  result: {
    data: {
      batchInterfaceOperation: {
        succeeded: ['*1', '*2'],
        failed: [],
        __typename: 'BatchInterfaceOperationResult',
      },
    },
  },
};

const partialFailMock: MockedResponse = {
  request: {
    query: BATCH_INTERFACE_OPERATION,
    variables: {
      routerId: 'router-1',
      input: {
        interfaceIds: ['*1', '*2'],
        action: BatchInterfaceAction.Disable,
      },
    },
  },
  result: {
    data: {
      batchInterfaceOperation: {
        succeeded: ['*2'],
        failed: ['*1'],
        __typename: 'BatchInterfaceOperationResult',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Stateful wrapper so selection changes are reflected in the toolbar
// ---------------------------------------------------------------------------

function ToolbarWrapper({
  initialSelected = ['*1', '*2'],
  mocks = [successMock],
}: {
  initialSelected?: string[];
  mocks?: MockedResponse[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const selectedInterfaces = mockInterfaces.filter((i) => selected.has(i.id));

  return (
    <MockedProvider
      mocks={mocks}
      addTypename={true}
    >
      <div className="p-component-lg bg-background gap-component-md flex min-h-[120px] flex-col items-start">
        <BatchActionsToolbar
          routerId="router-1"
          selectedIds={selected}
          selectedInterfaces={selectedInterfaces}
          onClearSelection={() => setSelected(new Set())}
        />
        <p className="text-muted-foreground text-xs">
          Selected: {[...selected].join(', ') || '(none)'}
        </p>
      </div>
    </MockedProvider>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof BatchActionsToolbar> = {
  title: 'Features/Network/BatchActionsToolbar',
  component: BatchActionsToolbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Bulk action toolbar that appears when one or more interfaces are selected. Supports Enable and Disable operations with a safety confirmation dialog before execution. Shows a safety countdown when disabling interfaces used by the gateway.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof BatchActionsToolbar>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Two interfaces selected — shows count, Batch Actions button, and Clear. */
export const TwoSelected: Story = {
  render: () => <ToolbarWrapper initialSelected={['*1', '*2']} />,
};

/** Single interface selected — count should read "1 selected". */
export const SingleSelected: Story = {
  render: () => <ToolbarWrapper initialSelected={['*3']} />,
};

/** All four interfaces selected, including gateway-used ether1. Disabling them
 *  triggers the safety-confirmation countdown dialog. */
export const AllSelected: Story = {
  render: () => (
    <ToolbarWrapper
      initialSelected={['*1', '*2', '*3', '*4']}
      mocks={[partialFailMock]}
    />
  ),
};

/** Simulates a partial failure: one interface succeeds and one fails. */
export const PartialFailure: Story = {
  render: () => (
    <ToolbarWrapper
      initialSelected={['*1', '*2']}
      mocks={[partialFailMock]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When some interfaces fail during a batch Disable, a warning toast is shown with the success/failure counts.',
      },
    },
  },
};

/** No interfaces selected — toolbar still renders but count shows 0. */
export const NoneSelected: Story = {
  render: () => <ToolbarWrapper initialSelected={[]} />,
};

/** Mobile viewport — verify layout stays usable at narrow widths. */
export const MobileView: Story = {
  render: () => <ToolbarWrapper initialSelected={['*2', '*3']} />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
