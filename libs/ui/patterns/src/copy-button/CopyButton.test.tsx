/**
 * Tests for CopyButton component
 * @see NAS-4.23 - Implement Clipboard Integration
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CopyButton } from './CopyButton';

// Mock the hooks
vi.mock('../hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('CopyButton', () => {
  const mockWriteText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: mockWriteText },
    });
    mockWriteText.mockResolvedValue(undefined);
  });

  describe('inline variant', () => {
    it('renders inline variant with icon only', () => {
      render(
        <CopyButton
          value="test"
          variant="inline"
          showTooltip={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8', 'w-8');
    });

    it('copies value when clicked', async () => {
      const user = userEvent.setup();
      render(
        <CopyButton
          value="192.168.1.1"
          variant="inline"
          showTooltip={false}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(mockWriteText).toHaveBeenCalledWith('192.168.1.1');
    });

    it('shows checkmark icon after successful copy', async () => {
      const user = userEvent.setup();
      render(
        <CopyButton
          value="test"
          variant="inline"
          showTooltip={false}
        />
      );

      await user.click(screen.getByRole('button'));

      // Check for aria-label indicating copied state
      await waitFor(() => {
        expect(screen.getByLabelText('Copied')).toBeInTheDocument();
      });
    });

    it('supports custom aria-label', () => {
      render(
        <CopyButton
          value="test"
          variant="inline"
          aria-label="Copy serial number"
          showTooltip={false}
        />
      );

      expect(screen.getByLabelText('Copy serial number')).toBeInTheDocument();
    });
  });

  describe('button variant', () => {
    it('renders button variant with text', () => {
      render(
        <CopyButton
          value="test"
          variant="button"
          showTooltip={false}
        />
      );

      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    it('shows "Copied" text after successful copy', async () => {
      const user = userEvent.setup();
      render(
        <CopyButton
          value="test"
          variant="button"
          showTooltip={false}
        />
      );

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Copied')).toBeInTheDocument();
      });
    });

    it('copies value when clicked', async () => {
      const user = userEvent.setup();
      render(
        <CopyButton
          value="public-key-123"
          variant="button"
          showTooltip={false}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(mockWriteText).toHaveBeenCalledWith('public-key-123');
    });
  });

  describe('keyboard accessibility', () => {
    it('supports keyboard activation with Enter', async () => {
      const user = userEvent.setup();
      render(
        <CopyButton
          value="test"
          variant="inline"
          showTooltip={false}
        />
      );

      await user.tab();
      await user.keyboard('{Enter}');

      expect(mockWriteText).toHaveBeenCalledWith('test');
    });

    it('supports keyboard activation with Space', async () => {
      const user = userEvent.setup();
      render(
        <CopyButton
          value="test"
          variant="inline"
          showTooltip={false}
        />
      );

      await user.tab();
      await user.keyboard(' ');

      expect(mockWriteText).toHaveBeenCalledWith('test');
    });

    it('is focusable via Tab', async () => {
      const user = userEvent.setup();
      render(
        <CopyButton
          value="test"
          variant="inline"
          showTooltip={false}
        />
      );

      await user.tab();

      expect(screen.getByRole('button')).toHaveFocus();
    });
  });

  describe('callback props', () => {
    it('calls onCopy callback on successful copy', async () => {
      const onCopy = vi.fn();
      const user = userEvent.setup();

      render(
        <CopyButton
          value="test-value"
          onCopy={onCopy}
          showTooltip={false}
        />
      );

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalledWith('test-value');
      });
    });

    it('calls onError callback on copy failure', async () => {
      const error = new Error('Copy failed');
      mockWriteText.mockRejectedValue(error);

      const onError = vi.fn();
      const user = userEvent.setup();

      render(
        <CopyButton
          value="test"
          onError={onError}
          showTooltip={false}
        />
      );

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('disabled state', () => {
    it('does not copy when disabled', async () => {
      const user = userEvent.setup();
      render(
        <CopyButton
          value="test"
          disabled
          showTooltip={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('click propagation', () => {
    it('stops click propagation to parent elements', async () => {
      const parentClick = vi.fn();
      const user = userEvent.setup();

      render(
        <div onClick={parentClick}>
          <CopyButton
            value="test"
            showTooltip={false}
          />
        </div>
      );

      await user.click(screen.getByRole('button'));

      expect(parentClick).not.toHaveBeenCalled();
    });
  });

  describe('tooltip behavior', () => {
    it('renders without tooltip when showTooltip is false', () => {
      render(
        <CopyButton
          value="test"
          showTooltip={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // Tooltip wrapper should not be present
      expect(button.closest('[data-radix-tooltip-trigger]')).toBeNull();
    });
  });

  describe('custom className', () => {
    it('applies custom className to button', () => {
      render(
        <CopyButton
          value="test"
          className="custom-class"
          showTooltip={false}
        />
      );

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });
});
