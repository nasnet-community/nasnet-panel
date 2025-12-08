/**
 * NewEntriesIndicator Component Tests
 * Tests for the new entries floating indicator
 * Epic 0.8: System Logs - Story 0.8.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewEntriesIndicator } from './NewEntriesIndicator';

describe('NewEntriesIndicator', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render and Display', () => {
    it('should render when count is greater than 0', () => {
      render(<NewEntriesIndicator count={5} onClick={mockOnClick} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should not render when count is 0', () => {
      render(<NewEntriesIndicator count={0} onClick={mockOnClick} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not render when count is negative', () => {
      render(<NewEntriesIndicator count={-1} onClick={mockOnClick} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should display singular text for count of 1', () => {
      render(<NewEntriesIndicator count={1} onClick={mockOnClick} />);
      expect(screen.getByText('1 new entry')).toBeInTheDocument();
    });

    it('should display plural text for count greater than 1', () => {
      render(<NewEntriesIndicator count={5} onClick={mockOnClick} />);
      expect(screen.getByText('5 new entries')).toBeInTheDocument();
    });

    it('should display large counts correctly', () => {
      render(<NewEntriesIndicator count={999} onClick={mockOnClick} />);
      expect(screen.getByText('999 new entries')).toBeInTheDocument();
    });
  });

  describe('Click Behavior', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      render(<NewEntriesIndicator count={3} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks', async () => {
      const user = userEvent.setup();
      render(<NewEntriesIndicator count={3} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Styling and Positioning', () => {
    it('should have fixed positioning', () => {
      render(<NewEntriesIndicator count={5} onClick={mockOnClick} />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('fixed');
    });

    it('should be positioned at bottom center', () => {
      render(<NewEntriesIndicator count={5} onClick={mockOnClick} />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bottom-20');
      expect(button.className).toContain('left-1/2');
      expect(button.className).toContain('-translate-x-1/2');
    });

    it('should have high z-index for floating above content', () => {
      render(<NewEntriesIndicator count={5} onClick={mockOnClick} />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('z-50');
    });

    it('should have shadow for visibility', () => {
      render(<NewEntriesIndicator count={5} onClick={mockOnClick} />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('shadow-lg');
    });

    it('should have animation classes', () => {
      render(<NewEntriesIndicator count={5} onClick={mockOnClick} />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('animate-in');
    });

    it('should apply custom className', () => {
      render(
        <NewEntriesIndicator
          count={5}
          onClick={mockOnClick}
          className="custom-class"
        />
      );
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });
  });

  describe('Icon Display', () => {
    it('should render chevron down icon', () => {
      const { container } = render(<NewEntriesIndicator count={5} onClick={mockOnClick} />);
      // ChevronDown from lucide-react renders as SVG
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      render(<NewEntriesIndicator count={5} onClick={mockOnClick} />);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should be focusable', () => {
      render(<NewEntriesIndicator count={5} onClick={mockOnClick} />);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should be triggerable with Enter key', async () => {
      const user = userEvent.setup();
      render(<NewEntriesIndicator count={5} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(mockOnClick).toHaveBeenCalled();
    });

    it('should be triggerable with Space key', async () => {
      const user = userEvent.setup();
      render(<NewEntriesIndicator count={5} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(mockOnClick).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large counts', () => {
      render(<NewEntriesIndicator count={99999} onClick={mockOnClick} />);
      expect(screen.getByText('99999 new entries')).toBeInTheDocument();
    });

    it('should pass through additional HTML attributes', () => {
      render(
        <NewEntriesIndicator
          count={5}
          onClick={mockOnClick}
          data-testid="custom-indicator"
          aria-label="Scroll to new entries"
        />
      );

      const button = screen.getByTestId('custom-indicator');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Scroll to new entries');
    });
  });

  describe('Count Updates', () => {
    it('should update display when count changes', () => {
      const { rerender } = render(<NewEntriesIndicator count={5} onClick={mockOnClick} />);
      expect(screen.getByText('5 new entries')).toBeInTheDocument();

      rerender(<NewEntriesIndicator count={10} onClick={mockOnClick} />);
      expect(screen.getByText('10 new entries')).toBeInTheDocument();
    });

    it('should disappear when count becomes 0', () => {
      const { rerender } = render(<NewEntriesIndicator count={5} onClick={mockOnClick} />);
      expect(screen.getByRole('button')).toBeInTheDocument();

      rerender(<NewEntriesIndicator count={0} onClick={mockOnClick} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should appear when count becomes positive from 0', () => {
      const { rerender } = render(<NewEntriesIndicator count={0} onClick={mockOnClick} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();

      rerender(<NewEntriesIndicator count={3} onClick={mockOnClick} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('3 new entries')).toBeInTheDocument();
    });
  });
});
