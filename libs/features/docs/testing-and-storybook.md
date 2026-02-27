# Testing and Storybook

This document covers the testing strategy and Storybook documentation practices across the `libs/features/` modules.

## Table of Contents

1. [Testing Strategy Overview](#1-testing-strategy-overview)
2. [Test File Inventory](#2-test-file-inventory)
3. [Unit Test Patterns](#3-unit-test-patterns)
4. [Component Test Patterns](#4-component-test-patterns)
5. [XState Machine Testing](#5-xstate-machine-testing)
6. [Accessibility Testing](#6-accessibility-testing)
7. [Platform Presenter Testing](#7-platform-presenter-testing)
8. [Hook Testing Patterns](#8-hook-testing-patterns)
9. [Integration Test Patterns](#9-integration-test-patterns)
10. [Storybook Setup and Configuration](#10-storybook-setup-and-configuration)
11. [Story File Inventory](#11-story-file-inventory)
12. [Story Writing Patterns](#12-story-writing-patterns)
13. [Code Coverage Expectations](#13-code-coverage-expectations)
14. [CI Integration](#14-ci-integration)

---

## 1. Testing Strategy Overview

NasNetConnect follows the testing trophy model: a heavy base of unit tests, a solid layer of component tests, and targeted integration/E2E tests.

| Layer | Tool | Scope |
|-------|------|-------|
| Unit tests | Vitest | Pure functions, schemas, utilities, XState machines |
| Component tests | Vitest + React Testing Library | Individual components, hooks, rendering |
| Accessibility tests | Vitest + vitest-axe + axe-core | WCAG AAA compliance, semantic HTML |
| Platform presenter tests | Vitest + `usePlatform` mock | Mobile vs Desktop rendering branches |
| Integration tests | Vitest + Apollo MockProvider | Full component tree with mocked GraphQL |
| Performance tests | Vitest | Render performance benchmarks |
| E2E tests | Playwright | Multi-browser full-stack flows |
| Go unit tests | `go test` | Backend services, parsers, adapters |

All frontend test files use Vitest (`vitest` package), not Jest. Vitest provides native ESM support and is 4x faster. Test files are co-located with the source files they test.

---

## 2. Test File Inventory

The following table lists all test files found across `libs/features/`:

### dashboard

| Test File | Type | What It Tests |
|-----------|------|---------------|
| `src/logs/LogViewer.test.tsx` | Component | LogViewer rendering and filtering |
| `src/components/ResourceGauges/CircularGauge.test.tsx` | Component | Circular gauge rendering and props |
| `src/components/BandwidthChart/utils.test.ts` | Unit | Chart utility functions |
| `src/components/BandwidthChart/BandwidthChart.perf.test.tsx` | Performance | Render performance benchmark |
| `src/components/BandwidthChart/useBandwidthHistory.test.tsx` | Hook | Bandwidth history data hook |
| `src/components/InterfaceGrid/useInterfaces.test.tsx` | Hook | Interface list data hook |
| `src/components/RecentLogs/RecentLogs.test.tsx` | Component | RecentLogs widget rendering |
| `src/components/RecentLogs/useLogStream.test.tsx` | Hook | Log streaming hook |
| `src/components/ResourceGauges/useResourceMetrics.test.ts` | Hook | Resource metrics data hook |
| `src/components/router-health-summary-card/health-utils.test.ts` | Unit | Health calculation utilities |
| `src/pages/DashboardPage.test.tsx` | Component | DashboardPage integration |
| `src/stores/chart-preferences.store.test.ts` | Unit | Zustand chart preferences store |
| `components/ConnectedDevices/ConnectedDevices.test.tsx` | Component | Connected devices widget |
| `components/ConnectedDevices/ConnectedDevices.a11y.test.tsx` | Accessibility | WCAG AAA compliance for all states |
| `hooks/useConnectedDevices.test.tsx` | Hook | Connected devices data hook |

### diagnostics

| Test File | Type | What It Tests |
|-----------|------|---------------|
| `src/components/DnsLookupTool/dnsLookup.utils.test.ts` | Unit | DNS lookup utility functions |
| `src/components/DnsLookupTool/dnsLookup.schema.test.ts` | Unit | DNS lookup Zod schema |
| `src/components/DnsLookupTool/DnsLookupTool.test.tsx` | Component | DNS lookup tool rendering |
| `src/components/DnsLookupTool/useDnsLookup.test.tsx` | Hook | DNS lookup hook |
| `src/components/PingTool/ping.utils.test.ts` | Unit | Ping utility functions |
| `src/components/PingTool/ping.schema.test.ts` | Unit | Ping Zod schema |
| `src/components/PingTool/PingTool.test.tsx` | Component | PingTool rendering |
| `src/components/PingTool/PingStatistics.test.tsx` | Component | Statistics display |
| `src/components/PingTool/LatencyGraph.test.tsx` | Component | Latency graph rendering |
| `src/components/PingTool/usePing.test.ts` | Hook | Ping execution hook |
| `src/components/TracerouteTool/traceroute.schema.test.ts` | Unit | Traceroute Zod schema |
| `src/components/TracerouteTool/TracerouteTool.test.tsx` | Component | Traceroute tool rendering |
| `src/components/TroubleshootWizard/StepAnnouncer.test.tsx` | Component | ARIA announcer behavior |
| `src/components/TroubleshootWizard/WizardSummary.test.tsx` | Component | Summary rendering |
| `src/components/DeviceScan/DeviceDetailPanel.test.tsx` | Component | Device detail panel |
| `src/components/DeviceScan/DeviceDiscoveryTable.test.tsx` | Component | Device table rendering |
| `src/components/DeviceScan/useDeviceScan.test.tsx` | Hook | Device scan hook |
| `src/components/RouteLookupTool/routeLookup.schema.test.ts` | Unit | Route lookup schema |
| `src/services/diagnostic-executor.test.ts` | Unit | Diagnostic step execution |
| `src/services/fix-applicator.test.ts` | Unit | Fix application service |
| `src/utils/network-detection.test.ts` | Unit | Network detection utilities |
| `src/utils/isp-detection.test.ts` | Unit | ISP detection utilities |
| `src/hooks/useTraceroute.test.tsx` | Hook | Traceroute hook |
| `src/machines/ping-machine.test.ts` | XState | Ping machine state transitions |

### network

| Test File | Type | What It Tests |
|-----------|------|---------------|
| `src/dhcp/utils/pool-calculator.test.ts` | Unit | DHCP pool calculation |
| `src/dns/utils/dns-utils.test.ts` | Unit | DNS utility functions |
| `src/dns/schemas/dns-settings.schema.test.ts` | Unit | DNS settings Zod schema |
| `src/dns/schemas/dns-static-entry.schema.test.ts` | Unit | DNS static entry schema |
| `src/dns/components/dns-settings-form/DnsSettingsForm.test.tsx` | Component | DNS form rendering |
| `src/dns/pages/DnsPage.integration.test.tsx` | Integration | DNS page with mocked GraphQL |
| `src/components/ip-address/validation.test.ts` | Unit | IP address validation |
| `src/components/ip-address/IPAddressList/IPAddressList.test.tsx` | Component | IP address list |
| `src/components/interface-list/InterfaceList.test.tsx` | Component | Interface list rendering |
| `src/components/interface-list/BatchConfirmDialog.test.tsx` | Component | Batch confirm dialog |
| `src/components/interface-edit/InterfaceEditForm.test.tsx` | Component | Interface edit form |
| `src/bridges/components/bridge-list/BridgeList.test.tsx` | Component | Bridge list rendering |
| `src/bridges/components/bridge-port-diagram/BridgePortDiagram.test.tsx` | Component | Port diagram rendering |
| `src/wan/components/wan-configuration/DhcpClientForm.test.tsx` | Component | DHCP client form |
| `src/wan/components/wan-configuration/PppoeWizard.test.tsx` | Component | PPPoE configuration wizard |
| `src/wan/components/wan-configuration/HealthCheckForm.test.tsx` | Component | WAN health check form |
| `src/wan/components/wan-configuration/LteModemForm.test.tsx` | Component | LTE modem form |
| `src/vlans/schemas/vlan.schema.test.ts` | Unit | VLAN Zod schema |
| `src/vlans/components/vlan-list/VlanList.test.tsx` | Component | VLAN list rendering |

### firewall

| Test File | Type | What It Tests |
|-----------|------|---------------|
| `src/components/FilterRulesTable.test.tsx` | Component | Filter rules table |
| `src/components/AddServiceDialog.test.tsx` | Component | Add service dialog |
| `src/hooks/use-rule-navigation.test.ts` | Hook | Rule navigation hook |
| `src/pages/ServicePortsPage.test.tsx` | Component | Service ports page |
| `src/pages/RateLimitingPage.test.tsx` | Component | Rate limiting page |
| `src/services/__tests__/counterHistoryStorage.test.ts` | Unit | Counter history storage |

### alerts

| Test File | Type | What It Tests |
|-----------|------|---------------|
| `src/components/InAppNotificationPreferences.test.tsx` | Component | Notification preferences |
| `src/components/EmailChannelFormDesktop.test.tsx` | Component | Email channel form (desktop) |
| `src/components/EmailChannelForm.test.tsx` | Component | Email channel form (shared) |
| `src/components/alert-templates/AlertTemplateApplyDialog.test.tsx` | Component | Template apply dialog |
| `src/components/alert-templates/AlertTemplateVariableInputForm.test.tsx` | Component | Variable input form |
| `src/components/QuietHoursConfig/useQuietHoursConfig.test.ts` | Hook | Quiet hours config hook |
| `src/components/QuietHoursConfig/QuietHoursConfig.test.tsx` | Component | Quiet hours config UI |
| `src/components/QuietHoursConfig/TimezoneSelector.test.tsx` | Component | Timezone selector |
| `src/schemas/alert-rule.schema.test.ts` | Unit | Alert rule Zod schema |
| `src/schemas/alert-rule-template.schema.test.ts` | Unit | Alert rule template schema |
| `src/schemas/email-config.schema.test.ts` | Unit | Email config schema |
| `src/hooks/usePushoverUsage.test.tsx` | Hook | Pushover usage hook |

### services

| Test File | Type | What It Tests |
|-----------|------|---------------|
| `src/components/PortRegistryView.test.tsx` | Component | Port registry view |
| `src/components/ChangelogModal.test.tsx` | Component | Changelog modal |
| `src/components/StopDependentsDialog.test.tsx` | Component | Stop dependents dialog |
| `src/components/ServiceLogViewer/ServiceLogViewer.integration.test.tsx` | Integration | Log viewer with mock API |
| `src/components/DiagnosticsPanel/DiagnosticsPanel.integration.test.tsx` | Integration | Diagnostics panel with mock API |
| `src/components/storage/StorageSettings.a11y.test.tsx` | Accessibility | WCAG AAA for storage settings |
| `src/components/ServiceConfigForm/fields/TextField.test.tsx` | Component | Text field component |
| `src/components/ServiceConfigForm/fields/TextArea.test.tsx` | Component | Text area component |
| `src/components/ServiceConfigForm/fields/PasswordField.test.tsx` | Component | Password field component |
| `src/components/ServiceConfigForm/fields/NumberField.test.tsx` | Component | Number field component |
| `src/components/ServiceConfigForm/ServiceConfigForm.platform.test.tsx` | Platform | Mobile/Desktop presenter switching |
| `src/pages/ServiceDetailPage.test.tsx` | Component | Service detail page |
| `src/pages/ServicesPage.test.tsx` | Component | Services list page |
| `src/pages/DeviceRoutingPage.test.tsx` | Component | Device routing page |
| `src/hooks/useServiceAlertToasts.test.ts` | Hook | Service alert toasts hook |

### logs, wireless, router-discovery

| Test File | Type | What It Tests |
|-----------|------|---------------|
| `logs/src/actions/logActionRegistry.test.ts` | Unit | Log action registry |
| `logs/src/correlation/useLogCorrelation.test.ts` | Hook | Log correlation hook |
| `logs/src/bookmarks/useLogBookmarks.test.ts` | Hook | Log bookmarks hook |
| `logs/src/cache/logCache.test.ts` | Unit | Log cache implementation |
| `wireless/src/data/wirelessOptions.test.ts` | Unit | Wireless option data |
| `router-discovery/src/services/scanService.test.ts` | Unit | Network scan service |
| `router-discovery/src/components/NetworkScanner.test.tsx` | Component | Network scanner UI |
| `router-discovery/src/components/ManualRouterEntry.test.tsx` | Component | Manual entry form |
| `router-discovery/src/components/CredentialDialog.test.tsx` | Component | Credential dialog |

---

## 3. Unit Test Patterns

Unit tests target pure functions: schema validators, utility functions, and data transformations. They use no React rendering.

```typescript
// Example: libs/features/diagnostics/src/utils/network-detection.test.ts

import { describe, it, expect } from 'vitest';
import { detectNetworkType } from './network-detection';

describe('detectNetworkType', () => {
  it('returns LTE when interface name starts with lte', () => {
    expect(detectNetworkType('lte1-1')).toBe('lte');
  });

  it('returns PPPOE when interface is pppoe-out', () => {
    expect(detectNetworkType('pppoe-out1')).toBe('pppoe');
  });
});
```

### Schema Tests

All Zod schemas have dedicated test files:

```typescript
// Example: libs/features/network/src/dns/schemas/dns-settings.schema.test.ts

import { describe, it, expect } from 'vitest';
import { dnsSettingsSchema } from './dns-settings.schema';

describe('dnsSettingsSchema', () => {
  it('accepts valid DNS server IPs', () => {
    const result = dnsSettingsSchema.safeParse({
      servers: ['8.8.8.8', '1.1.1.1'],
      cacheMaxTtl: 3600,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid IP addresses', () => {
    const result = dnsSettingsSchema.safeParse({ servers: ['not-an-ip'] });
    expect(result.success).toBe(false);
  });
});
```

---

## 4. Component Test Patterns

Component tests use React Testing Library with Vitest. Mocking follows the `vi.mock()` pattern:

```typescript
// Example: libs/features/dashboard/components/ConnectedDevices/ConnectedDevices.test.tsx

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ConnectedDevices } from './ConnectedDevices';
import * as connectedDevicesHook from '../../hooks/useConnectedDevices';

vi.mock('../../hooks/useConnectedDevices');

describe('ConnectedDevices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows device count when populated', () => {
    vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
      devices: mockDevices,
      totalCount: 3,
      isLoading: false,
      error: null,
      isDhcpEnabled: true,
      isEmpty: false,
      lastUpdated: new Date(),
    });

    render(<ConnectedDevices routerIp="192.168.88.1" />);
    expect(screen.getByText('3 devices online')).toBeInTheDocument();
  });
});
```

### QueryClient Wrapper

When components use React Query or Apollo, wrap with a test provider:

```typescript
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

render(<ConnectedDevices routerIp="192.168.88.1" />, { wrapper: createWrapper() });
```

---

## 5. XState Machine Testing

XState machines are tested with `createActor` from the `xstate` package. Tests verify state transitions and context updates.

```typescript
// libs/features/diagnostics/src/machines/ping-machine.test.ts

import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { pingMachine } from './ping-machine';

describe('ping-machine', () => {
  it('starts in idle state', () => {
    const actor = createActor(pingMachine);
    actor.start();
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('transitions idle → running on START', () => {
    const actor = createActor(pingMachine);
    actor.start();
    actor.send({ type: 'START', target: '8.8.8.8', count: 5 });
    expect(actor.getSnapshot().value).toBe('running');
    expect(actor.getSnapshot().context.target).toBe('8.8.8.8');
  });

  it('completes after count results received', () => {
    const actor = createActor(pingMachine);
    actor.start();
    actor.send({ type: 'START', target: '8.8.8.8', count: 2 });
    actor.send({ type: 'RESULT_RECEIVED', result: mockResult(1, 12.5) });
    actor.send({ type: 'RESULT_RECEIVED', result: mockResult(2, 14.2) });
    expect(actor.getSnapshot().value).toBe('complete');
  });

  it('handles timeout results in statistics', () => {
    const actor = createActor(pingMachine);
    actor.start();
    actor.send({ type: 'START', target: '8.8.8.8', count: 4 });
    actor.send({ type: 'RESULT_RECEIVED', result: mockResult(1, 12.5) });
    actor.send({ type: 'RESULT_RECEIVED', result: mockResult(2, null, 'timeout') });
    actor.send({ type: 'RESULT_RECEIVED', result: mockResult(3, 14.2) });
    actor.send({ type: 'RESULT_RECEIVED', result: mockResult(4, null, 'timeout') });

    const { statistics } = actor.getSnapshot().context;
    expect(statistics.lossPercent).toBe(50);
  });
});
```

### Machine Testing Checklist

- Test initial state value
- Test every explicit event transition
- Test guard conditions (both branches)
- Test context updates on transition
- Test terminal state invariants (context preserved)
- Test restart from all terminal states

---

## 6. Accessibility Testing

Accessibility tests use `vitest-axe` which wraps `axe-core`. All feature components that render user-visible UI must pass WCAG AAA (7:1 contrast ratio).

```typescript
// libs/features/dashboard/components/ConnectedDevices/ConnectedDevices.a11y.test.tsx

import { axe } from 'vitest-axe';
import { render } from '@testing-library/react';

describe('ConnectedDevices Accessibility', () => {
  it('has no violations in populated state', async () => {
    mockReturnValue({ devices: mockDevices, isLoading: false, ... });
    const { container } = render(<ConnectedDevices routerIp="192.168.88.1" />, { wrapper });

    // @ts-expect-error - vitest-axe extends expect
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations in loading state', async () => { ... });
  it('has no violations in empty state', async () => { ... });
  it('has no violations in error state', async () => { ... });
  it('has no violations in DHCP-disabled warning state', async () => { ... });

  it('enforces WCAG AAA color contrast (7:1)', async () => {
    const { container } = render(<ConnectedDevices routerIp="192.168.88.1" />, { wrapper });
    // @ts-expect-error
    const results = await axe(container, {
      rules: { 'color-contrast-enhanced': { enabled: true } }, // WCAG AAA
    });
    expect(results).toHaveNoViolations();
  });
});
```

### Accessibility Assertions

Beyond axe, tests verify semantic structure:

```typescript
// role semantics
expect(container.querySelector('[role="region"]')).toBeInTheDocument();
expect(container.querySelector('[role="alert"]')).toBeInTheDocument();

// heading hierarchy
expect(heading.tagName).toMatch(/H[1-6]/);

// ARIA attributes
expect(menuButton).toHaveAttribute('aria-haspopup', 'menu');
expect(menuButton).toHaveAttribute('aria-expanded', 'false');

// Screen reader text
expect(getByText('3 devices online')).toBeInTheDocument(); // aria-live region
expect(container.textContent).toContain('5 minutes ago');  // stale data

// Focus management
buttons.forEach((button) => {
  const classes = button.className;
  expect(classes.includes('focus') || classes.includes('ring') || classes.includes('outline')).toBe(true);
});
```

---

## 7. Platform Presenter Testing

Platform presenter tests verify that the correct presenter (Mobile/Desktop) is rendered based on the `usePlatform` hook return value.

```typescript
// libs/features/services/src/components/ServiceConfigForm/ServiceConfigForm.platform.test.tsx

import { usePlatform } from '@nasnet/ui/layouts';

vi.mock('@nasnet/ui/layouts', () => ({ usePlatform: vi.fn() }));
const mockUsePlatform = vi.mocked(usePlatform);

describe('ServiceConfigForm - Platform Presenters', () => {
  it('uses mobile presenter on mobile platform', () => {
    mockUsePlatform.mockReturnValue('mobile');
    const { container } = render(<ServiceConfigForm formState={formState} />);
    // Mobile: simple centered div
    expect(container.querySelector('.p-4.text-center')).toBeInTheDocument();
  });

  it('uses desktop presenter on desktop platform', () => {
    mockUsePlatform.mockReturnValue('desktop');
    render(<ServiceConfigForm formState={formState} />);
    // Desktop: Card component with border class
    expect(document.querySelector('[class*="border"]')).toBeInTheDocument();
  });

  it('uses desktop presenter on tablet platform', () => {
    mockUsePlatform.mockReturnValue('tablet');
    render(<ServiceConfigForm formState={formState} />);
    expect(document.querySelector('[class*="border"]')).toBeInTheDocument();
  });

  it('switches presenter when platform changes', () => {
    mockUsePlatform.mockReturnValue('mobile');
    const { rerender } = render(<ServiceConfigForm formState={formState} />);
    expect(container.querySelector('.p-4')).toBeInTheDocument();

    mockUsePlatform.mockReturnValue('desktop');
    rerender(<ServiceConfigForm formState={formState} />);
    expect(document.querySelector('[class*="border"]')).toBeInTheDocument();
  });
});
```

**Pattern:** Always test mobile, desktop, and tablet. Verify that tablet maps to the desktop presenter (two-presenter model: mobile and desktop/tablet).

---

## 8. Hook Testing Patterns

Hook tests use `renderHook` from React Testing Library or test hooks implicitly through component tests.

```typescript
// Example: libs/features/dashboard/src/components/ResourceGauges/useResourceMetrics.test.ts

import { renderHook } from '@testing-library/react';
import { useResourceMetrics } from './useResourceMetrics';

describe('useResourceMetrics', () => {
  it('returns zero values initially', () => {
    const { result } = renderHook(() => useResourceMetrics({ routerId: 'r1' }));
    expect(result.current.cpu).toBe(0);
    expect(result.current.memory).toBe(0);
  });

  it('calculates memory percentage correctly', () => {
    mockApolloData({ totalMemory: 128, usedMemory: 64 });
    const { result } = renderHook(() => useResourceMetrics({ routerId: 'r1' }));
    expect(result.current.memoryPercent).toBe(50);
  });
});
```

---

## 9. Integration Test Patterns

Integration tests render full component trees with mocked GraphQL responses:

```typescript
// libs/features/services/src/components/ServiceLogViewer/ServiceLogViewer.integration.test.tsx

import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import { ServiceLogViewer } from './ServiceLogViewer';
import { GET_SERVICE_LOGS } from '@nasnet/api-client/queries';

const mocks = [
  {
    request: { query: GET_SERVICE_LOGS, variables: { serviceId: 'tor-1', limit: 100 } },
    result: {
      data: {
        serviceLogs: {
          entries: [{ timestamp: '2024-01-01T00:00:00Z', level: 'INFO', message: 'Bootstrapped 100%' }],
        },
      },
    },
  },
];

describe('ServiceLogViewer Integration', () => {
  it('renders log entries from GraphQL', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ServiceLogViewer serviceId="tor-1" routerId="r1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Bootstrapped 100%')).toBeInTheDocument();
    });
  });
});
```

---

## 10. Storybook Setup and Configuration

NasNetConnect uses Storybook 10.2.7 (ESM-only). Three Storybook instances serve different library layers:

| Instance | Command | Port | Stories Source |
|----------|---------|------|----------------|
| connect app | `npx nx run connect:storybook` | 6006 | `apps/connect/src/**/*.stories.tsx` |
| ui-primitives | `npx nx run ui-primitives:storybook` | 4400 | `libs/ui/primitives/src/**/*.stories.tsx` |
| ui-patterns | `npx nx run ui-patterns:storybook` | 4401 | `libs/ui/patterns/src/**/*.stories.tsx` |

Feature module stories are only served by the `connect` app Storybook instance. The features in `libs/features/` do not have their own `.storybook/` directories.

### Connect App Storybook Config

File: `apps/connect/.storybook/main.ts`

```typescript
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-a11y',   // accessibility panel
    '@storybook/addon-docs',   // autodocs
  ],
  framework: { name: '@storybook/react-vite', options: {} },
};
```

The `viteFinal` function maps 18 path aliases (all `@nasnet/*` imports) to their source directories so stories can import feature components directly.

### Preview Decorators

File: `apps/connect/.storybook/preview.tsx`

Every story is automatically wrapped with the full provider tree:

```typescript
decorators: [
  (Story, context) => (
    <MockApolloProvider>              // mocked GraphQL
      <QueryClientProvider client={queryClient}>  // React Query
        <I18nProvider>
          <PlatformProvider>          // usePlatform hook
            <AnimationProvider>
              <ToastProvider>
                <div className={isDark ? 'dark' : ''}>
                  <div className="p-4 min-h-screen bg-background text-foreground">
                    <Story />
                  </div>
                </div>
              </ToastProvider>
            </AnimationProvider>
          </PlatformProvider>
        </I18nProvider>
      </QueryClientProvider>
    </MockApolloProvider>
  ),
]
```

### Viewport Presets

Three viewport presets match the platform breakpoints:

| Preset | Width | Height |
|--------|-------|--------|
| Mobile | 375px | 667px |
| Tablet | 768px | 1024px |
| Desktop | 1280px | 800px |

### Global Theme Toggle

A global theme toolbar control switches between light and dark mode. Dark mode applies the `dark` class to the root wrapper, which activates CSS variable overrides.

### Accessibility Configuration

```typescript
a11y: {
  config: {
    rules: [
      { id: 'color-contrast-enhanced', enabled: true }, // WCAG AAA 7:1
    ],
  },
},
```

The a11y addon runs axe-core on every story in the Accessibility panel.

---

## 11. Story File Inventory

The following table lists all story files in `libs/features/`:

### dashboard (14 story files)

| Story File | Component | Stories |
|-----------|-----------|---------|
| `src/pages/DashboardPage.stories.tsx` | DashboardPage | Default, Loading, Error |
| `src/components/BandwidthChart/BandwidthDataTable.stories.tsx` | BandwidthDataTable | Default, Empty, Loading |
| `src/components/BandwidthChart/CustomTooltip.stories.tsx` | CustomTooltip | Default, WithUnit |
| `src/components/BandwidthChart/TimeRangeSelector.stories.tsx` | TimeRangeSelector | Default, AllRanges |
| `src/components/cached-data-badge/CachedDataBadge.stories.tsx` | CachedDataBadge | Default, Stale, Fresh |
| `src/components/InterfaceGrid/InterfaceStatusCard.stories.tsx` | InterfaceStatusCard | Online, Offline, Loading |
| `src/components/RecentLogs/LogEntryItem.stories.tsx` | LogEntryItem | Info, Warning, Error, Debug |
| `src/components/ResourceGauges/CPUBreakdownModal.stories.tsx` | CPUBreakdownModal | Default, HighUsage |
| `src/components/ResourceGauges/CircularGauge.stories.tsx` | CircularGauge | Variants, Sizes, Colors |
| `src/components/ResourceGauges/ResourceGauges.stories.tsx` | ResourceGauges | Default, Loading |
| `src/components/dashboard-layout/DashboardLayout.stories.tsx` | DashboardLayout | Desktop, Mobile, Tablet |
| `src/components/router-health-summary-card/RouterHealthSummaryCard.stories.tsx` | RouterHealthSummaryCard | Healthy, Degraded, Critical |
| `components/ConnectedDevices/ConnectedDevices.stories.tsx` | ConnectedDevices | Default, Empty, Loading |

### diagnostics (14 story files)

| Story File | Component | Stories |
|-----------|-----------|---------|
| `src/components/DeviceScan/ScanSummary.stories.tsx` | ScanSummary | Default, InProgress, Complete |
| `src/components/DnsLookupTool/DnsLookupTool.stories.tsx` | DnsLookupTool | Default, Mobile, Desktop |
| `src/components/DnsLookupTool/DnsResults.stories.tsx` | DnsResults | A, AAAA, MX, Error |
| `src/components/DnsLookupTool/DnsServerComparison.stories.tsx` | DnsServerComparison | Default |
| `src/components/DnsLookupTool/DnsError.stories.tsx` | DnsError | Timeout, NotFound, ServerError |
| `src/components/PingTool/LatencyGraph.stories.tsx` | LatencyGraph | Default, WithLoss, Empty |
| `src/components/PingTool/PingResults.stories.tsx` | PingResults | Responding, Timeout, Mixed |
| `src/components/PingTool/PingStatistics.stories.tsx` | PingStatistics | Default, HighLoss |
| `src/components/PingTool/PingTool.stories.tsx` | PingTool | Idle, Running, Complete |
| `src/components/TracerouteTool/TracerouteHopsList.stories.tsx` | TracerouteHopsList | Default, WithTimeouts |
| `src/components/TracerouteTool/TracerouteTool.stories.tsx` | TracerouteTool | Default, Running, Complete |
| `src/components/TroubleshootWizard/StepAnnouncer.stories.tsx` | StepAnnouncer | Default |
| `src/components/TroubleshootWizard/WizardSummary.stories.tsx` | WizardSummary | AllPass, WithFailures |
| `src/components/TroubleshootWizard/TroubleshootWizard.stories.tsx` | TroubleshootWizard | Default, AutoStart, WithISPInfo, WithCloseHandler, FullConfig |

### firewall (24 story files)

| Story File | Component | Stories |
|-----------|-----------|---------|
| `src/components/AddressListEntryForm.stories.tsx` | AddressListEntryForm | Default, EditMode |
| `src/components/AddressListExportDialog.stories.tsx` | AddressListExportDialog | Default |
| `src/components/AddressListImportDialog.stories.tsx` | AddressListImportDialog | Default |
| `src/components/MasqueradeQuickDialog.stories.tsx` | MasqueradeQuickDialog | Default |
| `src/components/PortForwardWizardDialog.stories.tsx` | PortForwardWizardDialog | Default, Editing |
| `src/components/PortKnockLogViewer.stories.tsx` | PortKnockLogViewer | Default, WithEntries |
| `src/components/PortKnockSequenceManager.stories.tsx` | PortKnockSequenceManager | Default, Mobile |
| `src/components/ReadOnlyNotice.stories.tsx` | ReadOnlyNotice | Default |
| `src/components/AddToAddressListContextMenu.stories.tsx` | AddToAddressListContextMenu | Default |
| `src/components/ConnectionsPage.stories.tsx` | ConnectionsPage | Default, Loading |
| `src/components/FilterRulesTable.stories.tsx` | FilterRulesTable | Default, Desktop, Mobile |
| `src/components/ServicesStatus.stories.tsx` | ServicesStatus | Default |
| `src/components/FirewallDetailTabs.stories.tsx` | FirewallDetailTabs | Default |
| `src/components/FirewallQuickStats.stories.tsx` | FirewallQuickStats | Default |
| `src/components/RecentFirewallActivity.stories.tsx` | RecentFirewallActivity | Default, Empty |
| `src/components/RoutingTable.stories.tsx` | RoutingTable | Default |
| `src/components/FirewallStatusHero.stories.tsx` | FirewallStatusHero | Active, Warning |
| `src/components/ImportTemplateDialog.stories.tsx` | ImportTemplateDialog | Default |
| `src/components/NATRulesTable.stories.tsx` | NATRulesTable | Default |
| `src/components/PortKnockingPage.stories.tsx` | PortKnockingPage | Default |
| `src/pages/AddressListView.stories.tsx` | AddressListView | Default, Loading |
| `src/pages/NATRulesPage.stories.tsx` | NATRulesPage | Default |
| `src/pages/ManglePage.stories.tsx` | ManglePage | Default |
| `src/pages/RateLimitingPage.stories.tsx` | RateLimitingPage | Default |
| `src/pages/FirewallLogsPage.stories.tsx` | FirewallLogsPage | Default |
| `src/pages/ServicePortsPage.stories.tsx` | ServicePortsPage | Default |

### network (20 story files)

| Story File | Component | Stories |
|-----------|-----------|---------|
| `src/interface-stats/interface-comparison.stories.tsx` | InterfaceComparison | Default |
| `src/interface-stats/bandwidth-chart.stories.tsx` | BandwidthChart | Default, Loading |
| `src/interface-stats/error-rate-indicator.stories.tsx` | ErrorRateIndicator | Default, High |
| `src/pages/DnsDiagnosticsPage.stories.tsx` | DnsDiagnosticsPage | Default |
| `src/pages/InterfaceListPage.stories.tsx` | InterfaceListPage | Default, Loading |
| `src/pages/RoutesPage.stories.tsx` | RoutesPage | Default |
| `src/components/interface-detail/InterfaceDetail.stories.tsx` | InterfaceDetail | Desktop, Mobile |
| `src/components/interface-detail/InterfaceDetailDesktop.stories.tsx` | InterfaceDetailDesktop | Default |
| `src/components/interface-list/InterfaceList.stories.tsx` | InterfaceList | Default, Loading |
| `src/bridges/components/bridge-detail/BridgeDetail.stories.tsx` | BridgeDetail | Default |
| `src/bridges/components/bridge-port-diagram/AvailableInterfaces.stories.tsx` | AvailableInterfaces | Default |
| `src/bridges/components/bridge-port-diagram/PortNode.stories.tsx` | PortNode | Default, Selected |
| `src/bridges/components/bridge-stp-status/StpPortTable.stories.tsx` | StpPortTable | Default |
| `src/components/ip-address/IPAddressForm/IPAddressForm.stories.tsx` | IPAddressForm | Default |
| `src/dhcp/pages/dhcp-server-detail.stories.tsx` | DHCPServerDetail | Default |
| `src/dhcp/pages/dhcp-server-list.stories.tsx` | DHCPServerList | Default, Loading |
| `src/wan/pages/WANManagementPage.stories.tsx` | WANManagementPage | Default |
| `src/wan/components/wan-card/WANCard.stories.tsx` | WANCard | Connected, Disconnected |
| `src/wan/components/wan-history/ConnectionEventCard.stories.tsx` | ConnectionEventCard | Connected, Failed |
| `src/wan/components/wan-history/ConnectionHistoryTable.stories.tsx` | ConnectionHistoryTable | Default |
| `src/wan/components/wan-overview/WANOverviewList.stories.tsx` | WANOverviewList | Default |
| `src/wan/components/wan-configuration/LteModemForm.stories.tsx` | LteModemForm | Default |
| `src/wan/components/wan-configuration/PppoeWizard.stories.tsx` | PppoeWizard | Default |

### alerts (2 story files)

| Story File | Component | Stories |
|-----------|-----------|---------|
| `src/pages/NotificationSettingsPage.stories.tsx` | NotificationSettingsPage | Default |
| `src/components/QueuedAlertBadge.stories.tsx` | QueuedAlertBadge | Default, WithCount |

### services (20 story files)

| Story File | Component | Stories |
|-----------|-----------|---------|
| `src/components/VLANPoolConfig.stories.tsx` | VLANPoolConfig | Default |
| `src/components/ServiceConfigForm/fields/ArrayField.stories.tsx` | ArrayField | Default |
| `src/components/ServiceConfigForm/fields/TextField.stories.tsx` | TextField | Default, Error |
| `src/components/ServiceConfigForm/fields/NumberField.stories.tsx` | NumberField | Default |
| `src/components/ServiceConfigForm/fields/Select.stories.tsx` | Select | Default |
| `src/components/ServiceConfigForm/fields/MultiSelect.stories.tsx` | MultiSelect | Default |
| `src/components/ServiceConfigForm/DynamicField.stories.tsx` | DynamicField | TextField, NumberField, Select |
| `src/components/ServiceConfigForm/ServiceConfigForm.stories.tsx` | ServiceConfigForm | Default, Loading, Error |
| `src/components/ChangelogModal.stories.tsx` | ChangelogModal | Default |
| `src/components/DiagnosticsPanel/DiagnosticsPanel.stories.tsx` | DiagnosticsPanel | Default |
| `src/components/GatewayStatusCard.stories.tsx` | GatewayStatusCard | Connected, Disconnected |
| `src/components/PortRegistryView.stories.tsx` | PortRegistryView | Default |
| `src/components/ResourceLimitsForm.stories.tsx` | ResourceLimitsForm | Default |
| `src/components/ServiceAlertsTab.stories.tsx` | ServiceAlertsTab | Default |
| `src/components/UpdateAllPanel.stories.tsx` | UpdateAllPanel | Default |
| `src/components/service-traffic/ServiceTrafficPanel.stories.tsx` | ServiceTrafficPanel | Default |
| `src/components/storage/StorageDisconnectBanner.stories.tsx` | StorageDisconnectBanner | Default |
| `src/components/storage/StorageUsageBar.stories.tsx` | StorageUsageBar | Default, Full |
| `src/components/storage/StorageSettings.stories.tsx` | StorageSettings | Default |
| `src/components/templates/TemplateFilters.stories.tsx` | TemplateFilters | Default |
| `src/pages/DeviceRoutingPage.stories.tsx` | DeviceRoutingPage | Default |
| `src/pages/ServiceDetailPage.stories.tsx` | ServiceDetailPage | Default, Loading |
| `src/pages/ServicesPage.stories.tsx` | ServicesPage | Default, Loading |
| `src/pages/VLANSettingsPage.stories.tsx` | VLANSettingsPage | Default |

### wireless and router-discovery

| Story File | Component | Stories |
|-----------|-----------|---------|
| `wireless/src/components/SecurityLevelBadge.stories.tsx` | SecurityLevelBadge | WPA3, WPA2, Open |
| `wireless/src/components/SecurityProfileSection.stories.tsx` | SecurityProfileSection | Default |
| `wireless/src/components/WirelessInterfaceDetail.stories.tsx` | WirelessInterfaceDetail | Default |
| `router-discovery/src/components/ManualRouterEntry.stories.tsx` | ManualRouterEntry | Default, Error |
| `router-discovery/src/components/RouterCard.stories.tsx` | RouterCard | Default, Connecting |

---

## 12. Story Writing Patterns

### Meta Configuration

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { TroubleshootWizard } from './TroubleshootWizard';

const meta: Meta<typeof TroubleshootWizard> = {
  title: 'Features/Diagnostics/TroubleshootWizard',
  component: TroubleshootWizard,
  tags: ['autodocs'],           // enable automatic docs page
  parameters: {
    layout: 'fullscreen',       // or 'centered' for compact components
    docs: {
      description: {
        component: 'Describe the component and its platform behavior.',
      },
    },
  },
  argTypes: {
    routerId: { control: 'text' },
    autoStart: { control: 'boolean' },
    onClose: { action: 'onClose' },  // action logger
  },
};

export default meta;
type Story = StoryObj<typeof TroubleshootWizard>;
```

### Story Export Pattern

```typescript
export const Default: Story = {
  args: {
    routerId: 'router-00000000-0000-0000-0000-000000000001',
    autoStart: false,
  },
  parameters: {
    docs: { description: { story: 'Description of this specific story.' } },
    viewport: { defaultViewport: 'desktop' },
  },
};

export const MobileView: Story = {
  ...Default,
  parameters: {
    viewport: { defaultViewport: 'mobile' },
  },
};
```

### Mandatory Story Variants

Every component should have stories for:
1. **Default** - normal operating state with realistic data
2. **Loading** - skeleton or spinner state
3. **Empty** - zero data state
4. **Error** - error state with message
5. **Mobile** - `viewport: { defaultViewport: 'mobile' }` (for platform-adaptive components)

### Actions

Use `{ action: 'handlerName' }` in argTypes for all callback props. This logs calls to the Storybook Actions panel without needing manual `vi.fn()`.

```typescript
argTypes: {
  onClose: { action: 'onClose' },
  onSuccess: { action: 'onSuccess' },
  onChange: { action: 'onChange' },
}
```

---

## 13. Code Coverage Expectations

| Feature Module | Target Coverage |
|---------------|-----------------|
| Schema validators | 90%+ line coverage |
| Utility functions | 85%+ line coverage |
| XState machines | 80%+ state/transition coverage |
| Component rendering | 70%+ branch coverage |
| Accessibility | 100% of user-facing components |
| Platform presenter | 100% of presenter-switching components |

Coverage is collected via Vitest's built-in coverage reporter (`@vitest/coverage-v8`).

---

## 14. CI Integration

Tests run in the following order in CI:

```yaml
# .github/workflows/main.yml
- Lint (ESLint + Biome)
- TypeScript typecheck
- Unit + Component tests (Vitest)
- Accessibility checks (Pa11y CLI)
- Build (Vite)
- E2E tests (Playwright, all browsers)
- Go tests (go test ./...)
- Go lint (golangci-lint, scoped)
- Docker build + size check
```

The accessibility check (`Pa11y`) is a **blocking gate** - any WCAG violation fails the build. This runs against a production build of the connect app.

### Running Tests Locally

```bash
# All frontend tests
npx nx run-many -t test

# Specific feature module
npx nx test features-diagnostics

# With coverage
npx nx test features-network --coverage

# Watch mode
npx nx test connect --watch

# Go tests
npx nx run backend:test
go test ./internal/specific_package/...   # scoped (preferred)

# E2E tests
npx nx e2e connect-e2e
npx nx e2e connect-e2e --headed           # with browser UI
```

### Storybook Build Verification

```bash
# Build all Storybooks (verifies stories don't break)
npx nx run-many -t build-storybook

# Health check
npx storybook doctor
```

---

## Cross-References

- Component architecture (3-layer model): `Docs/design/ux-design/6-component-library.md`
- Platform presenter implementation: `Docs/design/PLATFORM_PRESENTER_GUIDE.md`
- Accessibility requirements (WCAG AAA): `Docs/design/ux-design/8-responsive-design-accessibility.md`
- Backend testing strategy: `Docs/architecture/implementation-patterns/testing-strategy-patterns.md`
- Feature module overview: `libs/features/docs/intro.md`
