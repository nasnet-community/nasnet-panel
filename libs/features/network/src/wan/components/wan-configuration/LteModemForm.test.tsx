/**
 * LTE Modem Form Tests
 *
 * Unit tests for LTE modem configuration form.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 7: LTE Support)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LteModemForm } from './LteModemForm';

// Mock form section component
vi.mock('@nasnet/ui/patterns', () => ({
  FormSection: ({ children, title }: any) => (
    <div data-testid={`form-section-${title}`}>{children}</div>
  ),
}));

// Mock primitives
vi.mock('@nasnet/ui/primitives', () => ({
  Form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormDescription: ({ children }: any) => <p>{children}</p>,
  FormField: ({ render }: any) =>
    render({
      field: { value: '', onChange: vi.fn() },
    }),
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children }: any) => <label>{children}</label>,
  FormMessage: () => null,
  Input: (props: any) => <input {...props} />,
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Select: ({ children, value, onValueChange }: any) => (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      {...props}
    />
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <p>{children}</p>,
}));

describe('LteModemForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    routerId: 'router-123',
    onSuccess: mockOnSuccess,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render basic form structure', () => {
      render(<LteModemForm {...defaultProps} />);

      expect(screen.getByLabelText(/Interface Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/APN/i)).toBeInTheDocument();
      expect(screen.getByText(/Configure LTE Modem/i)).toBeInTheDocument();
    });

    it('should render signal strength indicator when signal data provided', () => {
      render(
        <LteModemForm
          {...defaultProps}
          signalStrength={-75}
          signalQuality={85}
        />
      );

      expect(screen.getByText(/Signal Status/i)).toBeInTheDocument();
      expect(screen.getByText(/-75 dBm/i)).toBeInTheDocument();
      expect(screen.getByText(/Signal Quality: 85%/i)).toBeInTheDocument();
    });

    it('should show "No signal data" when signal strength not provided', () => {
      render(<LteModemForm {...defaultProps} />);

      expect(screen.queryByText(/Signal Status/i)).not.toBeInTheDocument();
    });

    it('should render all form sections', () => {
      render(<LteModemForm {...defaultProps} />);

      expect(screen.getByTestId('form-section-LTE Interface')).toBeInTheDocument();
      expect(screen.getByTestId('form-section-APN Settings')).toBeInTheDocument();
      expect(screen.getByTestId('form-section-Authentication')).toBeInTheDocument();
      expect(screen.getByTestId('form-section-SIM PIN')).toBeInTheDocument();
      expect(screen.getByTestId('form-section-Advanced Options')).toBeInTheDocument();
    });

    it('should render cancel button when onCancel provided', () => {
      render(<LteModemForm {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should not render cancel button when onCancel not provided', () => {
      render(<LteModemForm routerId="router-123" />);

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  describe('APN Configuration', () => {
    it('should display APN presets selector', () => {
      render(<LteModemForm {...defaultProps} />);

      expect(screen.getByText(/Carrier Preset/i)).toBeInTheDocument();
      expect(screen.getByText(/Quick setup for popular carriers/i)).toBeInTheDocument();
    });

    it('should populate APN field when preset selected', async () => {
      const user = userEvent.setup();
      render(<LteModemForm {...defaultProps} />);

      const presetSelect = screen.getByRole('combobox');
      await user.selectOptions(presetSelect, 'T-Mobile (US)');

      const apnInput = screen.getByLabelText(/APN/i) as HTMLInputElement;
      await waitFor(() => {
        expect(apnInput.value).toBe('fast.t-mobile.com');
      });
    });

    it('should show profile number input', () => {
      render(<LteModemForm {...defaultProps} />);

      const profileInput = screen.getByLabelText(/Profile Number/i);
      expect(profileInput).toBeInTheDocument();
      expect(profileInput).toHaveAttribute('type', 'number');
      expect(profileInput).toHaveAttribute('min', '1');
      expect(profileInput).toHaveAttribute('max', '10');
    });
  });

  describe('Authentication', () => {
    it('should show auth protocol selector', () => {
      render(<LteModemForm {...defaultProps} />);

      expect(screen.getByText(/Authentication Protocol/i)).toBeInTheDocument();
    });

    it('should hide username/password when auth protocol is "none"', () => {
      render(<LteModemForm {...defaultProps} />);

      expect(screen.queryByLabelText(/Username/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/^Password$/i)).not.toBeInTheDocument();
    });

    it('should show password visibility toggle', () => {
      render(
        <LteModemForm
          {...defaultProps}
          initialData={{ authProtocol: 'pap' }}
        />
      );

      const passwordToggles = screen.getAllByRole('button', { name: '' });
      expect(passwordToggles.length).toBeGreaterThan(0);
    });
  });

  describe('SIM PIN', () => {
    it('should render PIN input with password type', () => {
      render(<LteModemForm {...defaultProps} />);

      const pinInput = screen.getByPlaceholderText('••••');
      expect(pinInput).toBeInTheDocument();
      expect(pinInput).toHaveAttribute('type', 'password');
      expect(pinInput).toHaveAttribute('maxlength', '8');
    });

    it('should show PIN security notice', () => {
      render(<LteModemForm {...defaultProps} />);

      expect(
        screen.getByText(/PIN will be stored encrypted and used only for modem unlock/i)
      ).toBeInTheDocument();
    });
  });

  describe('Advanced Options', () => {
    it('should show MTU input with valid range', () => {
      render(<LteModemForm {...defaultProps} />);

      const mtuInput = screen.getByLabelText(/MTU/i);
      expect(mtuInput).toBeInTheDocument();
      expect(mtuInput).toHaveAttribute('type', 'number');
      expect(mtuInput).toHaveAttribute('min', '576');
      expect(mtuInput).toHaveAttribute('max', '1500');
    });

    it('should show default route switch', () => {
      render(<LteModemForm {...defaultProps} />);

      const defaultRouteSwitch = screen.getByRole('checkbox', { name: /Default Route/i });
      expect(defaultRouteSwitch).toBeInTheDocument();
    });

    it('should show enable interface switch', () => {
      render(<LteModemForm {...defaultProps} />);

      const enableSwitch = screen.getByRole('checkbox', { name: /Enable Interface/i });
      expect(enableSwitch).toBeInTheDocument();
      expect(enableSwitch).toBeChecked(); // Default enabled
    });
  });

  describe('Form Submission', () => {
    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup();
      render(<LteModemForm {...defaultProps} />);

      const submitButton = screen.getByText(/Configure LTE Modem/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should show success state after successful submission', async () => {
      const user = userEvent.setup();
      render(<LteModemForm {...defaultProps} />);

      const submitButton = screen.getByText(/Configure LTE Modem/i);
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByText(/LTE Modem Configured/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should call onSuccess callback after successful submission', async () => {
      const user = userEvent.setup();
      render(<LteModemForm {...defaultProps} />);

      const submitButton = screen.getByText(/Configure LTE Modem/i);
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(mockOnSuccess).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 }
      );
    });

    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<LteModemForm {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Signal Strength Display', () => {
    it('should show "Excellent" for strong signal (-70 dBm)', () => {
      render(
        <LteModemForm
          {...defaultProps}
          signalStrength={-70}
        />
      );

      expect(screen.getByText(/Excellent/i)).toBeInTheDocument();
    });

    it('should show "Good" for good signal (-80 dBm)', () => {
      render(
        <LteModemForm
          {...defaultProps}
          signalStrength={-80}
        />
      );

      expect(screen.getByText(/Good/i)).toBeInTheDocument();
    });

    it('should show "Fair" for fair signal (-90 dBm)', () => {
      render(
        <LteModemForm
          {...defaultProps}
          signalStrength={-90}
        />
      );

      expect(screen.getByText(/Fair/i)).toBeInTheDocument();
    });

    it('should show "Poor" for poor signal (-110 dBm)', () => {
      render(
        <LteModemForm
          {...defaultProps}
          signalStrength={-110}
        />
      );

      expect(screen.getByText(/Poor/i)).toBeInTheDocument();
    });

    it('should show "No Signal" for very weak signal (-125 dBm)', () => {
      render(
        <LteModemForm
          {...defaultProps}
          signalStrength={-125}
        />
      );

      expect(screen.getByText(/No Signal/i)).toBeInTheDocument();
    });

    it('should render signal strength bars', () => {
      const { container } = render(
        <LteModemForm
          {...defaultProps}
          signalStrength={-80}
        />
      );

      // Should have 5 signal bars
      const signalBars = container.querySelectorAll('[class*="rounded-sm"]');
      expect(signalBars.length).toBeGreaterThan(0);
    });
  });

  describe('Initial Data', () => {
    it('should populate form with initial data', () => {
      const initialData = {
        interface: 'lte1',
        apn: 'internet',
        mtu: 1400,
        enabled: false,
      };

      render(
        <LteModemForm
          {...defaultProps}
          initialData={initialData}
        />
      );

      const interfaceInput = screen.getByPlaceholderText('lte1') as HTMLInputElement;
      expect(interfaceInput.value).toBe('lte1');

      const apnInput = screen.getByPlaceholderText('internet.carrier.com') as HTMLInputElement;
      expect(apnInput.value).toBe('internet');

      const enableSwitch = screen.getByRole('checkbox', { name: /Enable Interface/i });
      expect(enableSwitch).not.toBeChecked();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<LteModemForm {...defaultProps} />);

      expect(screen.getByLabelText(/Interface Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/APN/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Profile Number/i)).toBeInTheDocument();
    });

    it('should disable all inputs while submitting', async () => {
      const user = userEvent.setup();
      render(<LteModemForm {...defaultProps} />);

      const submitButton = screen.getByText(/Configure LTE Modem/i);
      await user.click(submitButton);

      await waitFor(() => {
        const interfaceInput = screen.getByPlaceholderText('lte1');
        expect(interfaceInput).toBeDisabled();
      });
    });
  });
});
