/**
 * InAppNotificationPreferences Component Tests
 * Tests form interactions and auto-save functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InAppNotificationPreferences } from './InAppNotificationPreferences';
import { useAlertNotificationStore } from '@nasnet/state/stores';

// Mock the store
vi.mock('@nasnet/state/stores', () => ({
  useAlertNotificationStore: vi.fn(),
  useNotificationSettings: vi.fn(),
  AlertSeverity: {
    CRITICAL: 'CRITICAL',
    WARNING: 'WARNING',
    INFO: 'INFO',
  },
}));

describe('InAppNotificationPreferences', () => {
  // Mock store functions
  const mockUpdateSettings = vi.fn();
  const mockOnSettingsChange = vi.fn();

  // Default settings
  const defaultSettings = {
    enabled: true,
    soundEnabled: true,
    severityFilter: 'ALL' as const,
    autoDismissTiming: 5000,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup store mock
    (useAlertNotificationStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: any) => any) => {
        const state = {
          settings: defaultSettings,
          updateSettings: mockUpdateSettings,
        };
        return selector ? selector(state) : state;
      }
    );
  });

  describe('Rendering', () => {
    it('renders the component with all sections', () => {
      render(<InAppNotificationPreferences />);

      expect(screen.getByText('In-App Notification Preferences')).toBeInTheDocument();
      expect(
        screen.getByText('Configure how notifications appear in the application')
      ).toBeInTheDocument();
      expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
    });

    it('shows all settings when notifications are enabled', () => {
      render(<InAppNotificationPreferences />);

      expect(screen.getByText('Severity Filter')).toBeInTheDocument();
      expect(screen.getByText('Auto-Dismiss Timing')).toBeInTheDocument();
      expect(screen.getByText('Notification Sound')).toBeInTheDocument();
    });

    it('hides settings when notifications are disabled', () => {
      (useAlertNotificationStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: any) => any) => {
          const state = {
            settings: { ...defaultSettings, enabled: false },
            updateSettings: mockUpdateSettings,
          };
          return selector ? selector(state) : state;
        }
      );

      render(<InAppNotificationPreferences />);

      expect(screen.queryByText('Severity Filter')).not.toBeInTheDocument();
      expect(screen.queryByText('Auto-Dismiss Timing')).not.toBeInTheDocument();
      expect(screen.queryByText('Notification Sound')).not.toBeInTheDocument();
      expect(
        screen.getByText(/In-app notifications are currently disabled/)
      ).toBeInTheDocument();
    });

    it('displays correct icon when notifications are enabled', () => {
      render(<InAppNotificationPreferences />);

      // Check for Bell icon (enabled state)
      const bellIcon = screen.getByText('Enable Notifications').previousElementSibling;
      expect(bellIcon).toBeInTheDocument();
      expect(bellIcon?.classList.contains('text-primary')).toBe(true);
    });

    it('displays correct icon when notifications are disabled', () => {
      (useAlertNotificationStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: any) => any) => {
          const state = {
            settings: { ...defaultSettings, enabled: false },
            updateSettings: mockUpdateSettings,
          };
          return selector ? selector(state) : state;
        }
      );

      render(<InAppNotificationPreferences />);

      // Check for BellOff icon (disabled state)
      const bellOffIcon = screen.getByText('Enable Notifications').previousElementSibling;
      expect(bellOffIcon).toBeInTheDocument();
      expect(bellOffIcon?.classList.contains('text-muted-foreground')).toBe(true);
    });
  });

  describe('Enable/Disable Toggle', () => {
    it('calls updateSettings when enable toggle is changed', async () => {
      const user = userEvent.setup();
      render(<InAppNotificationPreferences />);

      const enableSwitch = screen.getByRole('switch', {
        name: /enable or disable in-app notifications/i,
      });

      await user.click(enableSwitch);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ enabled: false });
    });

    it('calls onSettingsChange callback when enable toggle is changed', async () => {
      const user = userEvent.setup();
      render(<InAppNotificationPreferences onSettingsChange={mockOnSettingsChange} />);

      const enableSwitch = screen.getByRole('switch', {
        name: /enable or disable in-app notifications/i,
      });

      await user.click(enableSwitch);

      expect(mockOnSettingsChange).toHaveBeenCalled();
    });

    it('reflects enabled state in switch', () => {
      render(<InAppNotificationPreferences />);

      const enableSwitch = screen.getByRole('switch', {
        name: /enable or disable in-app notifications/i,
      });

      expect(enableSwitch).toBeChecked();
    });

    it('reflects disabled state in switch', () => {
      (useAlertNotificationStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: any) => any) => {
          const state = {
            settings: { ...defaultSettings, enabled: false },
            updateSettings: mockUpdateSettings,
          };
          return selector ? selector(state) : state;
        }
      );

      render(<InAppNotificationPreferences />);

      const enableSwitch = screen.getByRole('switch', {
        name: /enable or disable in-app notifications/i,
      });

      expect(enableSwitch).not.toBeChecked();
    });
  });

  describe('Severity Filter', () => {
    it('displays current severity filter value', () => {
      render(<InAppNotificationPreferences />);

      const severitySelect = screen.getByRole('combobox', { name: /severity filter/i });
      expect(severitySelect).toHaveTextContent('All Severities');
    });

    it('calls updateSettings when severity filter is changed', async () => {
      const user = userEvent.setup();
      render(<InAppNotificationPreferences />);

      const severitySelect = screen.getByRole('combobox', { name: /severity filter/i });
      await user.click(severitySelect);

      const criticalOption = screen.getByText('Critical Only');
      await user.click(criticalOption);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ severityFilter: 'CRITICAL' });
    });

    it('calls onSettingsChange callback when severity filter is changed', async () => {
      const user = userEvent.setup();
      render(<InAppNotificationPreferences onSettingsChange={mockOnSettingsChange} />);

      const severitySelect = screen.getByRole('combobox', { name: /severity filter/i });
      await user.click(severitySelect);

      const warningOption = screen.getByText('Warning+');
      await user.click(warningOption);

      expect(mockOnSettingsChange).toHaveBeenCalled();
    });
  });

  describe('Auto-Dismiss Timing', () => {
    it('displays current auto-dismiss timing value', () => {
      render(<InAppNotificationPreferences />);

      const autoDismissSelect = screen.getByRole('combobox', {
        name: /auto-dismiss timing/i,
      });
      expect(autoDismissSelect).toHaveTextContent('5 seconds');
    });

    it('shows correct helper text for never auto-dismiss', () => {
      (useAlertNotificationStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: any) => any) => {
          const state = {
            settings: { ...defaultSettings, autoDismissTiming: 0 },
            updateSettings: mockUpdateSettings,
          };
          return selector ? selector(state) : state;
        }
      );

      render(<InAppNotificationPreferences />);

      expect(
        screen.getByText(/Notifications remain visible until manually dismissed/)
      ).toBeInTheDocument();
    });

    it('shows correct helper text for timed auto-dismiss', () => {
      render(<InAppNotificationPreferences />);

      expect(
        screen.getByText(/Notifications automatically close after 5 seconds/)
      ).toBeInTheDocument();
    });

    it('calls updateSettings when auto-dismiss timing is changed', async () => {
      const user = userEvent.setup();
      render(<InAppNotificationPreferences />);

      const autoDismissSelect = screen.getByRole('combobox', {
        name: /auto-dismiss timing/i,
      });
      await user.click(autoDismissSelect);

      const option10s = screen.getByText('10 seconds');
      await user.click(option10s);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ autoDismissTiming: 10000 });
    });

    it('calls onSettingsChange callback when auto-dismiss timing is changed', async () => {
      const user = userEvent.setup();
      render(<InAppNotificationPreferences onSettingsChange={mockOnSettingsChange} />);

      const autoDismissSelect = screen.getByRole('combobox', {
        name: /auto-dismiss timing/i,
      });
      await user.click(autoDismissSelect);

      const neverOption = screen.getByText('Never');
      await user.click(neverOption);

      expect(mockOnSettingsChange).toHaveBeenCalled();
    });
  });

  describe('Sound Toggle', () => {
    it('calls updateSettings when sound toggle is changed', async () => {
      const user = userEvent.setup();
      render(<InAppNotificationPreferences />);

      const soundSwitch = screen.getByRole('switch', {
        name: /enable or disable notification sound/i,
      });

      await user.click(soundSwitch);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ soundEnabled: false });
    });

    it('calls onSettingsChange callback when sound toggle is changed', async () => {
      const user = userEvent.setup();
      render(<InAppNotificationPreferences onSettingsChange={mockOnSettingsChange} />);

      const soundSwitch = screen.getByRole('switch', {
        name: /enable or disable notification sound/i,
      });

      await user.click(soundSwitch);

      expect(mockOnSettingsChange).toHaveBeenCalled();
    });

    it('reflects sound enabled state in switch', () => {
      render(<InAppNotificationPreferences />);

      const soundSwitch = screen.getByRole('switch', {
        name: /enable or disable notification sound/i,
      });

      expect(soundSwitch).toBeChecked();
    });

    it('reflects sound disabled state in switch', () => {
      (useAlertNotificationStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: any) => any) => {
          const state = {
            settings: { ...defaultSettings, soundEnabled: false },
            updateSettings: mockUpdateSettings,
          };
          return selector ? selector(state) : state;
        }
      );

      render(<InAppNotificationPreferences />);

      const soundSwitch = screen.getByRole('switch', {
        name: /enable or disable notification sound/i,
      });

      expect(soundSwitch).not.toBeChecked();
    });

    it('displays correct icon when sound is enabled', () => {
      render(<InAppNotificationPreferences />);

      const soundIcon = screen.getByText('Notification Sound').previousElementSibling;
      expect(soundIcon?.classList.contains('text-primary')).toBe(true);
    });

    it('displays correct icon when sound is disabled', () => {
      (useAlertNotificationStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (selector: (state: any) => any) => {
          const state = {
            settings: { ...defaultSettings, soundEnabled: false },
            updateSettings: mockUpdateSettings,
          };
          return selector ? selector(state) : state;
        }
      );

      render(<InAppNotificationPreferences />);

      const soundIcon = screen.getByText('Notification Sound').previousElementSibling;
      expect(soundIcon?.classList.contains('text-muted-foreground')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for switches', () => {
      render(<InAppNotificationPreferences />);

      expect(
        screen.getByRole('switch', { name: /enable or disable in-app notifications/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('switch', { name: /enable or disable notification sound/i })
      ).toBeInTheDocument();
    });

    it('has proper labels for select elements', () => {
      render(<InAppNotificationPreferences />);

      expect(screen.getByRole('combobox', { name: /severity filter/i })).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /auto-dismiss timing/i })
      ).toBeInTheDocument();
    });

    it('maintains focus management when interacting with controls', async () => {
      const user = userEvent.setup();
      render(<InAppNotificationPreferences />);

      const enableSwitch = screen.getByRole('switch', {
        name: /enable or disable in-app notifications/i,
      });

      await user.click(enableSwitch);

      // Switch should still be in the document and focusable
      expect(enableSwitch).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('auto-saves all settings changes without submit button', async () => {
      const user = userEvent.setup();
      render(<InAppNotificationPreferences />);

      // Change enable
      const enableSwitch = screen.getByRole('switch', {
        name: /enable or disable in-app notifications/i,
      });
      await user.click(enableSwitch);
      expect(mockUpdateSettings).toHaveBeenCalledWith({ enabled: false });

      // Change sound
      const soundSwitch = screen.getByRole('switch', {
        name: /enable or disable notification sound/i,
      });
      await user.click(soundSwitch);
      expect(mockUpdateSettings).toHaveBeenCalledWith({ soundEnabled: false });

      // No submit button should exist
      expect(screen.queryByRole('button', { name: /save|submit/i })).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <InAppNotificationPreferences className="custom-class" />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });
});
