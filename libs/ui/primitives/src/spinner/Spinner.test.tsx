/**
 * Spinner Component Tests
 *
 * @see NAS-4.16: Implement Loading States & Skeleton UI
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { Spinner } from './Spinner';

// Mock useReducedMotion hook
vi.mock('../hooks', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('Spinner', () => {
  it('renders with default size', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');

    expect(spinner).toBeInTheDocument();
  });

  it('has role="status" for accessibility', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');

    expect(spinner).toBeInTheDocument();
  });

  it('includes screen reader text', () => {
    render(<Spinner label="Loading data..." />);

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByText('Loading data...')).toHaveClass('sr-only');
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<Spinner size="sm" />);
    let svg = document.querySelector('svg');
    expect(svg).toHaveClass('h-4', 'w-4');

    rerender(<Spinner size="lg" />);
    svg = document.querySelector('svg');
    expect(svg).toHaveClass('h-6', 'w-6');
  });

  it('animates when reduced motion is not preferred', () => {
    render(<Spinner />);
    const svg = document.querySelector('svg');

    expect(svg).toHaveClass('animate-spin');
  });

  it('applies custom className', () => {
    render(<Spinner className="text-primary" />);
    const svg = document.querySelector('svg');

    expect(svg).toHaveClass('text-primary');
  });
});
