/**
 * Button Component Tests - Comprehensive Coverage
 *
 * Tests: functionality, variants, sizes, loading states, accessibility
 *
 * @see NAS-4.16: Implement Loading States & Skeleton UI
 * @see WCAG AAA: 44px touch targets, keyboard navigation, focus indicators
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Mail } from 'lucide-react';

import { Button } from './button';

// Mock useReducedMotion hook (used by Spinner)
vi.mock('../hooks', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('renders children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('handles click events', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('renders with custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Test</Button>);
      expect(ref).toHaveBeenCalled();
    });

    it('sets displayName for debugging', () => {
      expect(Button.displayName).toBe('Button');
    });
  });

  describe('loading state', () => {
    it('shows spinner when isLoading is true', () => {
      render(<Button isLoading>Save</Button>);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('is disabled when loading', () => {
      render(<Button isLoading>Save</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('has aria-busy when loading', () => {
      render(<Button isLoading>Save</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('shows loadingText when provided', () => {
      render(<Button isLoading loadingText="Saving...">Save</Button>);
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('shows original text when loadingText is not provided', () => {
      render(<Button isLoading>Save</Button>);
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('prevents click events when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button isLoading onClick={handleClick}>Save</Button>);
      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('combines disabled and loading states', () => {
      render(<Button isLoading disabled>Save</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('shows different spinner sizes based on button size', () => {
      const { rerender } = render(<Button isLoading size="sm">Small</Button>);
      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<Button isLoading size="lg">Large</Button>);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies default variant', () => {
      render(<Button variant="default">Default</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-primary');
    });

    it('applies action variant', () => {
      render(<Button variant="action">Action</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-primary');
    });

    it('applies secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-secondary');
    });

    it('applies destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-error');
    });

    it('applies outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole('button')).toHaveClass('border-2');
    });

    it('applies ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-transparent');
    });

    it('applies link variant', () => {
      render(<Button variant="link">Link</Button>);
      expect(screen.getByRole('button')).toHaveClass('text-primary');
    });
  });

  describe('sizes', () => {
    it('applies default size (h-11)', () => {
      render(<Button size="default">Default</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-11');
    });

    it('applies small size (h-9)', () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-9');
    });

    it('applies large size (h-12)', () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-12');
    });

    it('applies icon size (h-11 w-11)', () => {
      render(<Button size="icon">Icon</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11');
      expect(button).toHaveClass('w-11');
    });
  });

  describe('icons', () => {
    it('renders with icon and text', () => {
      render(
        <Button>
          <Mail className="h-4 w-4" />
          Send Email
        </Button>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Send Email')).toBeInTheDocument();
    });

    it('applies gap between icon and text', () => {
      render(
        <Button>
          <Mail className="h-4 w-4" />
          Send
        </Button>
      );
      expect(screen.getByRole('button')).toHaveClass('gap-2');
    });
  });

  describe('asChild rendering', () => {
    it('renders as link element when asChild is true', () => {
      render(
        <Button asChild>
          <a href="https://example.com">Link Button</a>
        </Button>
      );
      const link = screen.getByRole('link', { name: 'Link Button' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('applies button classes to asChild element', () => {
      render(
        <Button asChild variant="secondary">
          <a href="https://example.com">Link</a>
        </Button>
      );
      expect(screen.getByRole('link')).toHaveClass('bg-secondary');
    });
  });

  describe('accessibility', () => {
    it('has focus-visible ring on keyboard focus', () => {
      render(<Button>Focus Test</Button>);
      expect(screen.getByRole('button')).toHaveClass('focus-visible:ring-2');
    });

    it('has aria-disabled set when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('has aria-disabled false when not disabled', () => {
      render(<Button>Enabled</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'false');
    });

    it('has aria-busy true when loading', () => {
      render(<Button isLoading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-busy false when not loading', () => {
      render(<Button>Not Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'false');
    });

    it('supports keyboard activation with Space', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Keyboard Test</Button>);
      const button = screen.getByRole('button');

      // Focus and press Space
      button.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalled();
    });

    it('supports keyboard activation with Enter', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Keyboard Test</Button>);
      const button = screen.getByRole('button');

      // Focus and press Enter
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalled();
    });

    it('is keyboard navigable in tab order', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>First</Button>
          <Button>Second</Button>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      expect(document.activeElement).toBe(buttons[0]);

      await user.tab();
      expect(document.activeElement).toBe(buttons[1]);
    });

    it('prevents pointer events when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveClass('disabled:pointer-events-none');
    });
  });

  describe('edge cases', () => {
    it('handles empty children gracefully', () => {
      render(<Button />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles very long text', () => {
      const longText = 'A'.repeat(100);
      render(<Button>{longText}</Button>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles loading with empty loadingText', () => {
      render(<Button isLoading>Save</Button>);
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('disables when both disabled and isLoading are true', () => {
      render(<Button disabled isLoading>Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('styling', () => {
    it('applies transition classes', () => {
      render(<Button>Transition</Button>);
      expect(screen.getByRole('button')).toHaveClass('transition-all', 'duration-200');
    });

    it('applies base focus styles', () => {
      render(<Button>Focus Styles</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-offset-2');
    });

    it('applies whitespace-nowrap for text wrapping control', () => {
      render(<Button>No Wrap</Button>);
      expect(screen.getByRole('button')).toHaveClass('whitespace-nowrap');
    });
  });
});
