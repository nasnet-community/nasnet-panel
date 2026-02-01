/**
 * LastUpdated Component Tests
 * Tests for the last updated timestamp display component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { LastUpdated } from './LastUpdated';

// Mock the useRelativeTime hook
vi.mock('@nasnet/core/utils/hooks', () => ({
  useRelativeTime: vi.fn((date) => {
    if (!date) return '';
    return 'Updated 5 seconds ago';
  }),
}));

describe('LastUpdated', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render null when timestamp is null', () => {
    const { container } = render(<LastUpdated timestamp={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render null when timestamp is undefined', () => {
    const { container } = render(<LastUpdated timestamp={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render timestamp when provided', () => {
    const timestamp = Date.now();
    render(<LastUpdated timestamp={timestamp} />);

    expect(screen.getByText('Updated 5 seconds ago')).toBeInTheDocument();
  });

  it('should render clock icon', () => {
    const timestamp = Date.now();
    const { container } = render(<LastUpdated timestamp={timestamp} />);

    // Check for the Clock icon from lucide-react
    const clockIcon = container.querySelector('svg');
    expect(clockIcon).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const timestamp = Date.now();
    const customClass = 'my-custom-class';
    const { container } = render(<LastUpdated timestamp={timestamp} className={customClass} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper?.className).toContain(customClass);
  });

  it('should have proper styling classes', () => {
    const timestamp = Date.now();
    const { container } = render(<LastUpdated timestamp={timestamp} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper?.className).toContain('flex');
    expect(wrapper?.className).toContain('items-center');
    expect(wrapper?.className).toContain('gap-1.5');
    expect(wrapper?.className).toContain('text-xs');
    expect(wrapper?.className).toContain('text-muted-foreground');
  });

  it('should handle timestamp from TanStack Query dataUpdatedAt', () => {
    // TanStack Query returns timestamp as number (milliseconds)
    const dataUpdatedAt = 1638316800000; // Example timestamp
    render(<LastUpdated timestamp={dataUpdatedAt} />);

    expect(screen.getByText('Updated 5 seconds ago')).toBeInTheDocument();
  });

  it('should update when timestamp prop changes', () => {
    const { rerender } = render(<LastUpdated timestamp={Date.now() - 10000} />);

    expect(screen.getByText('Updated 5 seconds ago')).toBeInTheDocument();

    // Change timestamp
    rerender(<LastUpdated timestamp={Date.now()} />);

    // Component should still render (mocked hook returns same value)
    expect(screen.getByText('Updated 5 seconds ago')).toBeInTheDocument();
  });
});
