/**
 * UpdateIndicator Storybook Stories (NAS-8.7)
 */

import { fn } from 'storybook/test';

import { UpdateIndicator } from './UpdateIndicator';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof UpdateIndicator> = {
  title: 'Patterns/UpdateIndicator',
  component: UpdateIndicator,
  tags: ['autodocs'],
  args: {
    onUpdate: fn(),
    onRollback: fn(),
    onViewChangelog: fn(),
  },
  argTypes: {
    severity: {
      control: 'select',
      options: ['SECURITY', 'MAJOR', 'MINOR', 'PATCH'],
    },
    updateStage: {
      control: 'select',
      options: [
        'PENDING',
        'DOWNLOADING',
        'VERIFYING',
        'STOPPING',
        'INSTALLING',
        'STARTING',
        'HEALTH_CHECK',
        'COMPLETE',
        'FAILED',
        'ROLLED_BACK',
      ],
    },
    updateProgress: {
      control: { type: 'range', min: 0, max: 100, step: 5 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UpdateIndicator>;

/**
 * No update available - component is hidden
 */
export const NoUpdate: Story = {
  args: {
    instanceId: 'tor-1',
    instanceName: 'Tor Proxy',
    currentVersion: '1.0.0',
    latestVersion: null,
    updateAvailable: false,
  },
};

/**
 * Minor update available
 */
export const MinorUpdate: Story = {
  args: {
    instanceId: 'tor-1',
    instanceName: 'Tor Proxy',
    currentVersion: '1.0.0',
    latestVersion: '1.1.0',
    updateAvailable: true,
    severity: 'MINOR',
    releaseDate: '2026-02-10T00:00:00Z',
    binarySize: 15728640, // 15 MB
    requiresRestart: true,
    changelogUrl: 'https://github.com/torproject/tor/releases/tag/v1.1.0',
  },
};

/**
 * Security update with critical fixes
 */
export const SecurityUpdate: Story = {
  args: {
    instanceId: 'tor-1',
    instanceName: 'Tor Proxy',
    currentVersion: '1.0.0',
    latestVersion: '1.0.1',
    updateAvailable: true,
    severity: 'SECURITY',
    securityFixes: true,
    requiresRestart: true,
    releaseDate: '2026-02-12T00:00:00Z',
    binarySize: 15728640,
    changelogUrl: 'https://github.com/torproject/tor/releases/tag/v1.0.1',
  },
};

/**
 * Major update with breaking changes
 */
export const MajorUpdateWithBreakingChanges: Story = {
  args: {
    instanceId: 'singbox-1',
    instanceName: 'sing-box Multi-Protocol',
    currentVersion: '1.5.0',
    latestVersion: '2.0.0',
    updateAvailable: true,
    severity: 'MAJOR',
    breakingChanges: true,
    requiresRestart: true,
    releaseDate: '2026-02-01T00:00:00Z',
    binarySize: 28672000, // 27.3 MB
    changelogUrl: 'https://github.com/SagerNet/sing-box/releases/tag/v2.0.0',
  },
};

/**
 * Patch update (bug fixes only)
 */
export const PatchUpdate: Story = {
  args: {
    instanceId: 'adguard-1',
    instanceName: 'AdGuard Home DNS',
    currentVersion: '1.2.3',
    latestVersion: '1.2.4',
    updateAvailable: true,
    severity: 'PATCH',
    requiresRestart: false,
    releaseDate: '2026-02-13T00:00:00Z',
    binarySize: 12582912, // 12 MB
    changelogUrl: 'https://github.com/AdguardTeam/AdGuardHome/releases/tag/v1.2.4',
  },
};

/**
 * Update in progress - downloading
 */
export const Updating_Downloading: Story = {
  args: {
    instanceId: 'tor-1',
    instanceName: 'Tor Proxy',
    currentVersion: '1.0.0',
    latestVersion: '1.1.0',
    updateAvailable: true,
    severity: 'SECURITY',
    isUpdating: true,
    updateStage: 'DOWNLOADING',
    updateProgress: 45,
    updateMessage: 'Downloading binary... 7.1 MB / 15.7 MB',
  },
};

/**
 * Update in progress - verifying
 */
export const Updating_Verifying: Story = {
  args: {
    instanceId: 'tor-1',
    instanceName: 'Tor Proxy',
    currentVersion: '1.0.0',
    latestVersion: '1.1.0',
    updateAvailable: true,
    severity: 'SECURITY',
    isUpdating: true,
    updateStage: 'VERIFYING',
    updateProgress: 100,
    updateMessage: 'Verifying checksum...',
  },
};

/**
 * Update in progress - stopping service
 */
export const Updating_Stopping: Story = {
  args: {
    instanceId: 'tor-1',
    instanceName: 'Tor Proxy',
    currentVersion: '1.0.0',
    latestVersion: '1.1.0',
    updateAvailable: true,
    severity: 'SECURITY',
    isUpdating: true,
    updateStage: 'STOPPING',
    updateProgress: 100,
    updateMessage: 'Stopping Tor service...',
  },
};

/**
 * Update in progress - installing
 */
export const Updating_Installing: Story = {
  args: {
    instanceId: 'tor-1',
    instanceName: 'Tor Proxy',
    currentVersion: '1.0.0',
    latestVersion: '1.1.0',
    updateAvailable: true,
    severity: 'SECURITY',
    isUpdating: true,
    updateStage: 'INSTALLING',
    updateProgress: 100,
    updateMessage: 'Installing new binary...',
  },
};

/**
 * Update in progress - health check
 */
export const Updating_HealthCheck: Story = {
  args: {
    instanceId: 'tor-1',
    instanceName: 'Tor Proxy',
    currentVersion: '1.0.0',
    latestVersion: '1.1.0',
    updateAvailable: true,
    severity: 'SECURITY',
    isUpdating: true,
    updateStage: 'HEALTH_CHECK',
    updateProgress: 100,
    updateMessage: 'Running health checks...',
  },
};

/**
 * Update complete
 */
export const UpdateComplete: Story = {
  args: {
    instanceId: 'tor-1',
    instanceName: 'Tor Proxy',
    currentVersion: '1.1.0',
    latestVersion: '1.1.0',
    updateAvailable: false,
    isUpdating: true,
    updateStage: 'COMPLETE',
    updateProgress: 100,
    updateMessage: 'Update completed successfully',
  },
};

/**
 * Update failed
 */
export const UpdateFailed: Story = {
  args: {
    instanceId: 'tor-1',
    instanceName: 'Tor Proxy',
    currentVersion: '1.0.0',
    latestVersion: '1.1.0',
    updateAvailable: true,
    severity: 'SECURITY',
    updateFailed: true,
    updateError: 'Checksum verification failed. Binary may be corrupted.',
  },
};

/**
 * Update rolled back after health check failure
 */
export const UpdateRolledBack: Story = {
  args: {
    instanceId: 'tor-1',
    instanceName: 'Tor Proxy',
    currentVersion: '1.0.0',
    latestVersion: '1.1.0',
    updateAvailable: true,
    severity: 'SECURITY',
    wasRolledBack: true,
    updateError: 'Health check failed: service did not start within 30 seconds',
  },
};

/**
 * Large binary download
 */
export const LargeBinaryDownload: Story = {
  args: {
    instanceId: 'xray-1',
    instanceName: 'Xray-core Unified',
    currentVersion: '1.7.5',
    latestVersion: '1.8.0',
    updateAvailable: true,
    severity: 'MINOR',
    isUpdating: true,
    updateStage: 'DOWNLOADING',
    updateProgress: 22,
    updateMessage: 'Downloading binary... 15.8 MB / 72.5 MB',
    binarySize: 76032000, // 72.5 MB
    releaseDate: '2026-02-09T00:00:00Z',
  },
};

/**
 * Multiple warnings
 */
export const MultipleWarnings: Story = {
  args: {
    instanceId: 'singbox-1',
    instanceName: 'sing-box Multi-Protocol',
    currentVersion: '1.9.0',
    latestVersion: '2.0.0',
    updateAvailable: true,
    severity: 'MAJOR',
    securityFixes: true,
    breakingChanges: true,
    requiresRestart: true,
    releaseDate: '2026-02-05T00:00:00Z',
    binarySize: 32505856, // 31 MB
    changelogUrl: 'https://github.com/SagerNet/sing-box/releases/tag/v2.0.0',
  },
};
