/**
 * RawRuleEditor Component Tests
 *
 * Tests for RAW rule editor pattern component using React Testing Library.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RawRuleEditor } from './RawRuleEditor';
import type { RawRule } from '@nasnet/core/types';

// Mock platform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: () => 'desktop',
}));

describe('RawRuleEditor', () => {
  const defaultProps = {
    routerId: 'router-1',
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  it('renders in create mode', () => {
    render(<RawRuleEditor {...defaultProps} />);

    expect(screen.getByText('Create RAW Rule')).toBeInTheDocument();
    expect(screen.getByText(/Configure RAW rules/i)).toBeInTheDocument();
  });

  it('renders in edit mode with initial rule', () => {
    const initialRule: Partial<RawRule> = {
      id: 'rule-1',
      chain: 'prerouting',
      action: 'drop',
      comment: 'Test rule',
    };

    render(
      <RawRuleEditor
        {...defaultProps}
        initialRule={initialRule}
        mode="edit"
      />
    );

    expect(screen.getByText('Edit RAW Rule')).toBeInTheDocument();
  });

  it('displays performance tip for notrack action', async () => {
    const user = userEvent.setup();

    render(<RawRuleEditor {...defaultProps} />);

    // Change action to notrack (it's already default but let's be explicit)
    const actionSelect = screen.getByRole('combobox', { name: /action/i });
    await user.click(actionSelect);

    // Performance tip should be visible
    await waitFor(() => {
      expect(screen.getByText(/Performance Optimization/i)).toBeInTheDocument();
      expect(screen.getByText(/Notrack skips connection tracking/i)).toBeInTheDocument();
    });
  });

  it('shows logPrefix field for log action', async () => {
    const user = userEvent.setup();

    render(<RawRuleEditor {...defaultProps} />);

    // Change action to log
    const actionSelect = screen.getByRole('combobox', { name: /action/i });
    await user.click(actionSelect);
    await user.click(screen.getByRole('option', { name: /log/i }));

    // Log prefix field should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Log Prefix/i)).toBeInTheDocument();
    });
  });

  it('shows jumpTarget field for jump action', async () => {
    const user = userEvent.setup();

    render(<RawRuleEditor {...defaultProps} />);

    // Change action to jump
    const actionSelect = screen.getByRole('combobox', { name: /action/i });
    await user.click(actionSelect);
    await user.click(screen.getByRole('option', { name: /jump/i }));

    // Jump target field should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Jump Target/i)).toBeInTheDocument();
    });
  });

  it('calls onSave with form data', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<RawRuleEditor {...defaultProps} onSave={onSave} />);

    // Fill in form
    const commentInput = screen.getByPlaceholderText(/Description/i);
    await user.type(commentInput, 'Test comment');

    // Submit
    const saveButton = screen.getByRole('button', { name: /Create Rule/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: 'prerouting',
          action: 'notrack',
          comment: 'Test comment',
        })
      );
    });
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<RawRuleEditor {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    const initialRule: Partial<RawRule> = {
      id: 'rule-1',
      chain: 'prerouting',
      action: 'drop',
    };

    render(
      <RawRuleEditor
        {...defaultProps}
        initialRule={initialRule}
        mode="edit"
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalled();
  });

  it('disables submit button when form is invalid', async () => {
    const user = userEvent.setup();

    render(<RawRuleEditor {...defaultProps} />);

    // Clear required chain field
    const chainSelect = screen.getByRole('combobox', { name: /chain/i });
    await user.click(chainSelect);
    await user.clear(chainSelect);

    // Save button should be disabled
    const saveButton = screen.getByRole('button', { name: /Create Rule/i });
    expect(saveButton).toBeDisabled();
  });

  it('shows loading state when isSaving is true', () => {
    render(<RawRuleEditor {...defaultProps} isSaving={true} />);

    expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
  });

  it('disables all actions when isDeleting is true', () => {
    const initialRule: Partial<RawRule> = {
      id: 'rule-1',
      chain: 'prerouting',
      action: 'drop',
    };

    render(
      <RawRuleEditor
        {...defaultProps}
        initialRule={initialRule}
        mode="edit"
        isDeleting={true}
        onDelete={vi.fn()}
      />
    );

    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    const deleteButton = screen.getByRole('button', { name: /Delete/i });

    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });
});
