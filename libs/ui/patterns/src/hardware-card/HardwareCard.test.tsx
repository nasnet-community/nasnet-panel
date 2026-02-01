/**
 * HardwareCard Component Tests
 * Tests for the Hardware Details display card component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import type { RouterboardInfo } from '@nasnet/core/types/router';

import { HardwareCard } from './HardwareCard';


// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('HardwareCard', () => {
  const mockHardwareData: RouterboardInfo = {
    serialNumber: 'ABC123456789',
    currentFirmware: '7.14.2',
    factoryFirmware: '6.48.6',
    model: 'RB4011iGS+5HacQ2HnD',
    revision: 'r2',
  };

  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      render(<HardwareCard isLoading={true} />);

      expect(screen.getByText('Hardware Details')).toBeInTheDocument();
      // Skeleton elements are rendered
      const skeletons = screen.getAllByRole('generic').filter(
        (el) => el.className.includes('animate-pulse')
      );
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should render fallback when error occurs', () => {
      const error = new Error('Network error');
      render(<HardwareCard error={error} />);

      expect(screen.getByText('Hardware Details')).toBeInTheDocument();
      expect(
        screen.getByText('Hardware details not available for this device')
      ).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render fallback when data is null', () => {
      render(<HardwareCard data={null} />);

      expect(screen.getByText('Hardware Details')).toBeInTheDocument();
      expect(
        screen.getByText('Hardware details not available for this device')
      ).toBeInTheDocument();
    });

    it('should render fallback when data is undefined', () => {
      render(<HardwareCard data={undefined} />);

      expect(screen.getByText('Hardware Details')).toBeInTheDocument();
      expect(
        screen.getByText('Hardware details not available for this device')
      ).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should render all hardware information fields', () => {
      render(<HardwareCard data={mockHardwareData} />);

      // Check labels
      expect(screen.getByText('Serial Number')).toBeInTheDocument();
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('Firmware')).toBeInTheDocument();
      expect(screen.getByText('Revision')).toBeInTheDocument();

      // Check values
      expect(screen.getByText(mockHardwareData.serialNumber)).toBeInTheDocument();
      expect(screen.getByText(mockHardwareData.model)).toBeInTheDocument();
      expect(screen.getByText(mockHardwareData.currentFirmware)).toBeInTheDocument();
      expect(screen.getByText(mockHardwareData.revision)).toBeInTheDocument();
    });

    it('should display factory firmware when different from current', () => {
      render(<HardwareCard data={mockHardwareData} />);

      expect(screen.getByText('Factory Firmware')).toBeInTheDocument();
      expect(screen.getByText(mockHardwareData.factoryFirmware)).toBeInTheDocument();
    });

    it('should not display factory firmware when same as current', () => {
      const sameVersionData: RouterboardInfo = {
        ...mockHardwareData,
        factoryFirmware: '7.14.2', // Same as current
      };
      render(<HardwareCard data={sameVersionData} />);

      expect(screen.queryByText('Factory Firmware')).not.toBeInTheDocument();
    });
  });

  describe('Copy-to-Clipboard', () => {
    it('should render copy button for serial number', () => {
      render(<HardwareCard data={mockHardwareData} />);

      const copyButton = screen.getByRole('button', {
        name: /copy serial number/i,
      });
      expect(copyButton).toBeInTheDocument();
    });

    it('should copy serial number to clipboard when button clicked', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn();
      Object.assign(navigator.clipboard, { writeText: writeTextMock });

      render(<HardwareCard data={mockHardwareData} />);

      const copyButton = screen.getByRole('button', {
        name: /copy serial number/i,
      });
      await user.click(copyButton);

      expect(writeTextMock).toHaveBeenCalledWith(mockHardwareData.serialNumber);
    });

    it('should show check icon after successful copy', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator.clipboard, { writeText: writeTextMock });

      render(<HardwareCard data={mockHardwareData} />);

      const copyButton = screen.getByRole('button', {
        name: /copy serial number/i,
      });

      // Before click - should show Copy icon
      expect(copyButton.querySelector('svg')).toBeInTheDocument();

      await user.click(copyButton);

      // After click - should show Check icon
      await waitFor(() => {
        const checkIcon = copyButton.querySelector('.text-green-500');
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it('should handle clipboard API failure gracefully', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'));
      Object.assign(navigator.clipboard, { writeText: writeTextMock });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<HardwareCard data={mockHardwareData} />);

      const copyButton = screen.getByRole('button', {
        name: /copy serial number/i,
      });
      await user.click(copyButton);

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<HardwareCard data={mockHardwareData} />);

      // Card should have a title
      const title = screen.getByText('Hardware Details');
      expect(title).toBeInTheDocument();
    });

    it('should have accessible copy button with aria-label', () => {
      render(<HardwareCard data={mockHardwareData} />);

      const copyButton = screen.getByRole('button', {
        name: /copy serial number/i,
      });
      expect(copyButton).toHaveAccessibleName();
    });
  });

  describe('Edge Cases', () => {
    it('should handle N/A values gracefully', () => {
      const naData: RouterboardInfo = {
        serialNumber: 'N/A',
        currentFirmware: 'N/A',
        factoryFirmware: 'N/A',
        model: 'N/A',
        revision: 'N/A',
      };
      render(<HardwareCard data={naData} />);

      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThan(0);
    });

    it('should handle very long serial numbers', () => {
      const longSerialData: RouterboardInfo = {
        ...mockHardwareData,
        serialNumber: 'VERYLONGSERIALNUMBER123456789012345678901234567890',
      };
      render(<HardwareCard data={longSerialData} />);

      expect(screen.getByText(longSerialData.serialNumber)).toBeInTheDocument();
    });

    it('should handle special characters in model name', () => {
      const specialCharsData: RouterboardInfo = {
        ...mockHardwareData,
        model: 'RB4011iGS+5HacQ2HnD-TC&Special#Chars',
      };
      render(<HardwareCard data={specialCharsData} />);

      expect(screen.getByText(specialCharsData.model)).toBeInTheDocument();
    });
  });
});
