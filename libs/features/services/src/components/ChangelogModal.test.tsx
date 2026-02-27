/**
 * ChangelogModal Component Tests (NAS-8.7)
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ChangelogModal } from './ChangelogModal';
import type { UpdateSeverity } from '@nasnet/api-client/queries';

describe('ChangelogModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    instanceName: 'Tor Proxy',
    currentVersion: '0.4.7.0',
    newVersion: '0.4.8.0',
    severity: 'MINOR' as UpdateSeverity,
    changelogUrl: 'https://github.com/torproject/tor/releases/tag/v0.4.8.0',
  };

  describe('Basic Rendering', () => {
    it('renders modal when open', () => {
      render(<ChangelogModal {...defaultProps} />);

      expect(screen.getByText('Tor Proxy Update')).toBeInTheDocument();
      expect(
        screen.getByText('View changelog and release notes for this update')
      ).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          open={false}
        />
      );

      expect(screen.queryByText('Tor Proxy Update')).not.toBeInTheDocument();
    });

    it('calls onClose when dialog is closed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <ChangelogModal
          {...defaultProps}
          onClose={onClose}
        />
      );

      // Press Escape key to close
      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Severity Badge', () => {
    it('displays SECURITY severity correctly', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          severity="SECURITY"
        />
      );

      const badge = screen.getByText('Security Update');
      expect(badge).toBeInTheDocument();
    });

    it('displays MAJOR severity correctly', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          severity="MAJOR"
        />
      );

      const badge = screen.getByText('Major Update');
      expect(badge).toBeInTheDocument();
    });

    it('displays MINOR severity correctly', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          severity="MINOR"
        />
      );

      const badge = screen.getByText('Minor Update');
      expect(badge).toBeInTheDocument();
    });

    it('displays PATCH severity correctly', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          severity="PATCH"
        />
      );

      const badge = screen.getByText('Patch Update');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Version Diff', () => {
    it('displays current and new version correctly', () => {
      render(<ChangelogModal {...defaultProps} />);

      expect(screen.getByText(/v0\.4\.7\.0/)).toBeInTheDocument();
      expect(screen.getByText(/v0\.4\.8\.0/)).toBeInTheDocument();
      expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('shows version change section header', () => {
      render(<ChangelogModal {...defaultProps} />);

      expect(screen.getByText('Version Change')).toBeInTheDocument();
    });
  });

  describe('Release Date', () => {
    it('formats release date correctly', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          releaseDate="2024-03-15T10:30:00Z"
        />
      );

      expect(screen.getByText(/Released March 15, 2024/)).toBeInTheDocument();
    });

    it('handles missing release date', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          releaseDate={undefined}
        />
      );

      expect(screen.queryByText(/Released/)).not.toBeInTheDocument();
    });

    it('handles invalid release date gracefully', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          releaseDate="invalid-date"
        />
      );

      expect(screen.queryByText(/Released/)).not.toBeInTheDocument();
    });
  });

  describe('Security Fixes Warning', () => {
    it('displays security fixes warning when present', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          securityFixes={true}
        />
      );

      expect(screen.getByText('Security Fixes Included')).toBeInTheDocument();
      expect(
        screen.getByText(/This update includes important security patches/)
      ).toBeInTheDocument();
    });

    it('hides security fixes warning when not present', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          securityFixes={false}
        />
      );

      expect(screen.queryByText('Security Fixes Included')).not.toBeInTheDocument();
    });
  });

  describe('Breaking Changes Warning', () => {
    it('displays breaking changes warning when present', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          breakingChanges={true}
        />
      );

      expect(screen.getByText('Breaking Changes')).toBeInTheDocument();
      expect(screen.getByText(/This update contains breaking changes/)).toBeInTheDocument();
    });

    it('hides breaking changes warning when not present', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          breakingChanges={false}
        />
      );

      expect(screen.queryByText('Breaking Changes')).not.toBeInTheDocument();
    });
  });

  describe('Changelog Link', () => {
    it('displays changelog button', () => {
      render(<ChangelogModal {...defaultProps} />);

      const button = screen.getByRole('button', { name: /View Full Changelog on GitHub/i });
      expect(button).toBeInTheDocument();
    });

    it('opens changelog URL in new tab when clicked', async () => {
      const user = userEvent.setup();
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      render(<ChangelogModal {...defaultProps} />);

      const button = screen.getByRole('button', { name: /View Full Changelog on GitHub/i });
      await user.click(button);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://github.com/torproject/tor/releases/tag/v0.4.8.0',
        '_blank',
        'noopener,noreferrer'
      );

      windowOpenSpy.mockRestore();
    });

    it('displays informational message about GitHub', () => {
      render(<ChangelogModal {...defaultProps} />);

      expect(
        screen.getByText(/For detailed release notes and changelog, visit the GitHub release page/)
      ).toBeInTheDocument();
    });
  });

  describe('Combined Warnings', () => {
    it('displays both security fixes and breaking changes warnings', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          securityFixes={true}
          breakingChanges={true}
        />
      );

      expect(screen.getByText('Security Fixes Included')).toBeInTheDocument();
      expect(screen.getByText('Breaking Changes')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides dialog role', () => {
      render(<ChangelogModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('provides accessible name for dialog', () => {
      render(<ChangelogModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAccessibleName('Tor Proxy Update');
    });

    it('provides accessible description for dialog', () => {
      render(<ChangelogModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAccessibleDescription(
        'View changelog and release notes for this update'
      );
    });

    it('renders with proper heading structure', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          severity="SECURITY"
        />
      );

      // Dialog should have proper heading (via DialogTitle)
      const heading = screen.getByText(/Tor Proxy Update/);
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Severity-Based Rendering', () => {
    it('renders SECURITY severity with appropriate styling', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          severity="SECURITY"
        />
      );

      const badge = screen.getByText('Security Update');
      expect(badge).toBeInTheDocument();
      expect(badge.closest('[class*="bg-error"]')).toBeTruthy();
    });

    it('renders MAJOR severity with appropriate styling', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          severity="MAJOR"
        />
      );

      const badge = screen.getByText('Major Update');
      expect(badge).toBeInTheDocument();
      expect(badge.closest('[class*="bg-warning"]')).toBeTruthy();
    });

    it('renders MINOR severity with appropriate styling', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          severity="MINOR"
        />
      );

      const badge = screen.getByText('Minor Update');
      expect(badge).toBeInTheDocument();
      expect(badge.closest('[class*="bg-info"]')).toBeTruthy();
    });

    it('renders PATCH severity with appropriate styling', () => {
      render(
        <ChangelogModal
          {...defaultProps}
          severity="PATCH"
        />
      );

      const badge = screen.getByText('Patch Update');
      expect(badge).toBeInTheDocument();
      expect(badge.closest('[class*="bg-success"]')).toBeTruthy();
    });
  });
});
