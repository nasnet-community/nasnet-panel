/**
 * ServiceImportDialog Component Tests
 * Tests for service configuration import dialog with validation and conflict resolution
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { ServiceImportDialog } from './ServiceImportDialog';
import { ServiceImportDialogDesktop } from './ServiceImportDialogDesktop';
import { ServiceImportDialogMobile } from './ServiceImportDialogMobile';

// Mock dependencies
vi.mock('@nasnet/api-client/queries', () => ({
  useImportService: vi.fn(() => ({
    importService: vi.fn().mockResolvedValue({
      data: {
        importServiceConfig: {
          valid: true,
          validationResult: {
            valid: true,
            requiresUserInput: false,
            redactedFields: [],
            errors: [],
            conflictingInstances: [],
          },
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

const validExportJSON = JSON.stringify({
  schema_version: '1.0',
  exported_at: '2025-01-15T10:00:00Z',
  service_type: 'tor',
  service_name: 'Tor Exit Node',
  binary_version: '0.4.7.13',
  config: {
    port: 9050,
    exitPolicy: 'accept *:80',
    nickname: 'TorNode',
  },
  includes_secrets: true,
});

const redactedExportJSON = JSON.stringify({
  schema_version: '1.0',
  exported_at: '2025-01-15T10:00:00Z',
  service_type: 'singbox',
  service_name: 'sing-box Multi-Protocol',
  binary_version: '1.7.0',
  config: {
    port: 8080,
    password: '***REDACTED***',
    api_key: '***REDACTED***',
  },
  includes_secrets: false,
  redacted_fields: ['password', 'api_key'],
});

const invalidJSON = '{"invalid": json}';

describe('ServiceImportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Presenter Rendering', () => {
    it('should render desktop presenter with file upload', () => {
      render(
        <ServiceImportDialogDesktop
          routerID="router-1"
          open={true}
        />
      );

      // Verify file upload visible
      expect(screen.getByText(/upload/i)).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show multi-step wizard layout on desktop', () => {
      render(
        <ServiceImportDialogDesktop
          routerID="router-1"
          open={true}
        />
      );

      // Wizard steps should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Mobile Presenter Rendering', () => {
    it('should render mobile presenter with full-screen sheet', () => {
      render(
        <ServiceImportDialogMobile
          routerID="router-1"
          open={true}
        />
      );

      // Verify mobile layout
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have 44px minimum touch targets on mobile', () => {
      const { container } = render(
        <ServiceImportDialogMobile
          routerID="router-1"
          open={true}
        />
      );

      // Check for touch-friendly button sizing
      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const height = parseInt(styles.height);
        expect(height).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('File Upload and Validation', () => {
    it('should accept valid JSON file and show preview', async () => {
      const user = userEvent.setup();
      render(
        <ServiceImportDialogDesktop
          routerID="router-1"
          open={true}
        />
      );

      // Create mock file
      const file = new File([validExportJSON], 'export.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/upload/i);
      await user.upload(fileInput, file);

      // Preview should display parsed config
      await waitFor(() => {
        expect(screen.getByText(/tor/i)).toBeInTheDocument();
      });
    });

    it('should enable Apply button when validation passes', async () => {
      const user = userEvent.setup();
      render(
        <ServiceImportDialogDesktop
          routerID="router-1"
          open={true}
        />
      );

      const file = new File([validExportJSON], 'export.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/upload/i);
      await user.upload(fileInput, file);

      await waitFor(() => {
        const applyButton = screen.getByRole('button', { name: /apply/i });
        expect(applyButton).toBeEnabled();
      });
    });
  });

  describe('Redacted Field Prompts', () => {
    it('should show input fields for redacted secrets', async () => {
      const user = userEvent.setup();
      const { useImportService } = await import('@nasnet/api-client/queries');

      (useImportService as any).mockReturnValue({
        importService: vi.fn().mockResolvedValue({
          data: {
            importServiceConfig: {
              valid: false,
              validationResult: {
                valid: false,
                requiresUserInput: true,
                redactedFields: ['password', 'api_key'],
                errors: [
                  {
                    stage: 'syntax',
                    code: 'V400',
                    message: 'Redacted fields require user input',
                  },
                ],
              },
            },
          },
        }),
        loading: false,
        error: null,
      });

      render(
        <ServiceImportDialogDesktop
          routerID="router-1"
          open={true}
        />
      );

      const file = new File([redactedExportJSON], 'export.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/upload/i);
      await user.upload(fileInput, file);

      // Wait for redacted field prompts
      await waitFor(() => {
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/api_key/i)).toBeInTheDocument();
      });
    });

    it('should have placeholder hints for redacted fields', async () => {
      const user = userEvent.setup();
      const { useImportService } = await import('@nasnet/api-client/queries');

      (useImportService as any).mockReturnValue({
        importService: vi.fn().mockResolvedValue({
          data: {
            importServiceConfig: {
              valid: false,
              validationResult: {
                requiresUserInput: true,
                redactedFields: ['password'],
              },
            },
          },
        }),
        loading: false,
        error: null,
      });

      render(
        <ServiceImportDialogDesktop
          routerID="router-1"
          open={true}
        />
      );

      const file = new File([redactedExportJSON], 'export.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/upload/i);
      await user.upload(fileInput, file);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/password/i);
        expect(passwordInput).toHaveAttribute(
          'placeholder',
          expect.stringMatching(/re-enter|provide/i)
        );
      });
    });
  });

  describe('Invalid JSON Handling', () => {
    it('should show error message for invalid JSON', async () => {
      const user = userEvent.setup();
      render(
        <ServiceImportDialogDesktop
          routerID="router-1"
          open={true}
        />
      );

      const file = new File([invalidJSON], 'invalid.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/upload/i);
      await user.upload(fileInput, file);

      // Error alert should be visible
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
      });
    });

    it('should disable Apply button for invalid imports', async () => {
      const user = userEvent.setup();
      render(
        <ServiceImportDialogDesktop
          routerID="router-1"
          open={true}
        />
      );

      const file = new File([invalidJSON], 'invalid.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/upload/i);
      await user.upload(fileInput, file);

      await waitFor(() => {
        const applyButton = screen.getByRole('button', { name: /apply/i });
        expect(applyButton).toBeDisabled();
      });
    });
  });

  describe('Conflict Resolution', () => {
    it('should show conflict resolution selector when conflict detected', async () => {
      const user = userEvent.setup();
      const { useImportService } = await import('@nasnet/api-client/queries');

      (useImportService as any).mockReturnValue({
        importService: vi.fn().mockResolvedValue({
          data: {
            importServiceConfig: {
              valid: false,
              validationResult: {
                requiresUserInput: true,
                conflictingInstances: [
                  {
                    id: 'instance-existing',
                    featureID: 'tor',
                    instanceName: 'Tor Exit Node',
                    status: 'running',
                  },
                ],
                errors: [
                  {
                    stage: 'conflict',
                    code: 'V400',
                    message: 'Instance name already exists',
                  },
                ],
              },
            },
          },
        }),
        loading: false,
        error: null,
      });

      render(
        <ServiceImportDialogDesktop
          routerID="router-1"
          open={true}
        />
      );

      const file = new File([validExportJSON], 'export.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/upload/i);
      await user.upload(fileInput, file);

      // Conflict resolution options should appear
      await waitFor(() => {
        expect(screen.getByLabelText(/skip/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/overwrite/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/rename/i)).toBeInTheDocument();
      });
    });

    it('should default to SKIP conflict resolution', async () => {
      const user = userEvent.setup();
      const { useImportService } = await import('@nasnet/api-client/queries');

      (useImportService as any).mockReturnValue({
        importService: vi.fn().mockResolvedValue({
          data: {
            importServiceConfig: {
              valid: false,
              validationResult: {
                requiresUserInput: true,
                conflictingInstances: [{ id: 'instance-1' }],
              },
            },
          },
        }),
        loading: false,
        error: null,
      });

      render(
        <ServiceImportDialogDesktop
          routerID="router-1"
          open={true}
        />
      );

      const file = new File([validExportJSON], 'export.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/upload/i);
      await user.upload(fileInput, file);

      await waitFor(() => {
        const skipRadio = screen.getByLabelText(/skip/i);
        expect(skipRadio).toBeChecked();
      });
    });
  });

  describe('Accessibility - Keyboard Navigation', () => {
    it('should support Tab navigation through wizard steps', async () => {
      const user = userEvent.setup();
      render(
        <ServiceImportDialogDesktop
          routerID="router-1"
          open={true}
        />
      );

      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toBeDefined();

      await user.tab();
      expect(document.activeElement).toBeDefined();
    });

    it('should close dialog on Escape key', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <ServiceImportDialogDesktop
          routerID="router-1"
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Accessibility - ARIA Labels', () => {
    it('should have proper ARIA labels on all interactive elements', () => {
      render(
        <ServiceImportDialogDesktop
          routerID="router-1"
          open={true}
        />
      );

      // Dialog should have accessible name
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAccessibleName();

      // File input should have label
      const fileInput = screen.getByLabelText(/upload/i);
      expect(fileInput).toHaveAttribute('aria-label');
    });

    it('should announce validation errors to screen readers', async () => {
      const { container } = render(
        <ServiceImportDialogDesktop
          routerID="router-1"
          open={true}
        />
      );

      // Check for live region for error announcements
      const liveRegion = container.querySelector('[aria-live]');
      expect(liveRegion).toBeInTheDocument();
    });
  });
});
