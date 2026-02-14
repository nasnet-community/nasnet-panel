/**
 * UpdateProgressBar Component Tests (NAS-8.7)
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UpdateProgressBar } from './UpdateProgressBar';
import type { UpdateStage } from '@nasnet/api-client/queries';

describe('UpdateProgressBar', () => {
  describe('Stage Rendering', () => {
    it('renders PENDING stage correctly', () => {
      render(
        <UpdateProgressBar
          stage="PENDING"
          progress={0}
          message="Preparing update..."
        />
      );

      expect(screen.getByText('Preparing update...')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('renders DOWNLOADING stage correctly', () => {
      render(
        <UpdateProgressBar
          stage="DOWNLOADING"
          progress={45}
          message="Downloading binary... 12.5 MB / 28 MB"
        />
      );

      expect(screen.getByText('Downloading binary... 12.5 MB / 28 MB')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('renders VERIFYING stage correctly', () => {
      render(
        <UpdateProgressBar
          stage="VERIFYING"
          progress={75}
          message="Verifying GPG signature..."
        />
      );

      expect(screen.getByText('Verifying GPG signature...')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('renders STOPPING stage correctly', () => {
      render(
        <UpdateProgressBar
          stage="STOPPING"
          progress={80}
          message="Stopping service..."
        />
      );

      expect(screen.getByText('Stopping service...')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('renders INSTALLING stage correctly', () => {
      render(
        <UpdateProgressBar
          stage="INSTALLING"
          progress={85}
          message="Installing binary..."
        />
      );

      expect(screen.getByText('Installing binary...')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('renders STARTING stage correctly', () => {
      render(
        <UpdateProgressBar
          stage="STARTING"
          progress={90}
          message="Starting service..."
        />
      );

      expect(screen.getByText('Starting service...')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
    });

    it('renders HEALTH_CHECK stage correctly', () => {
      render(
        <UpdateProgressBar
          stage="HEALTH_CHECK"
          progress={95}
          message="Running health checks..."
        />
      );

      expect(screen.getByText('Running health checks...')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('renders COMPLETE stage correctly', () => {
      render(
        <UpdateProgressBar
          stage="COMPLETE"
          progress={100}
          message="Update complete!"
        />
      );

      expect(screen.getByText('Update complete!')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('renders FAILED stage correctly', () => {
      render(
        <UpdateProgressBar
          stage="FAILED"
          progress={60}
          message="Update failed: Checksum verification failed"
        />
      );

      expect(screen.getByText('Update failed: Checksum verification failed')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('renders ROLLED_BACK stage correctly', () => {
      render(
        <UpdateProgressBar
          stage="ROLLED_BACK"
          progress={100}
          message="Rolled back to previous version"
        />
      );

      expect(screen.getByText('Rolled back to previous version')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Progress Percentage', () => {
    it('updates progress percentage correctly', () => {
      const { rerender } = render(
        <UpdateProgressBar
          stage="DOWNLOADING"
          progress={25}
          message="Downloading..."
        />
      );

      expect(screen.getByText('25%')).toBeInTheDocument();

      rerender(
        <UpdateProgressBar
          stage="DOWNLOADING"
          progress={50}
          message="Downloading..."
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();

      rerender(
        <UpdateProgressBar
          stage="DOWNLOADING"
          progress={75}
          message="Downloading..."
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('clamps progress to 0-100 range', () => {
      const { rerender } = render(
        <UpdateProgressBar
          stage="DOWNLOADING"
          progress={-10}
          message="Downloading..."
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');

      rerender(
        <UpdateProgressBar
          stage="DOWNLOADING"
          progress={150}
          message="Downloading..."
        />
      );

      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });

    it('rounds progress percentage for display', () => {
      render(
        <UpdateProgressBar
          stage="DOWNLOADING"
          progress={45.7}
          message="Downloading..."
        />
      );

      expect(screen.getByText('46%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides progressbar role', () => {
      render(
        <UpdateProgressBar
          stage="DOWNLOADING"
          progress={45}
          message="Downloading..."
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('provides ARIA attributes for screen readers', () => {
      render(
        <UpdateProgressBar
          stage="DOWNLOADING"
          progress={45}
          message="Downloading binary..."
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '45');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-valuetext', 'Downloading binary... - 45%');
    });

    it('provides status role for live region', () => {
      render(
        <UpdateProgressBar
          stage="DOWNLOADING"
          progress={45}
          message="Downloading..."
        />
      );

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('applies correct color class for each stage', () => {
      const stages: { stage: UpdateStage; expectedColor: string }[] = [
        { stage: 'PENDING', expectedColor: 'bg-neutral' },
        { stage: 'DOWNLOADING', expectedColor: 'bg-info' },
        { stage: 'VERIFYING', expectedColor: 'bg-info' },
        { stage: 'STOPPING', expectedColor: 'bg-warning' },
        { stage: 'INSTALLING', expectedColor: 'bg-info' },
        { stage: 'STARTING', expectedColor: 'bg-info' },
        { stage: 'HEALTH_CHECK', expectedColor: 'bg-info' },
        { stage: 'COMPLETE', expectedColor: 'bg-success' },
        { stage: 'FAILED', expectedColor: 'bg-error' },
        { stage: 'ROLLED_BACK', expectedColor: 'bg-warning' },
      ];

      stages.forEach(({ stage, expectedColor }) => {
        const { container, unmount } = render(
          <UpdateProgressBar
            stage={stage}
            progress={50}
            message={`Testing ${stage}`}
          />
        );

        const progressBarFill = container.querySelector(`.${expectedColor}`);
        expect(progressBarFill).toBeInTheDocument();

        unmount();
      });
    });

    it('applies custom className', () => {
      const { container } = render(
        <UpdateProgressBar
          stage="DOWNLOADING"
          progress={45}
          message="Downloading..."
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
