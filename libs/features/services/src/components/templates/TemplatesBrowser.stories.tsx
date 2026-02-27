/**
 * TemplatesBrowser Storybook Stories
 *
 * TemplatesBrowser is a platform-adaptive component that delegates to
 * TemplatesBrowserDesktop or TemplatesBrowserMobile based on the viewport.
 * Both presenters are driven by the `useTemplatesBrowser` headless hook which
 * calls the `useServiceTemplates` Apollo hook.
 *
 * These stories render each UI state (loading, empty, populated, error,
 * mobile, desktop) using inline mock shells that mirror the real component's
 * JSX without requiring a live Apollo provider.
 */

import * as React from 'react';

import { Plus, Filter } from 'lucide-react';

import { ServiceTemplateCard , EmptyState } from '@nasnet/ui/patterns';
import {
  Button,
  Card,
  CardContent,
  Skeleton,
} from '@nasnet/ui/primitives';

import { TemplateFilters } from './TemplateFilters';

import type { TemplateBrowserFilters } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const DEFAULT_FILTERS: TemplateBrowserFilters = {
  searchQuery: '',
  category: null,
  scope: null,
  showBuiltIn: true,
  showCustom: true,
  sortBy: 'name',
};

interface MockTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  isBuiltIn: boolean;
  version: string;
  author: string | null;
  updatedAt: Date;
  services: unknown[];
  configVariables: unknown[];
  tags: string[];
}

const MOCK_TEMPLATES: MockTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Privacy Stack',
    description: 'Complete privacy setup with Tor, Psiphon, and DNS filtering for all devices on the network.',
    category: 'PRIVACY',
    isBuiltIn: true,
    version: '1.2.0',
    author: null,
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    services: [{}, {}, {}],
    configVariables: [{}, {}, {}, {}, {}],
    tags: ['privacy', 'tor', 'dns'],
  },
  {
    id: 'tpl-2',
    name: 'AdGuard Network Shield',
    description: 'Network-wide ad and tracker blocking with curated filter lists.',
    category: 'SECURITY',
    isBuiltIn: true,
    version: '2.0.1',
    author: null,
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    services: [{}],
    configVariables: [{}, {}],
    tags: ['adblock', 'dns', 'security'],
  },
  {
    id: 'tpl-3',
    name: 'Anti-Censorship Bundle',
    description: 'Multi-protocol censorship bypass with sing-box and Xray-core fallback chain.',
    category: 'ANTI_CENSORSHIP',
    isBuiltIn: true,
    version: '3.1.0',
    author: null,
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    services: [{}, {}],
    configVariables: [{}, {}, {}, {}, {}, {}, {}],
    tags: ['censorship', 'xray', 'sing-box'],
  },
  {
    id: 'tpl-4',
    name: 'Gaming Optimiser',
    description: 'Low-latency routing rules and QoS for online gaming.',
    category: 'GAMING',
    isBuiltIn: false,
    version: '1.0.0',
    author: 'CommunityUser',
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    services: [{}, {}],
    configVariables: [{}, {}, {}],
    tags: ['gaming', 'qos', 'latency'],
  },
];

// ---------------------------------------------------------------------------
// Helper: convert mock template to ServiceTemplateCard shape
// ---------------------------------------------------------------------------

function toCardTemplate(t: MockTemplate) {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    category: t.category.toLowerCase() as any,
    scope: (t.isBuiltIn ? 'built-in' : 'custom') as 'built-in' | 'custom',
    icon: t.isBuiltIn ? '📦' : '⚙️',
    metadata: {
      serviceCount: t.services.length,
      variableCount: t.configVariables.length,
      version: t.version,
      author: t.author || undefined,
      updatedAt: t.updatedAt,
    },
    verified: t.isBuiltIn,
    tags: [...t.tags],
  };
}

const noop = () => {};

// ---------------------------------------------------------------------------
// Mock Desktop browser shell
// ---------------------------------------------------------------------------

function MockDesktopBrowser({
  templates = MOCK_TEMPLATES,
  loading = false,
  error = false,
  hasActiveFilters = false,
}: {
  templates?: MockTemplate[];
  loading?: boolean;
  error?: boolean;
  hasActiveFilters?: boolean;
}) {
  const [filters, setFilters] = React.useState<TemplateBrowserFilters>(DEFAULT_FILTERS);

  return (
    <div className="flex h-[640px] border border-border rounded-lg overflow-hidden">
      {/* Sidebar */}
      <aside
        className="w-72 border-r border-border bg-muted/10 p-6 overflow-y-auto shrink-0"
        aria-label="Template filters"
      >
        <h2 className="text-lg font-semibold mb-6">Filters</h2>
        <TemplateFilters
          filters={filters}
          onFiltersChange={(p) => setFilters((prev) => ({ ...prev, ...p }))}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          hasActiveFilters={hasActiveFilters}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" aria-label="Service templates">
        <div className="border-b border-border bg-background p-6 sticky top-0 z-10">
          <h1 className="text-2xl font-bold">Service Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading
              ? 'Loading templates…'
              : `${templates.length} template${templates.length !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {error && (
          <div className="p-6">
            <Card className="border-error" role="alert">
              <CardContent className="p-6">
                <h3 className="font-semibold text-error mb-2">
                  Failed to load templates
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Network request timed out. Check router connectivity.
                </p>
                <Button variant="outline" size="sm" onClick={noop}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {loading && !error && (
          <div
            className="p-6 grid grid-cols-2 gap-6"
            role="status"
            aria-label="Loading templates"
          >
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        )}

        {!loading && !error && templates.length === 0 && (
          <div className="flex items-center justify-center p-12">
            <EmptyState
              icon={Plus}
              title="No templates found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your filters to see more results'
                  : 'No service templates available'
              }
              action={
                hasActiveFilters
                  ? { label: 'Reset Filters', onClick: noop, variant: 'outline' as const }
                  : undefined
              }
            />
          </div>
        )}

        {!loading && !error && templates.length > 0 && (
          <div
            className="p-6 grid grid-cols-2 gap-6"
            role="list"
            aria-label="Service templates list"
          >
            {templates.map((t) => (
              <ServiceTemplateCard
                key={t.id}
                template={toCardTemplate(t)}
                actions={[
                  { id: 'install', label: 'Install', onClick: noop, variant: 'default' },
                  { id: 'details', label: 'View Details', onClick: noop, variant: 'outline' },
                ]}
                onClick={noop}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mock Mobile browser shell
// ---------------------------------------------------------------------------

function MockMobileBrowser({
  templates = MOCK_TEMPLATES,
  loading = false,
  error = false,
  hasActiveFilters = false,
}: {
  templates?: MockTemplate[];
  loading?: boolean;
  error?: boolean;
  hasActiveFilters?: boolean;
}) {
  return (
    <div className="flex flex-col h-[640px] w-[375px] border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background sticky top-0 z-10">
        <h1 className="text-lg font-semibold">Service Templates</h1>
        <Button variant="outline" size="default" className="min-h-[44px]" aria-label="Open filters">
          <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              !
            </span>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4">
          <div
            className="rounded-lg bg-error/10 p-4 text-error"
            role="alert"
          >
            <p className="font-medium">Failed to load templates</p>
            <p className="text-sm mt-1">Network request timed out.</p>
            <Button variant="outline" size="sm" onClick={noop} className="mt-3 min-h-[44px]">
              Retry
            </Button>
          </div>
        </div>
      )}

      {loading && !error && (
        <div className="p-4 space-y-4" role="status" aria-label="Loading templates">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!loading && !error && templates.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <EmptyState
            icon={Plus}
            title="No templates found"
            description={
              hasActiveFilters
                ? 'Try adjusting your filters to see more results'
                : 'No service templates available'
            }
            action={
              hasActiveFilters
                ? { label: 'Reset Filters', onClick: noop, variant: 'outline' as const }
                : undefined
            }
          />
        </div>
      )}

      {!loading && !error && templates.length > 0 && (
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          role="list"
          aria-label="Service templates list"
        >
          {templates.map((t) => (
            <ServiceTemplateCard
              key={t.id}
              template={toCardTemplate(t)}
              actions={[
                { id: 'install', label: 'Install', onClick: noop, variant: 'default' },
                { id: 'details', label: 'View Details', onClick: noop, variant: 'outline' },
              ]}
              onClick={noop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'Features/Services/Templates/TemplatesBrowser',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
\`TemplatesBrowser\` is the platform-adaptive root component for browsing and
installing service templates. It auto-selects between \`TemplatesBrowserDesktop\`
and \`TemplatesBrowserMobile\` based on the active viewport.

**Desktop (≥1024 px):** 2-column template grid with a left-sidebar filter panel.

**Mobile/Tablet (<1024 px):** Vertical single-column list with a bottom-sheet
filter drawer (44 px touch targets).

Both presenters share the same \`useTemplatesBrowser\` headless hook which
handles filter state, Apollo data fetching, and client-side sorting.
        `.trim(),
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Desktop — populated with four templates across multiple categories.
 */
export const DesktopDefault: Story = {
  render: () => <MockDesktopBrowser />,
  parameters: {
    docs: {
      description: {
        story: 'Desktop layout with sidebar filters and 2-column template grid.',
      },
    },
  },
};

/**
 * Desktop — skeleton loading state while templates are fetched.
 */
export const DesktopLoading: Story = {
  render: () => <MockDesktopBrowser loading templates={[]} />,
  parameters: {
    docs: {
      description: { story: 'Four skeleton cards shown during initial data fetch.' },
    },
  },
};

/**
 * Desktop — empty state when no templates match the active filters.
 */
export const DesktopEmptyFiltered: Story = {
  render: () => (
    <MockDesktopBrowser templates={[]} hasActiveFilters />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state with "Reset Filters" CTA when filters exclude all templates.',
      },
    },
  },
};

/**
 * Desktop — error state when the API request fails.
 */
export const DesktopError: Story = {
  render: () => <MockDesktopBrowser error templates={[]} />,
  parameters: {
    docs: {
      description: { story: 'Error card with Retry button when the network request fails.' },
    },
  },
};

/**
 * Mobile — populated with the same four templates in a vertical list.
 */
export const MobileDefault: Story = {
  render: () => <MockMobileBrowser />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Mobile layout (375 px) with vertical list and bottom-sheet filter button.',
      },
    },
  },
};

/**
 * Mobile — skeleton loading state.
 */
export const MobileLoading: Story = {
  render: () => <MockMobileBrowser loading templates={[]} />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: { story: 'Three skeleton cards shown on mobile during data fetch.' },
    },
  },
};
