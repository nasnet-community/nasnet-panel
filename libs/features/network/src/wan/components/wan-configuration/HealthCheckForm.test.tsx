/**
 * Health Check Form Component Tests
 *
 * Tests for WAN health monitoring configuration form.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 5: Health Check)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HealthCheckForm, type HealthCheckFormProps } from './HealthCheckForm';

// Mock dependencies
vi.mock('@nasnet/ui/patterns', async () => {
  const actual = await vi.importActual('@nasnet/ui/patterns');
  return {
    ...actual,
    FormSection: ({ title, children }: any) => (
      <div data-testid="form-section">
        <h3>{title}</h3>
        {children}
      </div>
    ),
    FieldHelp: ({ text }: any) => <span className="field-help">{text}</span>,
  };
});

describe('HealthCheckForm', () => {
  const mockProps: HealthCheckFormProps = {
    routerID: 'router-123',
    wanID: 'wan1',
    gateway: '192.168.1.1',
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render form with all sections', () => {
      render(<HealthCheckForm {...mockProps} />);

      expect(screen.getByText(/Health Monitoring/i)).toBeInTheDocument();
      expect(screen.getByText(/Health Check Target/i)).toBeInTheDocument();
      expect(screen.getByText(/Check Interval/i)).toBeInTheDocument();
      expect(screen.getByText(/Identification/i)).toBeInTheDocument();
    });

    it('should render enable toggle', () => {
      render(<HealthCheckForm {...mockProps} />);

      expect(screen.getByLabelText(/Enable Health Monitoring/i)).toBeInTheDocument();
    });

    it('should render target presets', () => {
      render(<HealthCheckForm {...mockProps} />);

      expect(screen.getByRole('button', { name: /Cloudflare/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Quad9/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Gateway/i })).toBeInTheDocument();
    });

    it('should render interval presets', () => {
      render(<HealthCheckForm {...mockProps} />);

      expect(screen.getByRole('button', { name: /Fast/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Normal/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Slow/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Minimal/i })).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<HealthCheckForm {...mockProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Apply Health Check/i })).toBeInTheDocument();
    });

    it('should show warning when health monitoring is disabled', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      // Toggle off
      const enableToggle = screen.getByLabelText(/Enable Health Monitoring/i);
      await user.click(enableToggle);

      await waitFor(() => {
        expect(screen.getByText(/Health Monitoring Disabled/i)).toBeInTheDocument();
        expect(screen.getByText(/WAN link failures will not be detected/i)).toBeInTheDocument();
      });
    });

    it('should hide configuration sections when disabled', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      // Target section should be visible initially
      expect(screen.getByLabelText(/Target Host\/IP/i)).toBeInTheDocument();

      // Disable monitoring
      const enableToggle = screen.getByLabelText(/Enable Health Monitoring/i);
      await user.click(enableToggle);

      await waitFor(() => {
        expect(screen.queryByLabelText(/Target Host\/IP/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('target presets', () => {
    it('should apply Cloudflare DNS preset', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      const cloudflareButton = screen.getByRole('button', {
        name: /Cloudflare/i,
      });
      await user.click(cloudflareButton);

      const targetInput = screen.getByLabelText(/Target Host\/IP/i) as HTMLInputElement;

      await waitFor(() => {
        expect(targetInput.value).toBe('1.1.1.1');
      });
    });

    it('should apply Google DNS preset', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      const googleButton = screen.getByRole('button', { name: /Google/i });
      await user.click(googleButton);

      const targetInput = screen.getByLabelText(/Target Host\/IP/i) as HTMLInputElement;

      await waitFor(() => {
        expect(targetInput.value).toBe('8.8.8.8');
      });
    });

    it('should apply Gateway preset with actual gateway IP', async () => {
      const user = userEvent.setup();
      render(
        <HealthCheckForm
          {...mockProps}
          gateway="192.168.1.1"
        />
      );

      const gatewayButton = screen.getByRole('button', { name: /Gateway/i });
      await user.click(gatewayButton);

      const targetInput = screen.getByLabelText(/Target Host\/IP/i) as HTMLInputElement;

      await waitFor(() => {
        expect(targetInput.value).toBe('192.168.1.1');
      });
    });

    it('should not show Gateway preset if no gateway provided', () => {
      render(
        <HealthCheckForm
          {...mockProps}
          gateway={undefined}
        />
      );

      const gatewayButton = screen.queryByRole('button', { name: /Gateway/i });
      expect(gatewayButton).not.toBeInTheDocument();
    });

    it('should highlight active preset', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      const cloudflareButton = screen.getByRole('button', {
        name: /Cloudflare/i,
      });
      await user.click(cloudflareButton);

      await waitFor(() => {
        expect(cloudflareButton).toHaveClass('border-primary');
      });
    });
  });

  describe('interval presets', () => {
    it('should apply Fast interval preset (5s)', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      const fastButton = screen.getByRole('button', { name: /Fast/i });
      await user.click(fastButton);

      const intervalInput = screen.getByLabelText(/Interval \(seconds\)/i) as HTMLInputElement;

      await waitFor(() => {
        expect(intervalInput.value).toBe('5');
      });
    });

    it('should apply Normal interval preset (10s)', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      const normalButton = screen.getByRole('button', { name: /Normal/i });
      await user.click(normalButton);

      const intervalInput = screen.getByLabelText(/Interval \(seconds\)/i) as HTMLInputElement;

      await waitFor(() => {
        expect(intervalInput.value).toBe('10');
      });
    });

    it('should highlight active interval preset', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      const normalButton = screen.getByRole('button', { name: /Normal/i });
      await user.click(normalButton);

      await waitFor(() => {
        expect(normalButton).toHaveClass('border-primary');
      });
    });
  });

  describe('form validation', () => {
    it('should validate target IP address format', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      const targetInput = screen.getByLabelText(/Target Host\/IP/i);
      await user.clear(targetInput);
      await user.type(targetInput, 'invalid-ip');

      const submitButton = screen.getByRole('button', {
        name: /Apply Health Check/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid IP address or hostname/i)).toBeInTheDocument();
      });
    });

    it('should accept valid IPv4 addresses', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      const targetInput = screen.getByLabelText(/Target Host\/IP/i);
      await user.clear(targetInput);
      await user.type(targetInput, '203.0.113.1');

      const submitButton = screen.getByRole('button', {
        name: /Apply Health Check/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        const errors = screen.queryAllByText(/Invalid IP address/i);
        expect(errors).toHaveLength(0);
      });
    });

    it('should accept valid hostnames', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      const targetInput = screen.getByLabelText(/Target Host\/IP/i);
      await user.clear(targetInput);
      await user.type(targetInput, 'gateway.example.com');

      const submitButton = screen.getByRole('button', {
        name: /Apply Health Check/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        const errors = screen.queryAllByText(/Invalid.*hostname/i);
        expect(errors).toHaveLength(0);
      });
    });

    it('should validate interval range (5-300 seconds)', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      const intervalInput = screen.getByLabelText(/Interval \(seconds\)/i);
      await user.clear(intervalInput);
      await user.type(intervalInput, '400'); // Too high

      const submitButton = screen.getByRole('button', {
        name: /Apply Health Check/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Interval must not exceed 300 seconds/i)).toBeInTheDocument();
      });
    });

    it('should validate timeout range (1-30 seconds)', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      const timeoutInput = screen.getByLabelText(/Timeout \(seconds\)/i);
      await user.clear(timeoutInput);
      await user.type(timeoutInput, '50'); // Too high

      const submitButton = screen.getByRole('button', {
        name: /Apply Health Check/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Timeout must not exceed 30 seconds/i)).toBeInTheDocument();
      });
    });

    it('should validate timeout is less than interval', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      // Set interval to 10 seconds
      const intervalInput = screen.getByLabelText(/Interval \(seconds\)/i);
      await user.clear(intervalInput);
      await user.type(intervalInput, '10');

      // Set timeout to 15 seconds (invalid - greater than interval)
      const timeoutInput = screen.getByLabelText(/Timeout \(seconds\)/i);
      await user.clear(timeoutInput);
      await user.type(timeoutInput, '15');

      await waitFor(() => {
        expect(screen.getByText(/Timeout must be less than interval/i)).toBeInTheDocument();
      });
    });

    it('should validate failure threshold range (1-10)', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      const thresholdInput = screen.getByLabelText(/Failure Threshold/i);
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '20'); // Too high

      const submitButton = screen.getByRole('button', {
        name: /Apply Health Check/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failure threshold must not exceed 10/i)).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('should call onSuccess after successful configuration', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      render(
        <HealthCheckForm
          {...mockProps}
          onSuccess={onSuccess}
        />
      );

      // Form is valid by default (enabled with default values)
      const submitButton = screen.getByRole('button', {
        name: /Apply Health Check/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <HealthCheckForm
          {...mockProps}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('should change button text when disabled', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      // Disable monitoring
      const enableToggle = screen.getByLabelText(/Enable Health Monitoring/i);
      await user.click(enableToggle);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Disable Health Check/i })).toBeInTheDocument();
      });
    });
  });

  describe('initial values', () => {
    it('should pre-populate form with initial values', () => {
      const initialValues = {
        enabled: false,
        target: '9.9.9.9',
        interval: 30,
        timeout: 5,
        failureThreshold: 5,
        comment: 'Custom health check',
      };

      render(
        <HealthCheckForm
          {...mockProps}
          initialValues={initialValues}
        />
      );

      const targetInput = screen.getByLabelText(/Target Host\/IP/i) as HTMLInputElement;
      expect(targetInput.value).toBe('9.9.9.9');

      const intervalInput = screen.getByLabelText(/Interval \(seconds\)/i) as HTMLInputElement;
      expect(intervalInput.value).toBe('30');

      const commentInput = screen.getByLabelText(/Comment/i) as HTMLInputElement;
      expect(commentInput.value).toBe('Custom health check');
    });
  });

  describe('accessibility', () => {
    it('should have accessible labels for all inputs', () => {
      render(<HealthCheckForm {...mockProps} />);

      expect(screen.getByLabelText(/Enable Health Monitoring/i)).toHaveAccessibleName();
      expect(screen.getByLabelText(/Target Host\/IP/i)).toHaveAccessibleName();
      expect(screen.getByLabelText(/Interval \(seconds\)/i)).toHaveAccessibleName();
      expect(screen.getByLabelText(/Timeout \(seconds\)/i)).toHaveAccessibleName();
      expect(screen.getByLabelText(/Failure Threshold/i)).toHaveAccessibleName();
    });

    it('should associate error messages with inputs', async () => {
      const user = userEvent.setup();
      render(<HealthCheckForm {...mockProps} />);

      const targetInput = screen.getByLabelText(/Target Host\/IP/i);
      await user.clear(targetInput);
      await user.type(targetInput, 'invalid');

      const submitButton = screen.getByRole('button', {
        name: /Apply Health Check/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/Invalid IP address or hostname/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should have accessible navigation buttons', () => {
      render(<HealthCheckForm {...mockProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toHaveAccessibleName();
      expect(screen.getByRole('button', { name: /Apply Health Check/i })).toHaveAccessibleName();
    });
  });
});
