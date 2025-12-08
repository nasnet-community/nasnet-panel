/**
 * StatusBadge Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('should render "Running" for running status', () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('should render "Disabled" for disabled status', () => {
    render(<StatusBadge status="disabled" />);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('should apply green styles for running status', () => {
    const { container } = render(<StatusBadge status="running" />);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-green-100');
  });

  it('should apply gray styles for disabled status', () => {
    const { container } = render(<StatusBadge status="disabled" />);
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-gray-100');
  });
});
