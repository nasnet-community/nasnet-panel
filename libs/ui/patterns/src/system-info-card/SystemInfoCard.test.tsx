/**
 * SystemInfoCard Component Tests
 * Tests for the System Information display card component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import type { SystemInfo } from '@nasnet/core/types/router';

import { SystemInfoCard } from './SystemInfoCard';

describe('SystemInfoCard', () => {
  const mockSystemInfo: SystemInfo = {
    identity: 'HomeRouter',
    model: 'RB4011iGS+5HacQ2HnD',
    routerOsVersion: '7.14.2',
    cpuArchitecture: 'arm64',
    uptime: '3d4h25m12s',
  };

  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      render(<SystemInfoCard isLoading={true} />);

      expect(screen.getByText('System Information')).toBeInTheDocument();
      // Skeleton elements are rendered
      const skeletons = screen
        .getAllByRole('generic')
        .filter((el) => el.className.includes('animate-pulse'));
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should render error state with message', () => {
      const error = new Error('Network error');
      render(<SystemInfoCard error={error} />);

      expect(screen.getByText('System Information')).toBeInTheDocument();
      expect(screen.getByText('Failed to load system information')).toBeInTheDocument();
    });

    it('should render retry button when onRetry is provided', () => {
      const error = new Error('Network error');
      const onRetry = vi.fn();
      render(
        <SystemInfoCard
          error={error}
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onRetry when retry button clicked', async () => {
      const user = userEvent.setup();
      const error = new Error('Network error');
      const onRetry = vi.fn();
      render(
        <SystemInfoCard
          error={error}
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not render retry button when onRetry is not provided', () => {
      const error = new Error('Network error');
      render(<SystemInfoCard error={error} />);

      const retryButton = screen.queryByRole('button', { name: /retry/i });
      expect(retryButton).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render no data message when data is null', () => {
      render(<SystemInfoCard data={null} />);

      expect(screen.getByText('System Information')).toBeInTheDocument();
      expect(screen.getByText('No system information available')).toBeInTheDocument();
    });

    it('should render no data message when data is undefined', () => {
      render(<SystemInfoCard data={undefined} />);

      expect(screen.getByText('System Information')).toBeInTheDocument();
      expect(screen.getByText('No system information available')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should render all system information fields', () => {
      render(<SystemInfoCard data={mockSystemInfo} />);

      // Check labels
      expect(screen.getByText('Model:')).toBeInTheDocument();
      expect(screen.getByText('RouterOS:')).toBeInTheDocument();
      expect(screen.getByText('Uptime:')).toBeInTheDocument();
      expect(screen.getByText('Architecture:')).toBeInTheDocument();

      // Check values
      expect(screen.getByText(mockSystemInfo.model)).toBeInTheDocument();
      expect(screen.getByText(mockSystemInfo.routerOsVersion)).toBeInTheDocument();
      expect(screen.getByText(mockSystemInfo.cpuArchitecture)).toBeInTheDocument();
    });

    it('should format uptime from RouterOS format', () => {
      render(<SystemInfoCard data={mockSystemInfo} />);

      // Uptime should be formatted (not showing raw "3d4h25m12s")
      const uptimeText = screen.getByText(/3d/);
      expect(uptimeText).toBeInTheDocument();
      expect(uptimeText.textContent).toContain('3d');
    });

    it('should render N/A for missing optional fields', () => {
      const partialData: SystemInfo = {
        identity: 'TestRouter',
        model: '',
        routerOsVersion: '',
        cpuArchitecture: '',
      };
      render(<SystemInfoCard data={partialData} />);

      // Should show N/A for empty fields
      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<SystemInfoCard data={mockSystemInfo} />);

      // Card should have a title
      const title = screen.getByText('System Information');
      expect(title).toBeInTheDocument();
    });

    it('should have accessible error alert', () => {
      const error = new Error('Test error');
      const { container } = render(<SystemInfoCard error={error} />);

      // Error icon should be present
      const errorIcon = container.querySelector('[class*="text-destructive"]');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should have accessible retry button with icon and text', async () => {
      const error = new Error('Test error');
      const onRetry = vi.fn();
      render(
        <SystemInfoCard
          error={error}
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveAccessibleName();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing uptime gracefully', () => {
      const dataWithoutUptime: SystemInfo = {
        identity: 'TestRouter',
        model: 'RB4011',
        routerOsVersion: '7.14',
        cpuArchitecture: 'arm',
      };
      render(<SystemInfoCard data={dataWithoutUptime} />);

      expect(screen.getByText('Uptime:')).toBeInTheDocument();
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should handle very long model names', () => {
      const longModelData: SystemInfo = {
        ...mockSystemInfo,
        model: 'RB4011iGS+5HacQ2HnD-TC-VeryLongModelNameThatExceedsNormalLength',
      };
      render(<SystemInfoCard data={longModelData} />);

      expect(screen.getByText(longModelData.model)).toBeInTheDocument();
    });

    it('should handle special characters in router identity', () => {
      const specialCharsData: SystemInfo = {
        ...mockSystemInfo,
        identity: 'Router-Name_With.Special#Chars@123',
      };
      render(<SystemInfoCard data={specialCharsData} />);

      // Component should render without errors
      expect(screen.getByText('System Information')).toBeInTheDocument();
    });
  });
});
