/**
 * DnsPage Storybook Stories
 *
 * Page-level stories for the DNS Configuration page (NAS-6.4).
 *
 * NOTE: DnsPage reads the router ID from the URL via `useParams({ from: '/router/$id' })` and
 * fetches data through Apollo Client. In Storybook these dependencies are provided by global
 * decorators (MockedProvider + router stub). The stories below focus on the visual states
 * that are possible once data has resolved or failed.
 *
 * For interactive E2E testing of the full data-fetch flow, see the integration test file
 * `DnsPage.integration.test.tsx` which uses MSW + MockedProvider.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '@nasnet/ui/primitives';
import { Alert, AlertTitle, AlertDescription, Button } from '@nasnet/ui/primitives';
import { AlertTriangle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Lightweight stand-ins used to represent each visual state of DnsPage
// without requiring live Apollo / router context in the Storybook sandbox.
// ---------------------------------------------------------------------------

/**
 * Renders the loading skeleton that DnsPage shows while both DNS queries are
 * in-flight. Mirrors the exact markup from the component's `isLoading` branch.
 */
function DnsPageLoading() {
  return (
    <div className="space-y-6 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
  );
}

/**
 * Renders the error state that DnsPage shows when either GraphQL query fails
 * or the settings object is null after loading.
 */
function DnsPageError({ message = 'Unable to fetch DNS settings' }: { message?: string }) {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Failed to load DNS configuration</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Button
        onClick={() => console.log('retry clicked')}
        className="mt-4"
        aria-label="Retry loading DNS configuration"
      >
        Retry
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

/**
 * We export the loading stand-in as the Storybook component so that simple
 * states (Loading, Error) can be documented without needing Apollo context.
 * The Default story links to the live component as a usage reference.
 */
const meta: Meta = {
  title: 'Pages/Network/DnsPage',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
DNS Configuration page (NAS-6.4) – complete management interface for RouterOS DNS settings.

## Sections

| Section | Description |
|---------|-------------|
| **DNS Servers** | Reorderable list of static servers + read-only dynamic servers obtained from DHCP |
| **DNS Settings Form** | Allow Remote Requests toggle, Cache Size input, Submit button |
| **Static DNS Entries** | Hostname-to-IP mapping table with inline edit and delete actions |
| **Static Entry Dialog** | Create / edit form for individual hostname mappings |

## Data Flow
The page calls \`useDnsPage(deviceId)\` which combines \`useDNSSettings\` and
\`useDNSStaticEntries\` Apollo hooks. The device ID comes from \`useParams({ from: '/router/$id' })\`.

## Visual States
- **Loading** – Three skeleton cards while both queries are in-flight
- **Error** – Destructive alert with a Retry button when either query fails
- **Populated** – Full page with server list, settings form, and entries table
- **Empty entries** – Full page with an empty-state prompt in the entries table

> In Storybook the stories below document the **Loading** and **Error** states directly.
> The fully-populated state requires Apollo mocks; see the integration test file for that.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Loading – skeleton layout shown while both GraphQL queries are pending.
 */
export const Loading: Story = {
  render: () => <DnsPageLoading />,
  parameters: {
    docs: {
      description: {
        story:
          'Three skeleton cards are rendered while `useDnsPage` is resolving its two ' +
          'parallel GraphQL queries (DNS settings + static entries). ' +
          'The page header is not shown until data resolves.',
      },
    },
  },
};

/**
 * Error – destructive alert shown when a query fails or settings are null.
 */
export const Error: Story = {
  render: () => (
    <DnsPageError message="Network request failed: connection refused (ECONNREFUSED)" />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When either `useDNSSettings` or `useDNSStaticEntries` returns an error, ' +
          'or when `settings` is null after loading, the page replaces its content with ' +
          'a destructive Alert and a Retry button that calls `refetch()`.',
      },
    },
  },
};

/**
 * ErrorGeneric – same error UI with the default fallback message.
 */
export const ErrorGeneric: Story = {
  render: () => <DnsPageError />,
  parameters: {
    docs: {
      description: {
        story:
          'When neither the Apollo error nor the settings object provides a specific ' +
          'message, the page falls back to "Unable to fetch DNS settings".',
      },
    },
  },
};

/**
 * MobileLoadingViewport – loading state at 375 px to confirm skeleton layout is
 * responsive (full-width stacked cards, no overflow).
 */
export const MobileLoadingViewport: Story = {
  render: () => <DnsPageLoading />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Loading skeleton at mobile width (375 px). All three skeleton cards should ' +
          'be full-width with standard vertical spacing.',
      },
    },
  },
};
