/**
 * Static IP Form Component Tests
 *
 * Tests for Static IP WAN configuration form.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 4: Static IP)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StaticIPForm, type StaticIPFormProps } from './StaticIPForm';

// Mock dependencies
vi.mock('@nasnet/ui/patterns', async () => {
  const actual = await vi.importActual('@nasnet/ui/patterns');
  return {
    ...actual,
    InterfaceSelector: ({ value, onChange }: any) => (
      <select
        data-testid="interface-selector"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select Interface</option>
        <option value="ether1">ether1</option>
        <option value="ether2">ether2</option>
      </select>
    ),
    FormSection: ({ title, children }: any) => (
      <div data-testid="form-section">
        <h3>{title}</h3>
        {children}
      </div>
    ),
    SafetyConfirmation: ({ onConfirm, onCancel, children }: any) => (
      <div data-testid="safety-confirmation">
        {children}
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ),
  };
});

vi.mock('@nasnet/api-client/queries', () => ({
  useConfigureStaticWAN: () => [
    vi.fn().mockResolvedValue({
      data: {
        configureStaticWAN: {
          success: true,
          wanInterface: {
            interfaceName: 'ether1',
            status: 'CONNECTED',
            publicIP: '203.0.113.10',
            gateway: '203.0.113.1',
          },
        },
      },
    }),
    { loading: false, error: null },
  ],
}));

describe('StaticIPForm', () => {
  const mockProps: StaticIPFormProps = {
    routerId: 'router-123',
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render form with all sections', () => {
      render(<StaticIPForm {...mockProps} />);

      // Check for main form sections
      expect(screen.getByText(/Interface Configuration/i)).toBeInTheDocument();
      expect(screen.getByText(/IP Address Configuration/i)).toBeInTheDocument();
      expect(screen.getByText(/DNS Servers/i)).toBeInTheDocument();
      expect(screen.getByText(/Identification/i)).toBeInTheDocument();
    });

    it('should render interface selector', () => {
      render(<StaticIPForm {...mockProps} />);

      expect(screen.getByTestId('interface-selector')).toBeInTheDocument();
    });

    it('should render IP address input', () => {
      render(<StaticIPForm {...mockProps} />);

      expect(
        screen.getByLabelText(/IP Address \(CIDR\)/i)
      ).toBeInTheDocument();
    });

    it('should render gateway input', () => {
      render(<StaticIPForm {...mockProps} />);

      expect(screen.getByLabelText(/Gateway/i)).toBeInTheDocument();
    });

    it('should render DNS inputs', () => {
      render(<StaticIPForm {...mockProps} />);

      expect(screen.getByLabelText(/Primary DNS/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Secondary DNS/i)).toBeInTheDocument();
    });

    it('should render default route toggle', () => {
      render(<StaticIPForm {...mockProps} />);

      expect(screen.getByLabelText(/Add Default Route/i)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<StaticIPForm {...mockProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should require interface selection', async () => {
      const user = userEvent.setup();
      render(<StaticIPForm {...mockProps} />);

      const submitButton = screen.getByRole('button', { name: /apply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/interface is required/i)).toBeInTheDocument();
      });
    });

    it('should validate CIDR format for IP address', async () => {
      const user = userEvent.setup();
      render(<StaticIPForm {...mockProps} />);

      const ipInput = screen.getByLabelText(/IP Address \(CIDR\)/i);
      await user.type(ipInput, '192.168.1.1'); // Missing /prefix

      const submitButton = screen.getByRole('button', { name: /apply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Invalid CIDR notation/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate IPv4 format for gateway', async () => {
      const user = userEvent.setup();
      render(<StaticIPForm {...mockProps} />);

      const gatewayInput = screen.getByLabelText(/Gateway/i);
      await user.type(gatewayInput, '999.999.999.999'); // Invalid IP

      const submitButton = screen.getByRole('button', { name: /apply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Invalid IPv4 address/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate gateway is in same subnet as IP', async () => {
      const user = userEvent.setup();
      render(<StaticIPForm {...mockProps} />);

      // Select interface
      const interfaceSelector = screen.getByTestId('interface-selector');
      await user.selectOptions(interfaceSelector, 'ether1');

      // Enter IP in 192.168.1.0/24 subnet
      const ipInput = screen.getByLabelText(/IP Address \(CIDR\)/i);
      await user.type(ipInput, '192.168.1.10/24');

      // Enter gateway in different subnet
      const gatewayInput = screen.getByLabelText(/Gateway/i);
      await user.type(gatewayInput, '10.0.0.1');

      const submitButton = screen.getByRole('button', { name: /apply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Gateway must be in the same subnet/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate optional DNS format', async () => {
      const user = userEvent.setup();
      render(<StaticIPForm {...mockProps} />);

      const dns1Input = screen.getByLabelText(/Primary DNS/i);
      await user.type(dns1Input, 'not-an-ip'); // Invalid IP

      const submitButton = screen.getByRole('button', { name: /apply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Invalid IPv4 address/i)
        ).toBeInTheDocument();
      });
    });

    it('should allow empty DNS fields', async () => {
      const user = userEvent.setup();
      render(<StaticIPForm {...mockProps} />);

      // Fill required fields only
      const interfaceSelector = screen.getByTestId('interface-selector');
      await user.selectOptions(interfaceSelector, 'ether1');

      const ipInput = screen.getByLabelText(/IP Address \(CIDR\)/i);
      await user.type(ipInput, '192.168.1.10/24');

      const gatewayInput = screen.getByLabelText(/Gateway/i);
      await user.type(gatewayInput, '192.168.1.1');

      // Leave DNS fields empty - should be valid
      const submitButton = screen.getByRole('button', { name: /apply/i });
      await user.click(submitButton);

      // Should not show DNS validation errors
      await waitFor(() => {
        const dnsErrors = screen.queryAllByText(/DNS.*required/i);
        expect(dnsErrors).toHaveLength(0);
      });
    });
  });

  describe('subnet presets', () => {
    it('should render subnet preset buttons', () => {
      render(<StaticIPForm {...mockProps} />);

      expect(screen.getByRole('button', { name: /\/30/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\/29/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\/28/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\/24/i })).toBeInTheDocument();
    });

    it('should apply subnet mask preset to IP address', async () => {
      const user = userEvent.setup();
      render(<StaticIPForm {...mockProps} />);

      // Enter IP without subnet
      const ipInput = screen.getByLabelText(
        /IP Address \(CIDR\)/i
      ) as HTMLInputElement;
      await user.type(ipInput, '192.168.1.10');

      // Click /24 preset
      const preset24Button = screen.getByRole('button', { name: /\/24/i });
      await user.click(preset24Button);

      // IP should now have /24 suffix
      await waitFor(() => {
        expect(ipInput.value).toBe('192.168.1.10/24');
      });
    });

    it('should replace existing subnet mask when preset clicked', async () => {
      const user = userEvent.setup();
      render(<StaticIPForm {...mockProps} />);

      // Enter IP with /30 subnet
      const ipInput = screen.getByLabelText(
        /IP Address \(CIDR\)/i
      ) as HTMLInputElement;
      await user.type(ipInput, '192.168.1.10/30');

      // Click /24 preset
      const preset24Button = screen.getByRole('button', { name: /\/24/i });
      await user.click(preset24Button);

      // IP should now have /24 suffix
      await waitFor(() => {
        expect(ipInput.value).toBe('192.168.1.10/24');
      });
    });
  });

  describe('DNS presets', () => {
    it('should render DNS preset buttons', () => {
      render(<StaticIPForm {...mockProps} />);

      expect(
        screen.getByRole('button', { name: /Cloudflare/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Google/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Quad9/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /OpenDNS/i })
      ).toBeInTheDocument();
    });

    it('should apply Cloudflare DNS preset', async () => {
      const user = userEvent.setup();
      render(<StaticIPForm {...mockProps} />);

      const cloudflareButton = screen.getByRole('button', {
        name: /Cloudflare/i,
      });
      await user.click(cloudflareButton);

      const dns1Input = screen.getByLabelText(
        /Primary DNS/i
      ) as HTMLInputElement;
      const dns2Input = screen.getByLabelText(
        /Secondary DNS/i
      ) as HTMLInputElement;

      await waitFor(() => {
        expect(dns1Input.value).toBe('1.1.1.1');
        expect(dns2Input.value).toBe('1.0.0.1');
      });
    });

    it('should apply Google DNS preset', async () => {
      const user = userEvent.setup();
      render(<StaticIPForm {...mockProps} />);

      const googleButton = screen.getByRole('button', { name: /Google/i });
      await user.click(googleButton);

      const dns1Input = screen.getByLabelText(
        /Primary DNS/i
      ) as HTMLInputElement;
      const dns2Input = screen.getByLabelText(
        /Secondary DNS/i
      ) as HTMLInputElement;

      await waitFor(() => {
        expect(dns1Input.value).toBe('8.8.8.8');
        expect(dns2Input.value).toBe('8.8.4.4');
      });
    });
  });

  describe('safety confirmation', () => {
    it('should show safety warning when default route is enabled', async () => {
      const user = userEvent.setup();
      render(<StaticIPForm {...mockProps} />);

      // Fill form with valid data
      const interfaceSelector = screen.getByTestId('interface-selector');
      await user.selectOptions(interfaceSelector, 'ether1');

      const ipInput = screen.getByLabelText(/IP Address \(CIDR\)/i);
      await user.type(ipInput, '203.0.113.10/24');

      const gatewayInput = screen.getByLabelText(/Gateway/i);
      await user.type(gatewayInput, '203.0.113.1');

      // Enable default route
      const defaultRouteToggle = screen.getByLabelText(/Add Default Route/i);
      await user.click(defaultRouteToggle);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /apply/i });
      await user.click(submitButton);

      // Safety confirmation should appear
      await waitFor(() => {
        expect(screen.getByTestId('safety-confirmation')).toBeInTheDocument();
      });
    });

    it('should not show safety warning when default route is disabled', async () => {
      const user = userEvent.setup();
      render(<StaticIPForm {...mockProps} />);

      // Fill form with valid data
      const interfaceSelector = screen.getByTestId('interface-selector');
      await user.selectOptions(interfaceSelector, 'ether1');

      const ipInput = screen.getByLabelText(/IP Address \(CIDR\)/i);
      await user.type(ipInput, '203.0.113.10/24');

      const gatewayInput = screen.getByLabelText(/Gateway/i);
      await user.type(gatewayInput, '203.0.113.1');

      // Default route should be disabled by default
      // Submit form
      const submitButton = screen.getByRole('button', { name: /apply/i });
      await user.click(submitButton);

      // Safety confirmation should not appear (or should submit directly)
      await waitFor(() => {
        const safetyConfirmation = screen.queryByTestId('safety-confirmation');
        // Either no confirmation, or submission happened
        expect(safetyConfirmation).not.toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('should call onSuccess after successful configuration', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      render(<StaticIPForm {...mockProps} onSuccess={onSuccess} />);

      // Fill form
      const interfaceSelector = screen.getByTestId('interface-selector');
      await user.selectOptions(interfaceSelector, 'ether1');

      const ipInput = screen.getByLabelText(/IP Address \(CIDR\)/i);
      await user.type(ipInput, '203.0.113.10/24');

      const gatewayInput = screen.getByLabelText(/Gateway/i);
      await user.type(gatewayInput, '203.0.113.1');

      // Submit
      const submitButton = screen.getByRole('button', { name: /apply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<StaticIPForm {...mockProps} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('should disable submit button while loading', async () => {
      const user = userEvent.setup();

      // Mock loading state
      vi.mocked(require('@nasnet/api-client/queries').useConfigureStaticWAN).mockReturnValue([
        vi.fn(),
        { loading: true, error: null },
      ]);

      render(<StaticIPForm {...mockProps} />);

      const submitButton = screen.getByRole('button', { name: /apply/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('should have accessible labels for all form fields', () => {
      render(<StaticIPForm {...mockProps} />);

      expect(screen.getByLabelText(/Interface/i)).toHaveAccessibleName();
      expect(
        screen.getByLabelText(/IP Address \(CIDR\)/i)
      ).toHaveAccessibleName();
      expect(screen.getByLabelText(/Gateway/i)).toHaveAccessibleName();
      expect(screen.getByLabelText(/Primary DNS/i)).toHaveAccessibleName();
      expect(screen.getByLabelText(/Secondary DNS/i)).toHaveAccessibleName();
      expect(
        screen.getByLabelText(/Add Default Route/i)
      ).toHaveAccessibleName();
    });

    it('should associate error messages with inputs', async () => {
      const user = userEvent.setup();
      render(<StaticIPForm {...mockProps} />);

      const ipInput = screen.getByLabelText(/IP Address \(CIDR\)/i);
      await user.type(ipInput, 'invalid');

      const submitButton = screen.getByRole('button', { name: /apply/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/Invalid CIDR notation/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should have accessible navigation buttons', () => {
      render(<StaticIPForm {...mockProps} />);

      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toHaveAccessibleName();
      expect(
        screen.getByRole('button', { name: /apply/i })
      ).toHaveAccessibleName();
    });
  });

  describe('error handling', () => {
    it('should display error message when mutation fails', async () => {
      // Mock error state
      vi.mocked(require('@nasnet/api-client/queries').useConfigureStaticWAN).mockReturnValue([
        vi.fn(),
        {
          loading: false,
          error: { message: 'Network error: Failed to configure static IP' },
        },
      ]);

      render(<StaticIPForm {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Network error: Failed to configure static IP/i)
        ).toBeInTheDocument();
      });
    });
  });
});
