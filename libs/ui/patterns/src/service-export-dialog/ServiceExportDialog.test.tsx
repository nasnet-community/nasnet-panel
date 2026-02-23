/**
 * ServiceExportDialog Component Tests
 * Tests for service configuration export dialog with platform presenters
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { ServiceExportDialog } from './ServiceExportDialog';
import { ServiceExportDialogDesktop } from './ServiceExportDialogDesktop';
import { ServiceExportDialogMobile } from './ServiceExportDialogMobile';

// Mock dependencies
vi.mock('@nasnet/api-client/queries', () => ({
  useExportService: vi.fn(() => ({
    exportService: vi.fn().mockResolvedValue({
      data: {
        exportServiceConfig: {
          success: true,
          downloadURL: 'https://example.com/download/export.json',
          package: {
            version: '1.0',
            exportedAt: '2025-01-15T10:00:00Z',
            service: {
              featureID: 'tor',
              instanceName: 'Tor Exit Node',
              config: { port: 9050 },
            },
          },
        },
      },
    }),
    loading: false,
    error: null,
  })),
  useGenerateConfigQR: vi.fn(() => ({
    generateQR: vi.fn().mockResolvedValue({
      data: {
        generateConfigQR: {
          imageDataBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAUA',
          downloadURL: 'https://example.com/download/qr.png',
          imageSize: 1234,
          dataSize: 567,
        },
      },
    }),
    loading: false,
    error: null,
  })),
}));

vi.mock('@/hooks/usePlatform', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

const mockInstance = {
  id: 'instance-123',
  featureID: 'tor',
  instanceName: 'Tor Exit Node',
  routerID: 'router-1',
  status: 'RUNNING' as const,
  vlanID: 100,
  bindIP: '10.200.100.2',
  ports: [9050, 9051],
  config: {
    exitPolicy: 'accept *:80',
    nickname: 'TorNode',
  },
  binaryPath: '/opt/tor/tor',
  binaryVersion: '0.4.7.13',
  binaryChecksum: 'sha256:abc123',
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
};

describe('ServiceExportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Presenter Rendering', () => {
    it('should render desktop presenter with export options', () => {
      render(
        <ServiceExportDialogDesktop
          routerID="router-1"
          instance={mockInstance}
          open={true}
        />
      );

      // Verify format selector visible
      expect(screen.getByText(/format/i)).toBeInTheDocument();

      // Verify export options
      expect(screen.getByLabelText(/redact secrets/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/include routing/i)).toBeInTheDocument();
    });

    it('should render JSON preview panel in desktop mode', () => {
      render(
        <ServiceExportDialogDesktop
          routerID="router-1"
          instance={mockInstance}
          open={true}
        />
      );

      // Verify preview area exists
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Mobile Presenter Rendering', () => {
    it('should render mobile presenter with touch-friendly controls', () => {
      render(
        <ServiceExportDialogMobile
          routerID="router-1"
          instance={mockInstance}
          open={true}
        />
      );

      // Verify mobile-specific layout
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/redact secrets/i)).toBeInTheDocument();
    });

    it('should have 44px minimum touch targets on mobile', () => {
      const { container } = render(
        <ServiceExportDialogMobile
          routerID="router-1"
          instance={mockInstance}
          open={true}
        />
      );

      // Check for touch-friendly button sizing
      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const height = parseInt(styles.height);
        // 44px = 2.75rem = h-11 in Tailwind
        expect(height).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Export Options', () => {
    it('should toggle redact secrets option', async () => {
      const user = userEvent.setup();
      render(
        <ServiceExportDialogDesktop
          routerID="router-1"
          instance={mockInstance}
          open={true}
        />
      );

      const redactToggle = screen.getByLabelText(/redact secrets/i) as HTMLInputElement;
      expect(redactToggle).toBeInTheDocument();

      // Toggle the option
      await user.click(redactToggle);
      expect(redactToggle).toBeChecked();

      await user.click(redactToggle);
      expect(redactToggle).not.toBeChecked();
    });

    it('should toggle include routing rules option', async () => {
      const user = userEvent.setup();
      render(
        <ServiceExportDialogDesktop
          routerID="router-1"
          instance={mockInstance}
          open={true}
        />
      );

      const routingToggle = screen.getByLabelText(/include routing/i) as HTMLInputElement;
      expect(routingToggle).toBeInTheDocument();

      await user.click(routingToggle);
      expect(routingToggle).toBeChecked();
    });

    it('should switch between JSON and QR format', async () => {
      const user = userEvent.setup();
      render(
        <ServiceExportDialogDesktop
          routerID="router-1"
          instance={mockInstance}
          open={true}
        />
      );

      // Check JSON format is default
      const jsonRadio = screen.getByLabelText(/json/i);
      expect(jsonRadio).toBeChecked();

      // Switch to QR format
      const qrRadio = screen.getByLabelText(/qr code/i);
      await user.click(qrRadio);
      expect(qrRadio).toBeChecked();
      expect(jsonRadio).not.toBeChecked();
    });
  });

  describe('Accessibility - Keyboard Navigation', () => {
    it('should support Tab navigation through fields', async () => {
      const user = userEvent.setup();
      render(
        <ServiceExportDialogDesktop
          routerID="router-1"
          instance={mockInstance}
          open={true}
        />
      );

      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toHaveAttribute('role', 'radio');

      await user.tab();
      expect(document.activeElement).toHaveAttribute('type', 'checkbox');
    });

    it('should close dialog on Escape key', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <ServiceExportDialogDesktop
          routerID="router-1"
          instance={mockInstance}
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should activate export on Enter key', async () => {
      const user = userEvent.setup();
      const onExportComplete = vi.fn();

      render(
        <ServiceExportDialogDesktop
          routerID="router-1"
          instance={mockInstance}
          open={true}
          onExportComplete={onExportComplete}
        />
      );

      const exportButton = screen.getByRole('button', { name: /export/i });
      exportButton.focus();

      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(onExportComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility - Focus Trap', () => {
    it('should trap focus within dialog when open', async () => {
      const user = userEvent.setup();
      render(
        <ServiceExportDialogDesktop
          routerID="router-1"
          instance={mockInstance}
          open={true}
        />
      );

      const dialog = screen.getByRole('dialog');
      const interactiveElements = dialog.querySelectorAll(
        'button, [role="radio"], [type="checkbox"]'
      );

      // Tab through all elements
      for (let i = 0; i < interactiveElements.length + 2; i++) {
        await user.tab();
      }

      // Focus should stay within dialog
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  describe('Accessibility - ARIA Labels', () => {
    it('should have proper ARIA labels on all interactive elements', () => {
      render(
        <ServiceExportDialogDesktop
          routerID="router-1"
          instance={mockInstance}
          open={true}
        />
      );

      // Dialog should have accessible name
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAccessibleName();

      // Checkboxes should have labels
      const redactToggle = screen.getByLabelText(/redact secrets/i);
      expect(redactToggle).toHaveAttribute('aria-label');

      // Radio buttons should have labels
      const jsonRadio = screen.getByLabelText(/json/i);
      expect(jsonRadio).toHaveAttribute('aria-label');
    });

    it('should announce export status to screen readers', async () => {
      const { container } = render(
        <ServiceExportDialogDesktop
          routerID="router-1"
          instance={mockInstance}
          open={true}
        />
      );

      // Check for live region for status announcements
      const liveRegion = container.querySelector('[aria-live]');
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe('Export Action', () => {
    it('should call exportService mutation on export button click', async () => {
      const user = userEvent.setup();
      const { useExportService } = await import('@nasnet/api-client/queries');
      const exportMock = vi.fn().mockResolvedValue({
        data: {
          exportServiceConfig: { success: true, downloadURL: 'https://example.com/export.json' },
        },
      });

      (useExportService as any).mockReturnValue({
        exportService: exportMock,
        loading: false,
        error: null,
      });

      render(
        <ServiceExportDialogDesktop
          routerID="router-1"
          instance={mockInstance}
          open={true}
        />
      );

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(exportMock).toHaveBeenCalledWith(
          expect.objectContaining({
            routerID: 'router-1',
            instanceID: 'instance-123',
          })
        );
      });
    });
  });
});
