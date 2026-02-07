import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BatchConfirmDialog } from './BatchConfirmDialog';
import { BatchInterfaceAction } from '@nasnet/api-client/generated';

describe('BatchConfirmDialog', () => {
  const mockInterfaces = [
    {
      id: '*1',
      name: 'ether1',
      type: 'ETHERNET',
      usedBy: ['gateway'],
    },
    {
      id: '*2',
      name: 'ether2',
      type: 'ETHERNET',
      usedBy: [],
    },
  ];

  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders dialog with interface list', () => {
    render(
      <BatchConfirmDialog
        open={true}
        action={BatchInterfaceAction.Enable}
        interfaces={mockInterfaces}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/enable 2 interface/i)).toBeInTheDocument();
    expect(screen.getByText('ether1')).toBeInTheDocument();
    expect(screen.getByText('ether2')).toBeInTheDocument();
  });

  it('shows gateway warning for disable action on gateway interface', () => {
    render(
      <BatchConfirmDialog
        open={true}
        action={BatchInterfaceAction.Disable}
        interfaces={mockInterfaces}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/warning: critical operation/i)).toBeInTheDocument();
    expect(screen.getByText(/gateway/i)).toBeInTheDocument();
  });

  it('does not show warning for enable action', () => {
    render(
      <BatchConfirmDialog
        open={true}
        action={BatchInterfaceAction.Enable}
        interfaces={mockInterfaces}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText(/warning: critical operation/i)).not.toBeInTheDocument();
  });

  it('does not show warning when no gateway interfaces', () => {
    const nonGatewayInterfaces = [
      {
        id: '*2',
        name: 'ether2',
        type: 'ETHERNET',
        usedBy: [],
      },
    ];

    render(
      <BatchConfirmDialog
        open={true}
        action={BatchInterfaceAction.Disable}
        interfaces={nonGatewayInterfaces}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText(/warning: critical operation/i)).not.toBeInTheDocument();
  });

  it('has countdown for critical operations', async () => {
    render(
      <BatchConfirmDialog
        open={true}
        action={BatchInterfaceAction.Disable}
        interfaces={mockInterfaces}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Confirm button should be disabled and show countdown
    const confirmButton = screen.getByRole('button', { name: /confirm \(3\)/i });
    expect(confirmButton).toBeDisabled();

    // Advance timer by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm \(2\)/i })).toBeInTheDocument();
    });

    // Advance timer by 2 more seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      const confirmBtn = screen.getByRole('button', { name: /confirm disable/i });
      expect(confirmBtn).not.toBeDisabled();
    });
  });

  it('allows immediate confirm for non-critical operations', () => {
    render(
      <BatchConfirmDialog
        open={true}
        action={BatchInterfaceAction.Enable}
        interfaces={mockInterfaces}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm enable/i });
    expect(confirmButton).not.toBeDisabled();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    render(
      <BatchConfirmDialog
        open={true}
        action={BatchInterfaceAction.Enable}
        interfaces={mockInterfaces}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm enable/i });
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <BatchConfirmDialog
        open={true}
        action={BatchInterfaceAction.Enable}
        interfaces={mockInterfaces}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('highlights gateway interfaces', () => {
    render(
      <BatchConfirmDialog
        open={true}
        action={BatchInterfaceAction.Disable}
        interfaces={mockInterfaces}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // ether1 should have gateway badge
    const ether1Row = screen.getByText('ether1').closest('div');
    expect(ether1Row?.querySelector('[class*="destructive"]')).toBeInTheDocument();

    // ether2 should not have gateway badge
    const ether2Row = screen.getByText('ether2').closest('div');
    expect(ether2Row?.querySelector('[class*="destructive"]')).not.toBeInTheDocument();
  });

  it('displays correct action label', () => {
    const { rerender } = render(
      <BatchConfirmDialog
        open={true}
        action={BatchInterfaceAction.Enable}
        interfaces={mockInterfaces}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/enable 2 interface/i)).toBeInTheDocument();

    rerender(
      <BatchConfirmDialog
        open={true}
        action={BatchInterfaceAction.Disable}
        interfaces={mockInterfaces}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/disable 2 interface/i)).toBeInTheDocument();
  });

  it('shows plural form for multiple interfaces', () => {
    render(
      <BatchConfirmDialog
        open={true}
        action={BatchInterfaceAction.Enable}
        interfaces={mockInterfaces}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/enable 2 interfaces/i)).toBeInTheDocument();
  });

  it('shows singular form for single interface', () => {
    const singleInterface = [mockInterfaces[0]];

    render(
      <BatchConfirmDialog
        open={true}
        action={BatchInterfaceAction.Enable}
        interfaces={singleInterface}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/enable 1 interface\?/i)).toBeInTheDocument();
  });

  it('resets countdown when dialog reopens', async () => {
    const { rerender } = render(
      <BatchConfirmDialog
        open={true}
        action={BatchInterfaceAction.Disable}
        interfaces={mockInterfaces}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Advance timer by 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm \(1\)/i })).toBeInTheDocument();
    });

    // Close dialog
    rerender(
      <BatchConfirmDialog
        open={false}
        action={BatchInterfaceAction.Disable}
        interfaces={mockInterfaces}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Reopen dialog
    rerender(
      <BatchConfirmDialog
        open={true}
        action={BatchInterfaceAction.Disable}
        interfaces={mockInterfaces}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Countdown should reset to 3
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm \(3\)/i })).toBeInTheDocument();
    });
  });
});
