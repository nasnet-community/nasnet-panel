import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkActionsToolbar } from './BulkActionsToolbar';

describe('BulkActionsToolbar', () => {
  const defaultProps = {
    selectedCount: 0,
    onMakeStatic: vi.fn(),
    onDelete: vi.fn(),
    onClear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Visibility', () => {
    it('should not render when selectedCount is 0', () => {
      const { container } = render(<BulkActionsToolbar {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when selectedCount is greater than 0', () => {
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={1}
        />
      );
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('should display correct count for multiple selections', () => {
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={5}
        />
      );
      expect(screen.getByText('5 selected')).toBeInTheDocument();
    });
  });

  describe('Make All Static button', () => {
    it('should render Make All Static button', () => {
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={1}
        />
      );
      expect(screen.getByText('Make All Static')).toBeInTheDocument();
    });

    it('should show confirmation dialog when clicked', async () => {
      const user = userEvent.setup();
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={2}
        />
      );

      const button = screen.getByText('Make All Static');
      await user.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(/are you sure you want to make 2 leases static/i)
        ).toBeInTheDocument();
      });
    });

    it('should call onMakeStatic when confirmed', async () => {
      const user = userEvent.setup();
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={3}
        />
      );

      const button = screen.getByText('Make All Static');
      await user.click(button);

      const confirmButton = await screen.findByText('Confirm');
      await user.click(confirmButton);

      expect(defaultProps.onMakeStatic).toHaveBeenCalled();
    });

    it('should not call onMakeStatic when cancelled', async () => {
      const user = userEvent.setup();
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={2}
        />
      );

      const button = screen.getByText('Make All Static');
      await user.click(button);

      const cancelButton = await screen.findByText('Cancel');
      await user.click(cancelButton);

      expect(defaultProps.onMakeStatic).not.toHaveBeenCalled();
    });

    it('should close dialog after confirmation', async () => {
      const user = userEvent.setup();
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={1}
        />
      );

      const button = screen.getByText('Make All Static');
      await user.click(button);

      const confirmButton = await screen.findByText('Confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText(/are you sure you want to make/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Selected button', () => {
    it('should render Delete Selected button', () => {
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={1}
        />
      );
      expect(screen.getByText('Delete Selected')).toBeInTheDocument();
    });

    it('should show confirmation dialog when clicked', async () => {
      const user = userEvent.setup();
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={2}
        />
      );

      const button = screen.getByText('Delete Selected');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete 2 leases/i)).toBeInTheDocument();
      });
    });

    it('should call onDelete when confirmed', async () => {
      const user = userEvent.setup();
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={4}
        />
      );

      const button = screen.getByText('Delete Selected');
      await user.click(button);

      const confirmButton = await screen.findByText('Confirm');
      await user.click(confirmButton);

      expect(defaultProps.onDelete).toHaveBeenCalled();
    });

    it('should not call onDelete when cancelled', async () => {
      const user = userEvent.setup();
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={3}
        />
      );

      const button = screen.getByText('Delete Selected');
      await user.click(button);

      const cancelButton = await screen.findByText('Cancel');
      await user.click(cancelButton);

      expect(defaultProps.onDelete).not.toHaveBeenCalled();
    });

    it('should show destructive variant for delete button', () => {
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={1}
        />
      );
      const button = screen.getByText('Delete Selected');
      expect(button).toHaveClass('variant-destructive');
    });
  });

  describe('Clear button', () => {
    it('should render Clear button', () => {
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={1}
        />
      );
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('should call onClear when clicked', async () => {
      const user = userEvent.setup();
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={3}
        />
      );

      const button = screen.getByText('Clear');
      await user.click(button);

      expect(defaultProps.onClear).toHaveBeenCalled();
    });

    it('should not show confirmation for clear action', async () => {
      const user = userEvent.setup();
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={2}
        />
      );

      const button = screen.getByText('Clear');
      await user.click(button);

      expect(defaultProps.onClear).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
    });
  });

  describe('Disabled states', () => {
    it('should disable buttons when isLoading is true', () => {
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={2}
          isLoading={true}
        />
      );

      expect(screen.getByText('Make All Static')).toBeDisabled();
      expect(screen.getByText('Delete Selected')).toBeDisabled();
    });

    it('should not disable Clear button when loading', () => {
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={2}
          isLoading={true}
        />
      );

      expect(screen.getByText('Clear')).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={3}
        />
      );

      expect(screen.getByLabelText('Bulk actions toolbar')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={1}
        />
      );

      const makeStaticButton = screen.getByText('Make All Static');
      makeStaticButton.focus();

      await user.keyboard('{Tab}');
      expect(screen.getByText('Delete Selected')).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(screen.getByText('Clear')).toHaveFocus();
    });

    it('should have role="toolbar"', () => {
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={1}
        />
      );
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should have slide-in animation when appearing', () => {
      const { rerender } = render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={0}
        />
      );

      rerender(
        <BulkActionsToolbar
          {...defaultProps}
          selectedCount={1}
        />
      );

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveClass('animate-slide-down');
    });
  });
});
