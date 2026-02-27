import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { InterfaceEditForm } from './InterfaceEditForm';
import { UPDATE_INTERFACE } from '@nasnet/api-client/queries';

// Mock toast hook
vi.mock('@nasnet/ui/primitives', async () => {
  const actual = await vi.importActual('@nasnet/ui/primitives');
  return {
    ...actual,
    useToast: () => ({
      toast: vi.fn(),
    }),
  };
});

describe('InterfaceEditForm', () => {
  const mockInterface = {
    id: '*1',
    name: 'ether1',
    type: 'ETHERNET',
    status: 'UP',
    enabled: true,
    running: true,
    mtu: 1500,
    comment: 'WAN Link',
  };

  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  const mocks = [
    {
      request: {
        query: UPDATE_INTERFACE,
        variables: {
          routerId: 'router-1',
          interfaceId: '*1',
          input: {
            enabled: false,
            mtu: 1400,
            comment: 'Updated comment',
          },
        },
      },
      result: {
        data: {
          updateInterface: {
            interface: {
              id: '*1',
              name: 'ether1',
              enabled: false,
              mtu: 1400,
              comment: 'Updated comment',
              __typename: 'Interface',
            },
            errors: [],
            __typename: 'UpdateInterfacePayload',
          },
        },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with default values', () => {
    render(
      <MockedProvider
        mocks={mocks}
        addTypename={true}
      >
        <InterfaceEditForm
          routerId="router-1"
          interface={mockInterface}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </MockedProvider>
    );

    // Check enabled switch
    const enabledSwitch = screen.getByRole('switch', { name: /enabled/i });
    expect(enabledSwitch).toBeChecked();

    // Check MTU input
    const mtuInput = screen.getByLabelText(/mtu/i);
    expect(mtuInput).toHaveValue(1500);

    // Check comment textarea
    const commentTextarea = screen.getByLabelText(/comment/i);
    expect(commentTextarea).toHaveValue('WAN Link');
  });

  it('updates form fields', () => {
    render(
      <MockedProvider
        mocks={mocks}
        addTypename={true}
      >
        <InterfaceEditForm
          routerId="router-1"
          interface={mockInterface}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </MockedProvider>
    );

    // Toggle enabled switch
    const enabledSwitch = screen.getByRole('switch', { name: /enabled/i });
    fireEvent.click(enabledSwitch);
    expect(enabledSwitch).not.toBeChecked();

    // Update MTU
    const mtuInput = screen.getByLabelText(/mtu/i);
    fireEvent.change(mtuInput, { target: { value: '1400' } });
    expect(mtuInput).toHaveValue(1400);

    // Update comment
    const commentTextarea = screen.getByLabelText(/comment/i);
    fireEvent.change(commentTextarea, { target: { value: 'Updated comment' } });
    expect(commentTextarea).toHaveValue('Updated comment');
  });

  it('validates MTU minimum value', async () => {
    render(
      <MockedProvider
        mocks={mocks}
        addTypename={true}
      >
        <InterfaceEditForm
          routerId="router-1"
          interface={mockInterface}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </MockedProvider>
    );

    const mtuInput = screen.getByLabelText(/mtu/i);
    fireEvent.change(mtuInput, { target: { value: '50' } });

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must be at least 68/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('validates MTU maximum value', async () => {
    render(
      <MockedProvider
        mocks={mocks}
        addTypename={true}
      >
        <InterfaceEditForm
          routerId="router-1"
          interface={mockInterface}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </MockedProvider>
    );

    const mtuInput = screen.getByLabelText(/mtu/i);
    fireEvent.change(mtuInput, { target: { value: '10000' } });

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must be at most 9000/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('validates comment maximum length', async () => {
    render(
      <MockedProvider
        mocks={mocks}
        addTypename={true}
      >
        <InterfaceEditForm
          routerId="router-1"
          interface={mockInterface}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </MockedProvider>
    );

    const commentTextarea = screen.getByLabelText(/comment/i);
    const longComment = 'a'.repeat(256);
    fireEvent.change(commentTextarea, { target: { value: longComment } });

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must be at most 255 characters/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(
      <MockedProvider
        mocks={mocks}
        addTypename={true}
      >
        <InterfaceEditForm
          routerId="router-1"
          interface={mockInterface}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </MockedProvider>
    );

    // Update fields
    const enabledSwitch = screen.getByRole('switch', { name: /enabled/i });
    fireEvent.click(enabledSwitch);

    const mtuInput = screen.getByLabelText(/mtu/i);
    fireEvent.change(mtuInput, { target: { value: '1400' } });

    const commentTextarea = screen.getByLabelText(/comment/i);
    fireEvent.change(commentTextarea, { target: { value: 'Updated comment' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <MockedProvider
        mocks={mocks}
        addTypename={true}
      >
        <InterfaceEditForm
          routerId="router-1"
          interface={mockInterface}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </MockedProvider>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('shows loading state during submission', async () => {
    const delayedMocks = [
      {
        ...mocks[0],
        delay: 100,
      },
    ];

    render(
      <MockedProvider
        mocks={delayedMocks}
        addTypename={true}
      >
        <InterfaceEditForm
          routerId="router-1"
          interface={mockInterface}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </MockedProvider>
    );

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
    });
  });

  it('handles submission errors', async () => {
    const errorMocks = [
      {
        request: {
          query: UPDATE_INTERFACE,
          variables: {
            routerId: 'router-1',
            interfaceId: '*1',
            input: {
              enabled: true,
              mtu: 1500,
              comment: 'WAN Link',
            },
          },
        },
        error: new Error('Failed to update interface'),
      },
    ];

    render(
      <MockedProvider
        mocks={errorMocks}
        addTypename={true}
      >
        <InterfaceEditForm
          routerId="router-1"
          interface={mockInterface}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </MockedProvider>
    );

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to update/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('handles server-side validation errors', async () => {
    const serverErrorMocks = [
      {
        request: {
          query: UPDATE_INTERFACE,
          variables: {
            routerId: 'router-1',
            interfaceId: '*1',
            input: {
              enabled: true,
              mtu: 1500,
              comment: 'WAN Link',
            },
          },
        },
        result: {
          data: {
            updateInterface: {
              interface: null,
              errors: [
                {
                  code: 'INVALID_MTU',
                  message: 'MTU value not supported by this interface type',
                  field: 'mtu',
                  __typename: 'MutationError',
                },
              ],
              __typename: 'UpdateInterfacePayload',
            },
          },
        },
      },
    ];

    render(
      <MockedProvider
        mocks={serverErrorMocks}
        addTypename={true}
      >
        <InterfaceEditForm
          routerId="router-1"
          interface={mockInterface}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </MockedProvider>
    );

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/mtu value not supported/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('disables submit button when form is invalid', async () => {
    render(
      <MockedProvider
        mocks={mocks}
        addTypename={true}
      >
        <InterfaceEditForm
          routerId="router-1"
          interface={mockInterface}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </MockedProvider>
    );

    // Set invalid MTU
    const mtuInput = screen.getByLabelText(/mtu/i);
    fireEvent.change(mtuInput, { target: { value: '50' } });

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('handles empty MTU value', async () => {
    render(
      <MockedProvider
        mocks={mocks}
        addTypename={true}
      >
        <InterfaceEditForm
          routerId="router-1"
          interface={mockInterface}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      </MockedProvider>
    );

    const mtuInput = screen.getByLabelText(/mtu/i);
    fireEvent.change(mtuInput, { target: { value: '' } });

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    // Empty MTU should be valid (will use default)
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
