import { ChangelogModal } from './ChangelogModal';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ChangelogModal> = {
  title: 'Features/Services/ChangelogModal',
  component: ChangelogModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays GitHub release notes for a service update. Shows a severity badge, version diff, optional security/breaking-change warnings, and a link to the full changelog on GitHub. Rendered inside a Dialog — set `open: true` in stories to keep it visible.',
      },
    },
  },
  argTypes: {
    open: { control: 'boolean' },
    severity: {
      control: 'select',
      options: ['SECURITY', 'MAJOR', 'MINOR', 'PATCH'],
    },
    securityFixes: { control: 'boolean' },
    breakingChanges: { control: 'boolean' },
    releaseDate: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ChangelogModal>;

const baseArgs = {
  open: true,
  onClose: () => {},
  instanceName: 'Tor Proxy',
  currentVersion: '1.2.0',
  newVersion: '1.3.0',
  changelogUrl: 'https://github.com/torproject/tor/releases/tag/v1.3.0',
  releaseDate: '2026-01-15T00:00:00.000Z',
};

/**
 * Security update with security-fix warning.
 */
export const SecurityUpdate: Story = {
  name: 'Security Update',
  args: {
    ...baseArgs,
    severity: 'SECURITY',
    securityFixes: true,
    breakingChanges: false,
  },
};

/**
 * Major update that also contains breaking changes.
 */
export const MajorWithBreakingChanges: Story = {
  name: 'Major Update — Breaking Changes',
  args: {
    ...baseArgs,
    instanceName: 'sing-box',
    currentVersion: '1.8.5',
    newVersion: '2.0.0',
    changelogUrl: 'https://github.com/SagerNet/sing-box/releases/tag/v2.0.0',
    severity: 'MAJOR',
    securityFixes: false,
    breakingChanges: true,
  },
};

/**
 * Security update that also has breaking changes — both warning banners visible.
 */
export const SecurityAndBreaking: Story = {
  name: 'Security + Breaking Changes',
  args: {
    ...baseArgs,
    instanceName: 'Xray-core',
    currentVersion: '24.9.0',
    newVersion: '24.12.0',
    changelogUrl: 'https://github.com/XTLS/Xray-core/releases/tag/v24.12.0',
    severity: 'SECURITY',
    securityFixes: true,
    breakingChanges: true,
    releaseDate: '2026-02-01T00:00:00.000Z',
  },
};

/**
 * Minor update — informational badge, no warnings.
 */
export const MinorUpdate: Story = {
  name: 'Minor Update',
  args: {
    ...baseArgs,
    instanceName: 'AdGuard Home',
    currentVersion: '0.107.52',
    newVersion: '0.107.55',
    changelogUrl: 'https://github.com/AdguardTeam/AdGuardHome/releases/tag/v0.107.55',
    severity: 'MINOR',
    securityFixes: false,
    breakingChanges: false,
    releaseDate: '2026-01-28T00:00:00.000Z',
  },
};

/**
 * Patch update — smallest possible change, green badge, no warnings.
 */
export const PatchUpdate: Story = {
  name: 'Patch Update',
  args: {
    ...baseArgs,
    instanceName: 'Psiphon',
    currentVersion: '3.0.1',
    newVersion: '3.0.2',
    changelogUrl: 'https://github.com/Psiphon-Labs/psiphon-tunnel-core/releases/tag/v3.0.2',
    severity: 'PATCH',
    securityFixes: false,
    breakingChanges: false,
    releaseDate: undefined,
  },
};

/**
 * Modal in closed state — Dialog is not rendered, useful for asserting
 * that nothing is mounted when open is false.
 */
export const Closed: Story = {
  name: 'Closed State',
  args: {
    ...baseArgs,
    open: false,
    severity: 'MINOR',
    securityFixes: false,
    breakingChanges: false,
  },
};
