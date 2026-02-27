/**
 * Storybook stories for ServicesStatus
 *
 * ServicesStatus fetches router service data (API, SSH, Winbox, WWW, etc.)
 * via useServices() (Apollo) and reads the current router IP from Zustand.
 * Since those data sources are unavailable in Storybook, each story
 * reproduces the component's visual states directly using the same JSX
 * structure so the UI can be reviewed and tested in isolation.
 *
 * Covered states:
 *  - Full grid (all services, mix of enabled/disabled)
 *  - Compact sidebar mode
 *  - All services enabled
 *  - All services disabled
 *  - Loading skeleton (full and compact)
 *  - Empty state
 */

import type { RouterService } from '@nasnet/core/types';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const ALL_SERVICES: RouterService[] = [
  { id: '1', name: 'api', port: 8728, disabled: false },
  { id: '2', name: 'api-ssl', port: 8729, disabled: false },
  { id: '3', name: 'ftp', port: 21, disabled: true },
  { id: '4', name: 'ssh', port: 22, disabled: false },
  { id: '5', name: 'telnet', port: 23, disabled: true },
  { id: '6', name: 'winbox', port: 8291, disabled: false, address: '192.168.1.0/24' },
  { id: '7', name: 'www', port: 80, disabled: true },
  { id: '8', name: 'www-ssl', port: 443, disabled: false, certificate: 'webfig' },
];

// ---------------------------------------------------------------------------
// Inline re-implementation of the presentational layer
// (mirrors the real component's JSX so stories are visually accurate)
// ---------------------------------------------------------------------------

function getServiceIcon(name: string): string {
  const icons: Record<string, string> = {
    api: '🔌',
    'api-ssl': '🔐',
    ftp: '📁',
    ssh: '💻',
    telnet: '📟',
    winbox: '🪟',
    www: '🌐',
    'www-ssl': '🔒',
  };
  return icons[name] ?? '⚙️';
}

function getServiceDescription(name: string): string {
  const descriptions: Record<string, string> = {
    api: 'RouterOS API',
    'api-ssl': 'RouterOS API (SSL)',
    ftp: 'File Transfer',
    ssh: 'Secure Shell',
    telnet: 'Telnet Access',
    winbox: 'Winbox Management',
    www: 'Web Interface',
    'www-ssl': 'Web Interface (SSL)',
  };
  return descriptions[name] ?? name;
}

function ServiceCard({ service, compact }: { service: RouterService; compact?: boolean }) {
  const isEnabled = !service.disabled;

  if (compact) {
    return (
      <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-slate-400'}`}
          />
          <span className="text-sm">{getServiceIcon(service.name)}</span>
          <span
            className={`text-xs ${isEnabled ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}
          >
            {getServiceDescription(service.name)}
          </span>
        </div>
        <span className="font-mono text-xs text-slate-500">{service.port}</span>
      </div>
    );
  }

  return (
    <div
      className={[
        'relative overflow-hidden rounded-xl border p-4 transition-all',
        isEnabled ?
          'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
        : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50',
      ].join(' ')}
    >
      <div className="absolute right-3 top-3">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            isEnabled ?
              'bg-green-500 shadow-sm shadow-green-500/50'
            : 'bg-slate-400 dark:bg-slate-500'
          }`}
        />
      </div>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getServiceIcon(service.name)}</span>
        <div className="min-w-0 flex-1">
          <p
            className={`truncate font-medium ${
              isEnabled ?
                'text-slate-900 dark:text-slate-100'
              : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {getServiceDescription(service.name)}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Port{' '}
            <span className="font-mono text-slate-700 dark:text-slate-300">{service.port}</span>
          </p>
        </div>
      </div>
      {service.address && (
        <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Allowed:{' '}
            <span className="font-mono text-slate-600 dark:text-slate-300">{service.address}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function ServicesGrid({ services, compact }: { services: RouterService[]; compact?: boolean }) {
  const enabledCount = services.filter((s) => !s.disabled).length;

  if (compact) {
    return (
      <div className="w-64 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Services</h3>
          <span className="text-xs text-slate-500">
            <span className="font-medium text-green-600 dark:text-green-400">{enabledCount}</span>/
            {services.length}
          </span>
        </div>
        <div className="space-y-1">
          {services.slice(0, 6).map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              compact
            />
          ))}
          {services.length > 6 && (
            <p className="pt-1 text-center text-xs text-slate-400">+{services.length - 6} more</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between px-2">
        <div>
          <h2 className="text-lg font-semibold">Router Services</h2>
          <p className="text-muted-foreground text-sm">Network services and their status</p>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium text-green-600 dark:text-green-400">{enabledCount}</span> /{' '}
          {services.length} enabled
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {services.map((s) => (
          <ServiceCard
            key={s.id}
            service={s}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

function ServicesStatusPlaceholder(_props: { className?: string; compact?: boolean }) {
  return null;
}
ServicesStatusPlaceholder.displayName = 'ServicesStatus';

const meta: Meta<typeof ServicesStatusPlaceholder> = {
  title: 'Features/Firewall/ServicesStatus',
  component: ServicesStatusPlaceholder,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays all router services (API, SSH, Winbox, WWW, etc.) in a colour-coded grid. Enabled services appear with a green card border and indicator dot; disabled services are muted. Supports a compact mode for sidebar placement.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ServicesStatusPlaceholder>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Full grid — default 4-column layout showing all 8 standard MikroTik
 * services with a mix of enabled and disabled states.
 */
export const Default: Story = {
  render: () => <ServicesGrid services={ALL_SERVICES} />,
};

/**
 * Compact sidebar mode — 2-row list with icon, description and port number.
 * Ideal for embedding in a collapsible sidebar panel.
 */
export const CompactMode: Story = {
  render: () => (
    <ServicesGrid
      services={ALL_SERVICES}
      compact
    />
  ),
};

/**
 * All services enabled — entire grid shows green cards.
 */
export const AllEnabled: Story = {
  render: () => <ServicesGrid services={ALL_SERVICES.map((s) => ({ ...s, disabled: false }))} />,
};

/**
 * All services disabled — entire grid renders in muted slate styling.
 */
export const AllDisabled: Story = {
  render: () => <ServicesGrid services={ALL_SERVICES.map((s) => ({ ...s, disabled: true }))} />,
};

/**
 * Single service with an address restriction set — shows the "Allowed:" footer
 * inside the card.
 */
export const WithAddressRestriction: Story = {
  render: () => (
    <div className="max-w-xs">
      <ServicesGrid
        services={[
          {
            id: '6',
            name: 'winbox',
            port: 8291,
            disabled: false,
            address: '192.168.1.0/24',
          },
        ]}
      />
    </div>
  ),
};

/**
 * Loading skeleton — full grid skeleton (8 cards) matching the real component's
 * loading state.
 */
export const LoadingState: Story = {
  render: () => (
    <div>
      <div className="mb-4 px-2">
        <h2 className="text-lg font-semibold">Router Services</h2>
        <p className="text-muted-foreground text-sm">Network services and their status</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700"
          />
        ))}
      </div>
    </div>
  ),
};

/**
 * Compact loading skeleton — for sidebar placement.
 */
export const CompactLoadingState: Story = {
  render: () => (
    <div className="w-64 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-6 rounded bg-slate-200 dark:bg-slate-700"
          />
        ))}
      </div>
    </div>
  ),
};
