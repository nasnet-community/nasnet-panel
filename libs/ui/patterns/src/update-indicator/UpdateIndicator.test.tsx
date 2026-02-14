/**
 * UpdateIndicator Component Tests (NAS-8.7)
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { UpdateIndicatorDesktop } from './UpdateIndicatorDesktop';
import { UpdateIndicatorMobile } from './UpdateIndicatorMobile';

describe('UpdateIndicator', () => {
  describe('UpdateIndicatorDesktop', () => {
    it('renders security update badge', () => {
      render(
        <UpdateIndicatorDesktop
          instanceId="tor-1"
          instanceName="Tor Proxy"
          currentVersion="1.0.0"
          latestVersion="1.1.0"
          updateAvailable={true}
          severity="SECURITY"
        />
      );

      expect(screen.getByText('Security Update')).toBeInTheDocument();
    });

    it('hides when no update available', () => {
      const { container } = render(
        <UpdateIndicatorDesktop
          instanceId="tor-1"
          instanceName="Tor Proxy"
          currentVersion="1.0.0"
          latestVersion={null}
          updateAvailable={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('calls onUpdate when update button clicked', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();

      render(
        <UpdateIndicatorDesktop
          instanceId="tor-1"
          instanceName="Tor Proxy"
          currentVersion="1.0.0"
          latestVersion="1.1.0"
          updateAvailable={true}
          severity="MINOR"
          onUpdate={onUpdate}
        />
      );

      // Open popover
      const trigger = screen.getByRole('button', { name: /minor update/i });
      await user.click(trigger);

      // Click update button
      const updateButton = screen.getByRole('button', { name: /install update/i });
      await user.click(updateButton);

      expect(onUpdate).toHaveBeenCalledWith('tor-1');
    });

    it('disables update button when updating', async () => {
      const user = userEvent.setup();

      render(
        <UpdateIndicatorDesktop
          instanceId="tor-1"
          instanceName="Tor Proxy"
          currentVersion="1.0.0"
          latestVersion="1.1.0"
          updateAvailable={true}
          severity="MINOR"
          isUpdating={true}
          updateStage="DOWNLOADING"
          updateProgress={45}
          updateMessage="Downloading..."
        />
      );

      // Open popover
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // Update button should be disabled
      const updateButton = screen.queryByRole('button', { name: /install update/i });
      expect(updateButton).toBeNull(); // Hidden when updating
    });

    it('shows progress bar when updating', async () => {
      const user = userEvent.setup();

      render(
        <UpdateIndicatorDesktop
          instanceId="tor-1"
          instanceName="Tor Proxy"
          currentVersion="1.0.0"
          latestVersion="1.1.0"
          updateAvailable={true}
          severity="SECURITY"
          isUpdating={true}
          updateStage="DOWNLOADING"
          updateProgress={45}
          updateMessage="Downloading binary..."
        />
      );

      // Open popover
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // Check progress bar
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '45');
    });

    it('displays rollback button after failure', async () => {
      const user = userEvent.setup();
      const onRollback = vi.fn();

      render(
        <UpdateIndicatorDesktop
          instanceId="tor-1"
          instanceName="Tor Proxy"
          currentVersion="1.0.0"
          latestVersion="1.1.0"
          updateAvailable={true}
          severity="SECURITY"
          updateFailed={true}
          updateError="Checksum verification failed"
          onRollback={onRollback}
        />
      );

      // Open popover
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // Click rollback button
      const rollbackButton = screen.getByRole('button', { name: /rollback/i });
      await user.click(rollbackButton);

      expect(onRollback).toHaveBeenCalledWith('tor-1');
    });
  });

  describe('UpdateIndicatorMobile', () => {
    it('renders security update in mobile layout', () => {
      render(
        <UpdateIndicatorMobile
          instanceId="tor-1"
          instanceName="Tor Proxy"
          currentVersion="1.0.0"
          latestVersion="1.1.0"
          updateAvailable={true}
          severity="SECURITY"
          securityFixes={true}
        />
      );

      expect(screen.getByText('Security Update')).toBeInTheDocument();
      expect(screen.getByText('Tor Proxy')).toBeInTheDocument();
    });

    it('hides when no update available', () => {
      const { container } = render(
        <UpdateIndicatorMobile
          instanceId="tor-1"
          instanceName="Tor Proxy"
          currentVersion="1.0.0"
          latestVersion={null}
          updateAvailable={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('shows security fixes warning', async () => {
      const user = userEvent.setup();

      render(
        <UpdateIndicatorMobile
          instanceId="tor-1"
          instanceName="Tor Proxy"
          currentVersion="1.0.0"
          latestVersion="1.1.0"
          updateAvailable={true}
          severity="SECURITY"
          securityFixes={true}
        />
      );

      // Open bottom sheet
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // Check for security warning
      expect(screen.getByText(/includes security fixes/i)).toBeInTheDocument();
    });

    it('calls onUpdate when update button clicked', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();

      render(
        <UpdateIndicatorMobile
          instanceId="tor-1"
          instanceName="Tor Proxy"
          currentVersion="1.0.0"
          latestVersion="1.1.0"
          updateAvailable={true}
          severity="MINOR"
          onUpdate={onUpdate}
        />
      );

      // Open bottom sheet
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // Click update button
      const updateButton = screen.getByRole('button', { name: /install update/i });
      await user.click(updateButton);

      expect(onUpdate).toHaveBeenCalledWith('tor-1');
    });
  });

  describe('Accessibility', () => {
    it('provides ARIA label for update status', () => {
      render(
        <UpdateIndicatorDesktop
          instanceId="tor-1"
          instanceName="Tor Proxy"
          currentVersion="1.0.0"
          latestVersion="1.1.0"
          updateAvailable={true}
          severity="SECURITY"
        />
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAccessibleName();
    });

    it('provides progress bar ARIA attributes', async () => {
      const user = userEvent.setup();

      render(
        <UpdateIndicatorDesktop
          instanceId="tor-1"
          instanceName="Tor Proxy"
          currentVersion="1.0.0"
          latestVersion="1.1.0"
          updateAvailable={true}
          severity="SECURITY"
          isUpdating={true}
          updateStage="DOWNLOADING"
          updateProgress={45}
          updateMessage="Downloading..."
        />
      );

      // Open popover
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '45');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });
});
