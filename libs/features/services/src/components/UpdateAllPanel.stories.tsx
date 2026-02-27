import type { AvailableUpdate } from '@nasnet/api-client/queries';

import { UpdateAllPanel } from './UpdateAllPanel';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof UpdateAllPanel> = {
  title: 'Features/Services/UpdateAllPanel',
  component: UpdateAllPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Aggregate view of pending service updates with bulk-update functionality. Groups updates by severity (Security → Major → Minor → Patch), shows a severity breakdown badge strip, surfaces a security alert when critical patches are pending, and presents a confirmation Dialog before kicking off sequential updates. Renders `null` when there are no pending updates.',
      },
    },
  },
  argTypes: {
    loading: { control: 'boolean' },
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof UpdateAllPanel>;

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

const securityUpdate: AvailableUpdate = {
  instanceId: 'tor-usa-01',
  instanceName: 'Tor Proxy (USA)',
  featureId: 'tor',
  currentVersion: '1.2.0',
  latestVersion: '1.3.0',
  updateAvailable: true,
  severity: 'SECURITY',
  changelogUrl: 'https://github.com/torproject/tor/releases/tag/v1.3.0',
  releaseDate: '2026-01-15T00:00:00.000Z',
  binarySize: 5_242_880,
  requiredDiskMB: 10,
  requiresRestart: true,
  breakingChanges: false,
  securityFixes: true,
};

const majorUpdate: AvailableUpdate = {
  instanceId: 'singbox-eu-02',
  instanceName: 'sing-box (EU)',
  featureId: 'sing-box',
  currentVersion: '1.8.5',
  latestVersion: '2.0.0',
  updateAvailable: true,
  severity: 'MAJOR',
  changelogUrl: 'https://github.com/SagerNet/sing-box/releases/tag/v2.0.0',
  releaseDate: '2026-02-01T00:00:00.000Z',
  binarySize: 12_582_912,
  requiredDiskMB: 25,
  requiresRestart: true,
  breakingChanges: true,
  securityFixes: false,
};

const minorUpdate: AvailableUpdate = {
  instanceId: 'adguard-home-01',
  instanceName: 'AdGuard Home',
  featureId: 'adguard-home',
  currentVersion: '0.107.52',
  latestVersion: '0.107.55',
  updateAvailable: true,
  severity: 'MINOR',
  changelogUrl: 'https://github.com/AdguardTeam/AdGuardHome/releases/tag/v0.107.55',
  releaseDate: '2026-01-28T00:00:00.000Z',
  binarySize: 20_971_520,
  requiredDiskMB: 40,
  requiresRestart: false,
  breakingChanges: false,
  securityFixes: false,
};

const patchUpdate: AvailableUpdate = {
  instanceId: 'psiphon-prod-01',
  instanceName: 'Psiphon',
  featureId: 'psiphon',
  currentVersion: '3.0.1',
  latestVersion: '3.0.2',
  updateAvailable: true,
  severity: 'PATCH',
  changelogUrl: 'https://github.com/Psiphon-Labs/psiphon-tunnel-core/releases/tag/v3.0.2',
  releaseDate: '2026-02-05T00:00:00.000Z',
  binarySize: 8_388_608,
  requiredDiskMB: 15,
  requiresRestart: false,
  breakingChanges: false,
  securityFixes: false,
};

// A second security update to test plural handling in the alert banner
const securityUpdate2: AvailableUpdate = {
  instanceId: 'xray-core-01',
  instanceName: 'Xray-core',
  featureId: 'xray-core',
  currentVersion: '24.9.0',
  latestVersion: '24.12.0',
  updateAvailable: true,
  severity: 'SECURITY',
  changelogUrl: 'https://github.com/XTLS/Xray-core/releases/tag/v24.12.0',
  releaseDate: '2026-02-10T00:00:00.000Z',
  binarySize: 18_874_368,
  requiredDiskMB: 35,
  requiresRestart: true,
  breakingChanges: false,
  securityFixes: true,
};

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Mixed severity updates — security alert banner is shown, and the update
 * list is sorted highest-severity first.
 */
export const MixedSeverities: Story = {
  name: 'Mixed Severities',
  args: {
    updates: [minorUpdate, securityUpdate, patchUpdate, majorUpdate],
    onUpdateAll: () => console.log('[UpdateAllPanel] Update All clicked'),
    onUpdate: (id) => console.log('[UpdateAllPanel] Update', id),
    updatingInstances: {},
    updateProgress: {},
    loading: false,
  },
};

/**
 * Security-only updates — emphasises the destructive alert banner and
 * the red severity badge.
 */
export const SecurityOnly: Story = {
  name: 'Security Updates Only',
  args: {
    updates: [securityUpdate, securityUpdate2],
    onUpdateAll: () => {},
    onUpdate: () => {},
    updatingInstances: {},
    updateProgress: {},
    loading: false,
  },
};

/**
 * Patch update only — no alert banner, green badge, minimal UI.
 */
export const PatchOnly: Story = {
  name: 'Patch Update Only',
  args: {
    updates: [patchUpdate],
    onUpdateAll: () => {},
    onUpdate: () => {},
    updatingInstances: {},
    updateProgress: {},
    loading: false,
  },
};

/**
 * One instance mid-update — shows the progress bar inline and hides
 * the per-row "Update" button for the active instance.
 */
export const OneInstanceUpdating: Story = {
  name: 'One Instance Updating',
  args: {
    updates: [securityUpdate, majorUpdate, patchUpdate],
    onUpdateAll: () => {},
    onUpdate: () => {},
    updatingInstances: { 'tor-usa-01': true },
    updateProgress: { 'tor-usa-01': 62 },
    loading: false,
  },
};

/**
 * More than 5 updates — verifies the "and X more…" overflow message.
 */
export const ManyUpdates: Story = {
  name: 'More Than 5 Updates',
  args: {
    updates: [
      securityUpdate,
      securityUpdate2,
      majorUpdate,
      minorUpdate,
      patchUpdate,
      {
        ...patchUpdate,
        instanceId: 'mtproxy-01',
        instanceName: 'MTProxy',
        featureId: 'mtproxy',
        currentVersion: '1.0.0',
        latestVersion: '1.0.1',
      },
      {
        ...minorUpdate,
        instanceId: 'adguard-home-02',
        instanceName: 'AdGuard Home (backup)',
        featureId: 'adguard-home',
        currentVersion: '0.107.50',
        latestVersion: '0.107.55',
      },
    ],
    onUpdateAll: () => {},
    onUpdate: (id) => console.log('[UpdateAllPanel] Update', id),
    updatingInstances: {},
    updateProgress: {},
    loading: false,
  },
};

/**
 * Loading state — "Update All" button is disabled while the mutation is in flight.
 */
export const LoadingState: Story = {
  name: 'Loading State',
  args: {
    updates: [securityUpdate, majorUpdate],
    onUpdateAll: () => {},
    onUpdate: () => {},
    updatingInstances: {},
    updateProgress: {},
    loading: true,
  },
};
