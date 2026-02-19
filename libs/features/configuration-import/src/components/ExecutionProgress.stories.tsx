import type { Meta, StoryObj } from '@storybook/react';
import type { BatchJob } from '@nasnet/api-client/queries';
import { ExecutionProgress } from './ExecutionProgress';

const meta: Meta<typeof ExecutionProgress> = {
  title: 'Features/ConfigurationImport/ExecutionProgress',
  component: ExecutionProgress,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays real-time progress of a batch configuration job. Shows status header, animated progress bar, command errors, rollback notices, and cancel/retry actions. Covers all BatchJobStatus states: pending, running, completed, failed, cancelled, and rolled_back.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ExecutionProgress>;

// ─── Shared mock data helpers ───────────────────────────────────────────────

const baseJob: BatchJob = {
  id: 'job-abc123',
  routerIp: '192.168.88.1',
  protocol: 'api',
  status: 'pending',
  progress: {
    total: 20,
    current: 0,
    percent: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
  },
  errors: [],
  createdAt: new Date().toISOString(),
  dryRun: false,
  rollbackEnabled: true,
};

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Pending: Story = {
  args: {
    job: {
      ...baseJob,
      status: 'pending',
    },
    onCancel: () => console.log('cancel clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Job is queued and waiting to start. The cancel button is visible.',
      },
    },
  },
};

export const Running: Story = {
  args: {
    job: {
      ...baseJob,
      status: 'running',
      currentCommand: '/ip/firewall/filter add chain=forward action=accept',
      progress: {
        total: 20,
        current: 8,
        percent: 40,
        succeeded: 7,
        failed: 1,
        skipped: 0,
      },
      errors: [
        {
          lineNumber: 5,
          command: '/interface bridge add name=br-invalid',
          error: 'bridge already exists',
          timestamp: new Date().toISOString(),
        },
      ],
    },
    onCancel: () => console.log('cancel clicked'),
    isCancelling: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Job is actively executing commands. The spinner is shown, progress bar fills, and any encountered errors are listed in the error panel.',
      },
    },
  },
};

export const Cancelling: Story = {
  args: {
    job: {
      ...baseJob,
      status: 'running',
      currentCommand: '/ip/route add dst-address=0.0.0.0/0 gateway=192.168.88.254',
      progress: {
        total: 20,
        current: 12,
        percent: 60,
        succeeded: 12,
        failed: 0,
        skipped: 0,
      },
      errors: [],
    },
    onCancel: () => console.log('cancel clicked'),
    isCancelling: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A cancel request is in flight. The Cancel button shows a spinner and is disabled to prevent double-submission.',
      },
    },
  },
};

export const Completed: Story = {
  args: {
    job: {
      ...baseJob,
      status: 'completed',
      completedAt: new Date().toISOString(),
      progress: {
        total: 20,
        current: 20,
        percent: 100,
        succeeded: 20,
        failed: 0,
        skipped: 0,
      },
      errors: [],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'All commands executed successfully. The progress bar is fully green and a success message is shown.',
      },
    },
  },
};

export const Failed: Story = {
  args: {
    job: {
      ...baseJob,
      status: 'failed',
      completedAt: new Date().toISOString(),
      progress: {
        total: 20,
        current: 13,
        percent: 65,
        succeeded: 10,
        failed: 3,
        skipped: 0,
      },
      errors: [
        {
          lineNumber: 4,
          command: '/ip/address add address=192.168.99.1/24 interface=ether2',
          error: 'address already assigned to another interface',
          timestamp: new Date().toISOString(),
        },
        {
          lineNumber: 9,
          command: '/interface bridge port add bridge=br0 interface=ether3',
          error: 'interface not found: ether3',
          timestamp: new Date().toISOString(),
        },
        {
          lineNumber: 12,
          command: '/ip/firewall/nat add chain=srcnat out-interface=ether1 action=masquerade',
          error: 'duplicate rule',
          timestamp: new Date().toISOString(),
        },
      ],
      rollbackEnabled: false,
    },
    onRetry: () => console.log('retry clicked'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Job terminated with errors and no rollback. The error list is shown and the Try Again button is available.',
      },
    },
  },
};

export const RolledBack: Story = {
  args: {
    job: {
      ...baseJob,
      status: 'rolled_back',
      completedAt: new Date().toISOString(),
      progress: {
        total: 20,
        current: 6,
        percent: 30,
        succeeded: 4,
        failed: 2,
        skipped: 0,
      },
      errors: [
        {
          lineNumber: 5,
          command: '/ip/address add address=10.0.1.1/24 interface=ether4',
          error: 'interface ether4 does not exist',
          timestamp: new Date().toISOString(),
        },
        {
          lineNumber: 6,
          command: '/interface vlan add name=vlan10 vlan-id=10 interface=ether4',
          error: 'dependency failed',
          timestamp: new Date().toISOString(),
        },
      ],
      rollbackEnabled: true,
      rollbackCount: 4,
    },
    onRetry: () => console.log('retry clicked'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Job failed and rollback was triggered. A warning banner shows how many changes were reverted to restore the previous router state.',
      },
    },
  },
};

export const LoadingInitial: Story = {
  args: {
    job: null,
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Waiting for the first job status response from the backend. Displays a centered spinner.',
      },
    },
  },
};

export const FetchError: Story = {
  args: {
    job: null,
    isLoading: false,
    error: new Error('Network request timed out — could not reach rosproxy at 192.168.88.1:8728'),
    onRetry: () => console.log('retry tracking'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'An error occurred while fetching the job status. The error message and a Try Again button are shown.',
      },
    },
  },
};
