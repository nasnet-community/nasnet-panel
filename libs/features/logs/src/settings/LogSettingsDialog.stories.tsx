/**
 * Storybook Stories for LogSettingsDialog
 * Epic 0.8: System Logs — RouterOS Log Settings
 *
 * This component calls several hooks internally:
 *   - useConnectionStore (Zustand) → currentRouterIp
 *   - useLoggingRules / useLoggingActions (API query hooks)
 *   - useCreateLoggingRule / useUpdateLoggingRule / etc. (mutation hooks)
 *
 * Stories mock those hooks via vi.mocked() in beforeEach, matching the
 * project's established pattern (see RecentLogs.stories.tsx).
 */

import type { Meta, StoryObj } from '@storybook/react';

import { LogSettingsDialog } from './LogSettingsDialog';

// Hook modules imported so vi.mocked() can intercept them
import * as connectionStoreModule from '@nasnet/state/stores';
import * as apiQueriesModule from '@nasnet/api-client/queries';

// ---------------------------------------------------------------------------
// Inline mock data
// ---------------------------------------------------------------------------

const mockRules = [
  {
    '.id': '*1',
    topics: 'firewall',
    action: 'memory',
    prefix: 'FW-',
    disabled: false,
  },
  {
    '.id': '*2',
    topics: 'dhcp,info',
    action: 'disk',
    prefix: '',
    disabled: false,
  },
  {
    '.id': '*3',
    topics: 'system,critical',
    action: 'remote',
    prefix: 'SYS-',
    disabled: true,
  },
];

const mockActions = [
  {
    '.id': '*1',
    name: 'memory',
    target: 'memory',
    'memory-lines': 1000,
  },
  {
    '.id': '*2',
    name: 'disk',
    target: 'disk',
    'disk-file-count': 2,
    'disk-lines-per-file': 1000,
  },
  {
    '.id': '*3',
    name: 'remote',
    target: 'remote',
    remote: '192.168.1.100',
    'remote-port': 514,
  },
];

/** Returns a standard no-op mutation mock */
const noopMutation = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  reset: vi.fn(),
});

// ---------------------------------------------------------------------------
// Shared beforeEach helper — sets up all hook mocks for a story
// ---------------------------------------------------------------------------

function setupMocks({
  routerIp = '192.168.88.1',
  rules = mockRules,
  actions = mockActions,
  rulesLoading = false,
  actionsLoading = false,
  rulesError = null,
  actionsError = null,
}: {
  routerIp?: string;
  rules?: typeof mockRules;
  actions?: typeof mockActions;
  rulesLoading?: boolean;
  actionsLoading?: boolean;
  rulesError?: Error | null;
  actionsError?: Error | null;
} = {}) {
  // Connection store — supply the router IP
  vi.mocked(connectionStoreModule.useConnectionStore).mockReturnValue(routerIp);

  // Query hooks
  vi.mocked(apiQueriesModule.useLoggingRules).mockReturnValue({
    data: rules as any,
    isLoading: rulesLoading,
    error: rulesError,
    refetch: vi.fn(),
  } as any);

  vi.mocked(apiQueriesModule.useLoggingActions).mockReturnValue({
    data: actions as any,
    isLoading: actionsLoading,
    error: actionsError,
    refetch: vi.fn(),
  } as any);

  // Mutation hooks
  vi.mocked(apiQueriesModule.useCreateLoggingRule).mockReturnValue(
    noopMutation() as any
  );
  vi.mocked(apiQueriesModule.useUpdateLoggingRule).mockReturnValue(
    noopMutation() as any
  );
  vi.mocked(apiQueriesModule.useDeleteLoggingRule).mockReturnValue(
    noopMutation() as any
  );
  vi.mocked(apiQueriesModule.useToggleLoggingRule).mockReturnValue(
    noopMutation() as any
  );
  vi.mocked(apiQueriesModule.useUpdateLoggingAction).mockReturnValue(
    noopMutation() as any
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof LogSettingsDialog> = {
  title: 'Features/Logs/LogSettingsDialog',
  component: LogSettingsDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Full-featured dialog for configuring RouterOS logging. ' +
          'Contains two tabs: **Rules** (create, toggle, delete logging rules) and ' +
          '**Destinations** (configure memory, disk, and remote syslog destinations). ' +
          'Internally uses the connection store to determine the active router IP and ' +
          'calls GraphQL mutation hooks to persist changes.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LogSettingsDialog>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default state — three rules configured, all destinations visible.
 * Click the "Log Settings" button (gear icon) to open the dialog.
 */
export const Default: Story = {
  beforeEach: () => {
    setupMocks();
  },
};

/**
 * Opened with a custom trigger button instead of the default gear icon.
 */
export const CustomTrigger: Story = {
  args: {
    trigger: (
      <button
        style={{
          padding: '6px 14px',
          background: '#4972BA',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        Configure Logging
      </button>
    ),
  },
  beforeEach: () => {
    setupMocks();
  },
};

/**
 * Rules tab in loading state — three skeleton placeholders rendered.
 */
export const RulesLoading: Story = {
  name: 'Rules Tab — Loading',
  beforeEach: () => {
    setupMocks({ rulesLoading: true, rules: [] });
  },
};

/**
 * Rules tab showing an API error with a Retry button.
 */
export const RulesError: Story = {
  name: 'Rules Tab — Error',
  beforeEach: () => {
    setupMocks({
      rules: [],
      rulesError: new Error('Failed to load logging rules: connection timeout'),
    });
  },
};

/**
 * Empty rules tab — no rules configured yet. Shows the empty-state message.
 */
export const NoRules: Story = {
  name: 'Rules Tab — Empty',
  beforeEach: () => {
    setupMocks({ rules: [] });
  },
};

/**
 * Destinations tab in loading state.
 */
export const DestinationsLoading: Story = {
  name: 'Destinations Tab — Loading',
  beforeEach: () => {
    setupMocks({ actionsLoading: true, actions: [] });
  },
};
