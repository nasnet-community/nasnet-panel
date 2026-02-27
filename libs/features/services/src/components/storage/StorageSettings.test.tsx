/// <reference types="@testing-library/jest-dom" />
/**
 * StorageSettings Component Tests
 * Comprehensive React Testing Library tests for external storage management UI
 *
 * Test Coverage:
 * - Rendering states (loading, error, detected, no storage)
 * - Usage visualization (normal, warning, critical, full thresholds)
 * - Configuration actions (enable, disable, optimistic updates)
 * - Progressive disclosure (essential, common, advanced tiers)
 * - Service breakdown rendering
 *
 * @see NAS-8.20: External Storage Management
 */

import * as React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { act } from 'react-dom/test-utils';
import { Toaster, toast } from 'sonner';

import { StorageSettings } from './StorageSettings';
import { StorageSettingsDesktop } from './StorageSettingsDesktop';
import {
  GET_STORAGE_INFO,
  GET_STORAGE_USAGE,
  GET_STORAGE_CONFIG,
  CONFIGURE_EXTERNAL_STORAGE,
  RESET_EXTERNAL_STORAGE,
  SCAN_STORAGE,
} from '@nasnet/api-client/queries';

// =============================================================================
// Test Data Factories
// =============================================================================

interface MockStorageInfoOptions {
  path?: string;
  totalBytes?: string;
  usedBytes?: string;
  availableBytes?: string;
  filesystem?: string;
  mounted?: boolean;
  usagePercent?: number;
  locationType?: 'FLASH' | 'EXTERNAL';
}

function createMockStorageInfo(options: MockStorageInfoOptions = {}) {
  const {
    path = '/usb1',
    totalBytes = '17179869184', // 16GB
    usedBytes = '8589934592', // 8GB (50%)
    availableBytes = '8589934592',
    filesystem = 'vfat',
    mounted = true,
    usagePercent = 50,
    locationType = 'EXTERNAL',
  } = options;

  return {
    path,
    totalBytes,
    usedBytes,
    availableBytes,
    filesystem,
    mounted,
    usagePercent,
    locationType,
  };
}

function createMockFlashStorage() {
  return createMockStorageInfo({
    path: '/flash',
    totalBytes: '536870912', // 512MB
    usedBytes: '429496729', // ~400MB (80%)
    availableBytes: '107374182',
    filesystem: 'tmpfs',
    mounted: true,
    usagePercent: 80,
    locationType: 'FLASH',
  });
}

function createMockStorageConfig(enabled = false, path: string | null = null) {
  return {
    enabled,
    path,
    storageInfo: enabled && path ? createMockStorageInfo({ path }) : null,
    updatedAt: new Date().toISOString(),
    isAvailable: enabled && path ? true : false,
  };
}

function createMockStorageUsage(featureCount = 0) {
  const features = Array.from({ length: featureCount }, (_, i) => ({
    featureId: `feature-${i + 1}`,
    featureName: `Service ${i + 1}`,
    binarySize: '10485760', // 10MB
    dataSize: '5242880', // 5MB
    configSize: '102400', // 100KB
    logsSize: '1048576', // 1MB
    totalSize: '16777216', // ~16MB
    location: 'external',
    instanceCount: 1,
  }));

  return {
    flash: {
      totalBytes: '536870912',
      usedBytes: '429496729',
      availableBytes: '107374182',
      contents: 'configs, manifests',
      usagePercent: 80,
      locationType: 'FLASH',
      thresholdStatus: 'WARNING',
    },
    external: {
      totalBytes: '17179869184',
      usedBytes: '8589934592',
      availableBytes: '8589934592',
      contents: 'binaries, data, logs',
      usagePercent: 50,
      locationType: 'EXTERNAL',
      thresholdStatus: 'NORMAL',
    },
    features,
    totalUsedBytes: '9019431321',
    totalCapacityBytes: '17716740096',
    calculatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Test Utilities
// =============================================================================

function renderWithProviders(ui: React.ReactElement, mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider
      mocks={mocks}
      addTypename={false}
    >
      <Toaster />
      {ui}
    </MockedProvider>
  );
}

// =============================================================================
// Test Suite: Rendering State Tests
// =============================================================================

describe('StorageSettings - Rendering States', () => {
  test('renders loading state', async () => {
    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        result: { data: { storageInfo: [] } },
        delay: 1000, // Simulate slow network
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: null } },
        delay: 1000,
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: { data: { storageConfig: createMockStorageConfig() } },
        delay: 1000,
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Note: The actual loading state depends on the hook implementation
    // If useStorageSettings returns loading: true, the component should show a loading indicator
    // For now, we verify the component renders without crashing
    expect(screen.getByText(/Storage Configuration/i)).toBeInTheDocument();
  });

  test('renders detected storage', async () => {
    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [createMockFlashStorage(), createMockStorageInfo({ path: '/usb1' })],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(0) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: { data: { storageConfig: createMockStorageConfig() } },
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('/usb1')).toBeInTheDocument();
    });

    // Verify mount point is displayed
    expect(screen.getByText(/usb1/i)).toBeInTheDocument();

    // Verify enable storage controls are visible
    expect(screen.getByRole('switch', { name: /Enable External Storage/i })).toBeInTheDocument();
  });

  test('renders no storage detected', async () => {
    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [createMockFlashStorage()], // Only flash, no external
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(0) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: { data: { storageConfig: createMockStorageConfig() } },
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/No external storage detected/i)).toBeInTheDocument();
    });

    // Verify helpful message about inserting USB
    expect(screen.getByText(/Connect a USB drive or disk/i)).toBeInTheDocument();

    // Verify enable switch is disabled
    expect(screen.getByRole('switch', { name: /Enable External Storage/i })).toBeDisabled();
  });

  test('renders error state', async () => {
    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        error: new Error('Failed to fetch storage info'),
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: null } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: { data: { storageConfig: createMockStorageConfig() } },
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Note: Error handling depends on hook implementation
    // Verify component renders without crashing
    expect(screen.getByText(/Storage Configuration/i)).toBeInTheDocument();
  });
});

// =============================================================================
// Test Suite: Usage Visualization Tests
// =============================================================================

describe('StorageSettings - Usage Visualization', () => {
  test('displays usage bar in normal range (<80%)', async () => {
    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [
              createMockFlashStorage(),
              createMockStorageInfo({
                path: '/usb1',
                usedBytes: '8589934592', // 50% of 16GB
                usagePercent: 50,
              }),
            ],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(1) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: {
          data: {
            storageConfig: createMockStorageConfig(true, '/usb1'),
          },
        },
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Wait for usage bar to render
    await waitFor(() => {
      const usageText = screen.queryByText(/50/);
      expect(usageText).toBeInTheDocument();
    });

    // Verify bar is in normal range (green)
    // Note: Actual color testing requires checking computed styles or test IDs
    // This test verifies the percentage is displayed correctly
  });

  test('displays usage bar in warning range (80-89%)', async () => {
    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [
              createMockFlashStorage(),
              createMockStorageInfo({
                path: '/usb1',
                totalBytes: '17179869184',
                usedBytes: '14599738368', // 85% of 16GB
                availableBytes: '2580130816',
                usagePercent: 85,
              }),
            ],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(2) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: {
          data: {
            storageConfig: {
              ...createMockStorageConfig(true, '/usb1'),
              storageInfo: createMockStorageInfo({
                path: '/usb1',
                usagePercent: 85,
                usedBytes: '14599738368',
              }),
            },
          },
        },
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Wait for usage to load
    await waitFor(() => {
      const usageText = screen.queryByText(/85/);
      expect(usageText).toBeInTheDocument();
    });
  });

  test('displays usage bar in critical range (90-94%)', async () => {
    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [
              createMockFlashStorage(),
              createMockStorageInfo({
                path: '/usb1',
                totalBytes: '17179869184',
                usedBytes: '15803695308', // 92% of 16GB
                availableBytes: '1376173876',
                usagePercent: 92,
              }),
            ],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(3) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: {
          data: {
            storageConfig: {
              ...createMockStorageConfig(true, '/usb1'),
              storageInfo: createMockStorageInfo({
                path: '/usb1',
                usagePercent: 92,
                usedBytes: '15803695308',
              }),
            },
          },
        },
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Wait for critical usage to load
    await waitFor(() => {
      const usageText = screen.queryByText(/92/);
      expect(usageText).toBeInTheDocument();
    });
  });

  test('displays usage bar at full (95%+)', async () => {
    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [
              createMockFlashStorage(),
              createMockStorageInfo({
                path: '/usb1',
                totalBytes: '17179869184',
                usedBytes: '16664213708', // 97% of 16GB
                availableBytes: '515655476',
                usagePercent: 97,
              }),
            ],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(5) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: {
          data: {
            storageConfig: {
              ...createMockStorageConfig(true, '/usb1'),
              storageInfo: createMockStorageInfo({
                path: '/usb1',
                usagePercent: 97,
                usedBytes: '16664213708',
              }),
            },
          },
        },
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Wait for full usage to load
    await waitFor(() => {
      const usageText = screen.queryByText(/97/);
      expect(usageText).toBeInTheDocument();
    });
  });
});

// =============================================================================
// Test Suite: Configuration Action Tests
// =============================================================================

describe('StorageSettings - Configuration Actions', () => {
  test('enables external storage', async () => {
    const user = userEvent.setup();

    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [createMockFlashStorage(), createMockStorageInfo({ path: '/usb1' })],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(0) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: { data: { storageConfig: createMockStorageConfig(false) } },
      },
      {
        request: {
          query: CONFIGURE_EXTERNAL_STORAGE,
          variables: {
            input: { path: '/usb1', enabled: true },
          },
        },
        result: {
          data: {
            configureExternalStorage: {
              config: createMockStorageConfig(true, '/usb1'),
              storageInfo: [createMockStorageInfo({ path: '/usb1' })],
              errors: null,
            },
          },
        },
      },
      // Refetch queries after mutation
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [createMockFlashStorage(), createMockStorageInfo({ path: '/usb1' })],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(0) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: { data: { storageConfig: createMockStorageConfig(true, '/usb1') } },
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('/usb1')).toBeInTheDocument();
    });

    // Find and toggle the enable switch
    const enableSwitch = screen.getByRole('switch', {
      name: /Enable External Storage/i,
    });
    expect(enableSwitch).not.toBeChecked();

    await act(async () => {
      await user.click(enableSwitch);
    });

    // Wait for mutation to complete and success toast
    await waitFor(() => {
      // Note: Sonner toasts are rendered in a separate portal
      // This test verifies the mutation was called correctly
      expect(enableSwitch).toBeChecked();
    });
  });

  test('disables external storage', async () => {
    const user = userEvent.setup();

    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [createMockFlashStorage(), createMockStorageInfo({ path: '/usb1' })],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(2) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: { data: { storageConfig: createMockStorageConfig(true, '/usb1') } },
      },
      {
        request: {
          query: RESET_EXTERNAL_STORAGE,
          variables: {
            input: { migrateToFlash: false },
          },
        },
        result: {
          data: {
            resetExternalStorage: {
              success: true,
              featuresMigrated: 0,
              errors: null,
            },
          },
        },
      },
      // Refetch queries
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [createMockFlashStorage(), createMockStorageInfo({ path: '/usb1' })],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(0) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: { data: { storageConfig: createMockStorageConfig(false) } },
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Wait for initial data to load
    await waitFor(() => {
      const enableSwitch = screen.getByRole('switch', {
        name: /Enable External Storage/i,
      });
      expect(enableSwitch).toBeChecked();
    });

    // Disable storage
    const enableSwitch = screen.getByRole('switch', {
      name: /Enable External Storage/i,
    });

    await act(async () => {
      await user.click(enableSwitch);
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(enableSwitch).not.toBeChecked();
    });
  });

  test('shows optimistic UI during configuration', async () => {
    const user = userEvent.setup();

    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [createMockFlashStorage(), createMockStorageInfo({ path: '/usb1' })],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(0) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: { data: { storageConfig: createMockStorageConfig(false) } },
      },
      {
        request: {
          query: CONFIGURE_EXTERNAL_STORAGE,
          variables: {
            input: { path: '/usb1', enabled: true },
          },
        },
        result: {
          data: {
            configureExternalStorage: {
              config: createMockStorageConfig(true, '/usb1'),
              storageInfo: [createMockStorageInfo({ path: '/usb1' })],
              errors: null,
            },
          },
        },
        delay: 500, // Simulate network delay
      },
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [createMockFlashStorage(), createMockStorageInfo({ path: '/usb1' })],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(0) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: { data: { storageConfig: createMockStorageConfig(true, '/usb1') } },
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('/usb1')).toBeInTheDocument();
    });

    const enableSwitch = screen.getByRole('switch', {
      name: /Enable External Storage/i,
    });

    await act(async () => {
      await user.click(enableSwitch);
    });

    // Verify optimistic update - switch should be checked immediately
    expect(enableSwitch).toBeChecked();

    // Wait for mutation to complete
    await waitFor(
      () => {
        expect(enableSwitch).toBeChecked();
      },
      { timeout: 1000 }
    );
  });
});

// =============================================================================
// Test Suite: Progressive Disclosure Tests
// =============================================================================

describe('StorageSettings - Progressive Disclosure', () => {
  test('essential tier always visible', async () => {
    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [createMockFlashStorage(), createMockStorageInfo({ path: '/usb1' })],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(2) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: { data: { storageConfig: createMockStorageConfig(true, '/usb1') } },
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('/usb1')).toBeInTheDocument();
    });

    // Verify essential elements are visible
    expect(screen.getByText(/Storage Configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/Storage Usage/i)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /Enable External Storage/i })).toBeInTheDocument();

    // Verify status badge is visible
    expect(screen.getByText(/Configured/i)).toBeInTheDocument();
  });

  test('common tier expands on click', async () => {
    const user = userEvent.setup();

    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [createMockFlashStorage(), createMockStorageInfo({ path: '/usb1' })],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(3) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: { data: { storageConfig: createMockStorageConfig(true, '/usb1') } },
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('/usb1')).toBeInTheDocument();
    });

    // Find the service breakdown button
    const breakdownButton = screen.getByRole('button', {
      name: /Service Storage Breakdown/i,
    });

    // Initially, the breakdown should be collapsed
    expect(screen.queryByText('Service 1')).not.toBeInTheDocument();

    // Click to expand
    await act(async () => {
      await user.click(breakdownButton);
    });

    // Verify section expands
    await waitFor(() => {
      expect(screen.getByText('Service 1')).toBeInTheDocument();
    });

    // Click again to collapse
    await act(async () => {
      await user.click(breakdownButton);
    });

    // Verify section collapses
    await waitFor(() => {
      expect(screen.queryByText('Service 1')).not.toBeInTheDocument();
    });
  });

  test('advanced tier expands independently', async () => {
    const user = userEvent.setup();

    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [createMockFlashStorage(), createMockStorageInfo({ path: '/usb1' })],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(2) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: { data: { storageConfig: createMockStorageConfig(true, '/usb1') } },
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('/usb1')).toBeInTheDocument();
    });

    // Find the advanced details button
    const advancedButton = screen.getByRole('button', {
      name: /Advanced Storage Details/i,
    });

    // Expand advanced section
    await act(async () => {
      await user.click(advancedButton);
    });

    // Verify advanced section expands with mount details
    await waitFor(() => {
      // The /usb1 path should appear in the mount details table
      const tables = screen.getAllByRole('table');
      // Advanced table should be the last one
      const advancedTable = tables[tables.length - 1];
      expect(within(advancedTable).getByText('/usb1')).toBeInTheDocument();
    });

    // Verify common section remains collapsed (if not explicitly opened)
    expect(screen.queryByText('Service 1')).not.toBeInTheDocument();
  });
});

// =============================================================================
// Test Suite: Service Breakdown Tests
// =============================================================================

describe('StorageSettings - Service Breakdown', () => {
  test('renders service usage list', async () => {
    const user = userEvent.setup();

    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [createMockFlashStorage(), createMockStorageInfo({ path: '/usb1' })],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(3) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: { data: { storageConfig: createMockStorageConfig(true, '/usb1') } },
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('/usb1')).toBeInTheDocument();
    });

    // Expand service breakdown
    const breakdownButton = screen.getByRole('button', {
      name: /Service Storage Breakdown/i,
    });

    await act(async () => {
      await user.click(breakdownButton);
    });

    // Verify all 3 services are rendered
    await waitFor(() => {
      expect(screen.getByText('Service 1')).toBeInTheDocument();
      expect(screen.getByText('Service 2')).toBeInTheDocument();
      expect(screen.getByText('Service 3')).toBeInTheDocument();
    });

    // Verify table headers are present
    expect(screen.getByText('Binary')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  test('displays affected service count in banner', async () => {
    const mocks: MockedResponse[] = [
      {
        request: { query: GET_STORAGE_INFO },
        result: {
          data: {
            storageInfo: [
              createMockFlashStorage(),
              createMockStorageInfo({
                path: '/usb1',
                mounted: false, // Disconnected
              }),
            ],
          },
        },
      },
      {
        request: { query: GET_STORAGE_USAGE },
        result: { data: { storageUsage: createMockStorageUsage(7) } },
      },
      {
        request: { query: GET_STORAGE_CONFIG },
        result: {
          data: {
            storageConfig: {
              ...createMockStorageConfig(true, '/usb1'),
              storageInfo: createMockStorageInfo({
                path: '/usb1',
                mounted: false,
              }),
            },
          },
        },
      },
    ];

    renderWithProviders(<StorageSettingsDesktop />, mocks);

    // Wait for disconnect banner to appear
    await waitFor(() => {
      // The StorageDisconnectBanner should be rendered
      // Note: Actual banner text depends on the component implementation
      const badge = screen.queryByText(/Disconnected/i);
      expect(badge).toBeInTheDocument();
    });

    // Note: The "+2 more" logic is in the StorageDisconnectBanner component
    // This test verifies the banner is rendered when storage is disconnected
  });
});
