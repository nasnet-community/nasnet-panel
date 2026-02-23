/**
 * Tests for QuotaSettingsForm component
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 *
 * @description
 * Component tests for traffic quota form including form submission,
 * validation, error handling, quota removal, and accessibility.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuotaSettingsForm } from './QuotaSettingsForm';
import * as apiClient from '@nasnet/api-client/queries';

// Mock API client
vi.mock('@nasnet/api-client/queries', () => ({
  useSetTrafficQuota: vi.fn(),
  useResetTrafficQuota: vi.fn(),
}));

describe('QuotaSettingsForm', () => {
  const mockRouterID = 'router-123';
  const mockInstanceID = 'instance-456';
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.useSetTrafficQuota).mockReturnValue([
      vi.fn().mockResolvedValue({
        data: {
          setTrafficQuota: {
            quota: { limitBytes: 100000000 },
            errors: [],
          },
        },
      }),
      { loading: false, called: false, client: {} as any, reset: vi.fn() },
    ]);
    vi.mocked(apiClient.useResetTrafficQuota).mockReturnValue([
      vi.fn().mockResolvedValue({
        data: {
          resetTrafficQuota: {
            errors: [],
          },
        },
      }),
      { loading: false, called: false, client: {} as any, reset: vi.fn() },
    ]);
  });

  it('should render form with all fields', () => {
    render(
      <QuotaSettingsForm
        routerID={mockRouterID}
        instanceID={mockInstanceID}
      />
    );

    expect(screen.getByText('Traffic Quota Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Quota Period')).toBeInTheDocument();
    expect(screen.getByLabelText('Quota Limit (GB)')).toBeInTheDocument();
    expect(screen.getByLabelText('Warning Threshold (%)')).toBeInTheDocument();
    expect(screen.getByLabelText('Action When Quota Exceeded')).toBeInTheDocument();
  });

  it('should show set quota button when no current quota', () => {
    render(
      <QuotaSettingsForm
        routerID={mockRouterID}
        instanceID={mockInstanceID}
      />
    );

    expect(screen.getByRole('button', { name: /set quota/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove quota/i })).not.toBeInTheDocument();
  });

  it('should show update and remove buttons when current quota exists', () => {
    const currentQuota = {
      id: 'quota-1',
      instanceID: 'instance-456',
      limitBytes: 100000000,
      consumedBytes: 50000000,
      remainingBytes: 50000000,
      period: 'MONTHLY' as const,
      warningThreshold: 80,
      action: 'ALERT' as const,
      createdAt: new Date('2024-01-15T00:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-20T10:30:00Z').toISOString(),
      periodStartedAt: new Date('2024-02-01T00:00:00Z').toISOString(),
      periodEndsAt: new Date('2024-02-29T23:59:59Z').toISOString(),
      limitReached: false,
      usagePercent: 50,
      warningTriggered: false,
    } as const;

    render(
      <QuotaSettingsForm
        routerID={mockRouterID}
        instanceID={mockInstanceID}
        currentQuota={currentQuota}
      />
    );

    expect(screen.getByRole('button', { name: /update quota/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove quota/i })).toBeInTheDocument();
  });

  it('should validate required fields on submit', async () => {
    const user = userEvent.setup();
    render(
      <QuotaSettingsForm
        routerID={mockRouterID}
        instanceID={mockInstanceID}
      />
    );

    // Clear limit field to make it invalid
    const limitInput = screen.getByLabelText('Quota Limit (GB)') as HTMLInputElement;
    await user.clear(limitInput);

    const submitButton = screen.getByRole('button', { name: /set quota/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must be greater than 0/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const mockSetQuota = vi.fn().mockResolvedValue({
      data: {
        setTrafficQuota: {
          quota: { limitBytes: 100000000 },
          errors: [],
        },
      },
    });

    vi.mocked(apiClient.useSetTrafficQuota).mockReturnValue([
      mockSetQuota,
      { loading: false, called: false, client: {} as any, reset: vi.fn() },
    ]);

    render(
      <QuotaSettingsForm
        routerID={mockRouterID}
        instanceID={mockInstanceID}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByRole('button', { name: /set quota/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSetQuota).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(screen.getByText(/updated successfully/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();
    const mockSetQuota = vi.fn().mockResolvedValue({
      data: {
        setTrafficQuota: {
          quota: null,
          errors: [{ message: 'Quota limit exceeds maximum' }],
        },
      },
    });

    vi.mocked(apiClient.useSetTrafficQuota).mockReturnValue([
      mockSetQuota,
      { loading: false, called: false, client: {} as any, reset: vi.fn() },
    ]);

    render(
      <QuotaSettingsForm
        routerID={mockRouterID}
        instanceID={mockInstanceID}
        onError={mockOnError}
      />
    );

    const submitButton = screen.getByRole('button', { name: /set quota/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
      expect(screen.getByText(/exceeds maximum/i)).toBeInTheDocument();
    });
  });

  it('should remove quota on button click', async () => {
    const user = userEvent.setup();
    const mockResetQuota = vi.fn().mockResolvedValue({
      data: {
        resetTrafficQuota: {
          errors: [],
        },
      },
    });

    vi.mocked(apiClient.useResetTrafficQuota).mockReturnValue([
      mockResetQuota,
      { loading: false, called: false, client: {} as any, reset: vi.fn() },
    ]);

    const currentQuota = {
      id: 'quota-2',
      instanceID: 'instance-456',
      limitBytes: 100000000,
      consumedBytes: 75000000,
      remainingBytes: 25000000,
      period: 'MONTHLY' as const,
      warningThreshold: 80,
      action: 'ALERT' as const,
      createdAt: new Date('2024-01-10T00:00:00Z').toISOString(),
      updatedAt: new Date('2024-02-20T15:45:00Z').toISOString(),
      periodStartedAt: new Date('2024-02-01T00:00:00Z').toISOString(),
      periodEndsAt: new Date('2024-02-29T23:59:59Z').toISOString(),
      limitReached: false,
      usagePercent: 75,
      warningTriggered: true,
    } as const;

    render(
      <QuotaSettingsForm
        routerID={mockRouterID}
        instanceID={mockInstanceID}
        currentQuota={currentQuota}
        onSuccess={mockOnSuccess}
      />
    );

    const removeButton = screen.getByRole('button', { name: /remove quota/i });
    await user.click(removeButton);

    await waitFor(() => {
      expect(mockResetQuota).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(screen.getByText(/removed successfully/i)).toBeInTheDocument();
    });
  });

  it('should disable buttons during submission', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.useSetTrafficQuota).mockReturnValue([
      vi.fn(),
      { loading: true, called: false, client: {} as any, reset: vi.fn() }, // Simulate loading state
    ]);

    render(
      <QuotaSettingsForm
        routerID={mockRouterID}
        instanceID={mockInstanceID}
      />
    );

    const submitButton = screen.getByRole('button', { name: /set quota/i });
    expect(submitButton).toBeDisabled();
  });

  it('should have proper ARIA labels for accessibility', () => {
    render(
      <QuotaSettingsForm
        routerID={mockRouterID}
        instanceID={mockInstanceID}
      />
    );

    expect(screen.getByLabelText('Quota Period')).toHaveAttribute('id', 'period');
    expect(screen.getByLabelText('Quota Limit (GB)')).toHaveAttribute('id', 'limitGB');
    expect(screen.getByLabelText('Warning Threshold (%)')).toHaveAttribute(
      'id',
      'warningThreshold'
    );
    expect(screen.getByLabelText('Action When Quota Exceeded')).toHaveAttribute('id', 'action');
  });
});
