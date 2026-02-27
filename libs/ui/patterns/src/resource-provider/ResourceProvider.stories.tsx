/**
 * ResourceProvider Storybook Stories
 *
 * Demonstrates the ResourceProvider context pattern for the Universal State v2
 * 8-layer resource model. Stories show consumer components using
 * useResourceContext() to access resource state and actions.
 *
 * @module @nasnet/ui/patterns/resource-provider
 */

import * as React from 'react';

import type { Resource } from '@nasnet/core/types';
import { Badge } from '@nasnet/ui/primitives';

import {
  ResourceProvider,
  ResourceLoading,
  ResourceError,
  ResourceLoaded,
  ResourceState,
  useResourceContext,
} from './ResourceProvider';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Mock resource shapes
// ============================================================================

interface WireGuardConfig {
  name: string;
  listenPort: number;
  mtu: number;
  publicKey: string;
}

function makeMockResource(
  overrides: Partial<{
    state: string;
    hasErrors: boolean;
    isRunning: boolean;
  }> = {}
): Resource<WireGuardConfig> {
  const state = (overrides.state ?? 'ACTIVE') as
    | 'DRAFT'
    | 'VALIDATING'
    | 'VALID'
    | 'APPLYING'
    | 'ACTIVE'
    | 'DEGRADED'
    | 'ERROR'
    | 'DEPRECATED'
    | 'ARCHIVED';

  return {
    uuid: '01HX5K8P7N2QRST4UVWXYZ0AB1',
    id: 'vpn.wireguard.server:wg0:a1b2',
    type: 'vpn.wireguard.server',
    category: 'VPN',
    configuration: {
      name: 'wg0',
      listenPort: 13231,
      mtu: 1420,
      publicKey: 'XHGJ7kLrP8mN3qT2vB5cF9eA4dI6wY1sO0uZpMnKjR=',
    },
    validation:
      overrides.hasErrors ?
        {
          canApply: false,
          stage: 'SEMANTIC',
          errors: [
            {
              code: 'PORT_CONFLICT',
              message: 'Port 13231 is already in use by another interface',
              field: 'listenPort',
              severity: 'ERROR',
              suggestedFix: 'Use a different port number',
            },
          ],
          warnings: [],
          conflicts: [],
          requiredDependencies: [],
          validatedAt: new Date().toISOString(),
          validationDurationMs: 142,
        }
      : {
          canApply: true,
          stage: 'COMPLETE',
          errors: [],
          warnings: [],
          conflicts: [],
          requiredDependencies: [],
          validatedAt: new Date().toISOString(),
          validationDurationMs: 142,
        },
    runtime: {
      isRunning: overrides.isRunning ?? state === 'ACTIVE',
      health:
        state === 'DEGRADED' ? 'DEGRADED'
        : state === 'ACTIVE' ? 'HEALTHY'
        : 'UNKNOWN',
      lastUpdated: new Date().toISOString(),
      activeConnections: state === 'ACTIVE' ? 3 : null,
      uptime: state === 'ACTIVE' ? '14d 6h 22m' : null,
    },
    metadata: {
      createdAt: '2025-01-15T10:00:00Z',
      createdBy: 'admin',
      updatedAt: new Date().toISOString(),
      state,
      version: 4,
      tags: ['production', 'vpn'],
      isFavorite: true,
      isPinned: false,
      description: 'Primary WireGuard server for remote access',
    },
  };
}

// ============================================================================
// Consumer component — reads from context
// ============================================================================

function ResourceDetailPanel() {
  const {
    resource,
    loading,
    error,
    state,
    runtime,
    isPending,
    isActive,
    isEditable,
    hasErrors,
    apply,
    validate,
    refresh,
  } = useResourceContext<WireGuardConfig>();

  const stateColor: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    VALIDATING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    VALID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    APPLYING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    DEGRADED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ERROR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    DEPRECATED: 'bg-muted text-muted-foreground',
    ARCHIVED: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="w-full max-w-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-base font-semibold">
          {resource?.configuration?.name ?? 'Resource'}
        </h3>
        {state && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${stateColor[state] ?? 'bg-muted'}`}
          >
            {state}
          </span>
        )}
      </div>

      {/* Loading / Error / Content */}
      <ResourceLoading>
        <div className="text-muted-foreground animate-pulse text-sm">Loading resource…</div>
      </ResourceLoading>

      <ResourceError>
        {(msg) => (
          <div className="text-destructive bg-destructive/10 rounded-md px-3 py-2 text-sm">
            {msg}
          </div>
        )}
      </ResourceError>

      <ResourceLoaded>
        <div className="space-y-3">
          {/* Runtime badges */}
          <div className="flex flex-wrap gap-1.5">
            {runtime?.uptime && (
              <Badge
                variant="secondary"
                className="text-xs"
              >
                Uptime: {runtime.uptime}
              </Badge>
            )}
            {runtime?.activeConnections !== null && runtime?.activeConnections !== undefined && (
              <Badge
                variant="secondary"
                className="text-xs"
              >
                {runtime.activeConnections} peer{runtime.activeConnections !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Predicates */}
          <div className="text-muted-foreground bg-muted space-y-1 rounded-md p-3 font-mono text-xs">
            <div>isPending: {String(isPending)}</div>
            <div>isActive: {String(isActive)}</div>
            <div>isEditable: {String(isEditable)}</div>
            <div>hasErrors: {String(hasErrors)}</div>
          </div>

          {/* Validation errors */}
          {hasErrors &&
            resource?.validation?.errors.map((err) => (
              <div
                key={err.code}
                className="text-destructive bg-destructive/10 rounded-md px-3 py-2 text-xs"
              >
                <span className="font-mono">[{err.field ?? 'general'}]</span> {err.message}
              </div>
            ))}

          {/* State-gated content */}
          <ResourceState states={['ACTIVE', 'DEGRADED']}>
            <div className="text-semantic-success text-xs">Resource is active on the router.</div>
          </ResourceState>

          <ResourceState states={['ERROR']}>
            <div className="text-destructive text-xs">
              Resource failed — check validation errors above.
            </div>
          </ResourceState>
        </div>
      </ResourceLoaded>

      {/* Actions */}
      <div className="border-border flex flex-wrap gap-2 border-t pt-2">
        <button
          type="button"
          onClick={() => void refresh()}
          className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-xs transition-colors"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => void validate()}
          disabled={isPending || loading}
          className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          Validate
        </button>
        <button
          type="button"
          onClick={() => void apply()}
          disabled={isPending || hasErrors || loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          Apply to Router
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Story wrapper — renders ResourceProvider + consumer panel
// ============================================================================

interface ResourceProviderDemoProps {
  /** Lifecycle state of the resource */
  state?: string;
  /** Show loading skeleton */
  loading?: boolean;
  /** Show error message */
  showError?: boolean;
  /** Resource has validation errors */
  hasErrors?: boolean;
  /** Resource is currently running */
  isRunning?: boolean;
}

function ResourceProviderDemo({
  state = 'ACTIVE',
  loading = false,
  showError = false,
  hasErrors = false,
}: ResourceProviderDemoProps) {
  const [callLog, setCallLog] = React.useState<string[]>([]);

  const logCall = (name: string) =>
    setCallLog((prev) => [`${new Date().toLocaleTimeString()} → ${name}()`, ...prev.slice(0, 4)]);

  const resource = loading || showError ? undefined : makeMockResource({ state, hasErrors });

  return (
    <div className="w-full max-w-sm space-y-6">
      <ResourceProvider
        resource={resource}
        loading={loading}
        error={showError ? 'Failed to load resource: network timeout' : undefined}
        onRefresh={async () => logCall('refresh')}
        onValidate={async () => logCall('validate')}
        onApply={async () => logCall('apply')}
        onUpdate={async () => logCall('update')}
        onRemove={async () => logCall('remove')}
      >
        <ResourceDetailPanel />
      </ResourceProvider>

      {/* Action log */}
      {callLog.length > 0 && (
        <div className="space-y-1">
          <div className="text-muted-foreground text-xs font-medium">Action log:</div>
          {callLog.map((entry, i) => (
            <div
              key={i}
              className="text-foreground/70 bg-muted rounded px-2 py-0.5 font-mono text-xs"
            >
              {entry}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof ResourceProviderDemo> = {
  title: 'Patterns/State/ResourceProvider',
  component: ResourceProviderDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
React context provider implementing the Universal State v2 8-layer resource model (ADR-012).

## What it provides

| Value | Type | Description |
|-------|------|-------------|
| \`resource\` | \`Resource<TConfig>\` | Full 8-layer resource object |
| \`loading\` | \`boolean\` | Whether data is loading |
| \`error\` | \`string\` | Error message if applicable |
| \`state\` | \`ResourceLifecycleState\` | Current lifecycle state |
| \`runtime\` | \`RuntimeState\` | Live operational data |
| \`isPending\` | \`boolean\` | VALIDATING or APPLYING |
| \`isActive\` | \`boolean\` | ACTIVE or DEGRADED |
| \`isEditable\` | \`boolean\` | DRAFT / VALID / ACTIVE / ERROR |
| \`hasErrors\` | \`boolean\` | Has validation errors |
| \`refresh\` | \`() => Promise<void>\` | Re-fetch resource |
| \`validate\` | \`() => Promise<void>\` | Trigger validation |
| \`apply\` | \`() => Promise<void>\` | Apply to router |
| \`update\` | \`(config) => Promise<void>\` | Update configuration |
| \`remove\` | \`() => Promise<void>\` | Delete resource |

## Convenience components
- **\`<ResourceLoading>\`** — renders only while loading
- **\`<ResourceError>\`** — renders only when error is set
- **\`<ResourceLoaded>\`** — renders only when data is ready
- **\`<ResourceState states={[…]}>\`** — renders for specific lifecycle states

## Access in consumers
\`\`\`tsx
function ResourceActions() {
  const { state, apply, isPending, hasErrors } = useResourceContext();

  return (
    <Button
      onClick={() => apply()}
      disabled={isPending || hasErrors || state !== 'VALID'}
    >
      Apply to Router
    </Button>
  );
}
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    state: {
      control: 'select',
      options: [
        'DRAFT',
        'VALIDATING',
        'VALID',
        'APPLYING',
        'ACTIVE',
        'DEGRADED',
        'ERROR',
        'DEPRECATED',
        'ARCHIVED',
      ],
      description: 'Resource lifecycle state',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state (hides resource)',
    },
    showError: {
      control: 'boolean',
      description: 'Show error state (hides resource)',
    },
    hasErrors: {
      control: 'boolean',
      description: 'Resource has validation errors',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResourceProviderDemo>;

// ============================================================================
// Stories
// ============================================================================

/**
 * An ACTIVE resource running on the router with live runtime data.
 */
export const ActiveResource: Story = {
  name: 'Active Resource',
  args: {
    state: 'ACTIVE',
    loading: false,
    showError: false,
    hasErrors: false,
  },
};

/**
 * A DRAFT resource — not yet validated, editable.
 */
export const DraftResource: Story = {
  name: 'Draft Resource',
  args: {
    state: 'DRAFT',
    loading: false,
    showError: false,
    hasErrors: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'DRAFT state: not validated yet. isEditable=true, isActive=false, isPending=false. ' +
          'The Apply button is disabled because hasErrors would need to be false and state would need to be VALID.',
      },
    },
  },
};

/**
 * A resource mid-validation — isPending=true, actions disabled.
 */
export const ValidatingResource: Story = {
  name: 'Validating (Pending)',
  args: {
    state: 'VALIDATING',
    loading: false,
    showError: false,
    hasErrors: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'isPending=true when state is VALIDATING or APPLYING. Actions that mutate the ' +
          'resource should be disabled during pending states.',
      },
    },
  },
};

/**
 * A DEGRADED resource — running but with issues.
 */
export const DegradedResource: Story = {
  name: 'Degraded Resource',
  args: {
    state: 'DEGRADED',
    loading: false,
    showError: false,
    hasErrors: false,
  },
};

/**
 * An ERROR state resource with validation errors shown inline.
 */
export const ResourceWithErrors: Story = {
  name: 'Resource With Validation Errors',
  args: {
    state: 'ERROR',
    loading: false,
    showError: false,
    hasErrors: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'hasErrors=true causes the Apply button to be disabled and displays ' +
          'the error messages from resource.validation.errors.',
      },
    },
  },
};

/**
 * Loading state — ResourceLoading renders, ResourceLoaded does not.
 */
export const LoadingState: Story = {
  name: 'Loading State',
  args: {
    loading: true,
    showError: false,
    hasErrors: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When loading=true, the <ResourceLoading> convenience component renders ' +
          'its children and <ResourceLoaded> does not.',
      },
    },
  },
};

/**
 * Error state — ResourceError renders with the error message.
 */
export const ErrorState: Story = {
  name: 'Fetch Error State',
  args: {
    loading: false,
    showError: true,
    hasErrors: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When error is set, the <ResourceError> convenience component renders ' +
          'with a function child that receives the error string.',
      },
    },
  },
};
