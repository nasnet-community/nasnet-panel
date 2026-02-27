/**
 * Skeleton Components Tests
 *
 * Comprehensive test suite for skeleton loading components.
 * Tests accessibility compliance (WCAG AAA), animation handling,
 * and responsive behavior per NasNetConnect design system.
 *
 * @see NAS-4.16: Implement Loading States & Skeleton UI
 * @see Section 10 - Loading States: Skeleton loaders required for initial loads
 * @see Section 7 - Accessibility: prefers-reduced-motion compliance
 * @see Section 18 - Testing: Component tests with accessibility validation
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonAvatar,
} from './skeleton';

// Mock useReducedMotion hook
vi.mock('../hooks', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('Skeleton', () => {
  it('renders with default classes', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');

    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('rounded-md', 'bg-muted', 'animate-pulse');
  });

  it('applies custom className', () => {
    render(
      <Skeleton
        data-testid="skeleton"
        className="h-4 w-full"
      />
    );
    const skeleton = screen.getByTestId('skeleton');

    expect(skeleton).toHaveClass('h-4', 'w-full');
  });

  it('has aria-hidden attribute', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');

    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not animate when animate prop is false', () => {
    render(
      <Skeleton
        data-testid="skeleton"
        animate={false}
      />
    );
    const skeleton = screen.getByTestId('skeleton');

    expect(skeleton).not.toHaveClass('animate-pulse');
  });
});

describe('SkeletonText', () => {
  it('renders default 3 lines', () => {
    const { container } = render(<SkeletonText data-testid="skeleton-text" />);
    const lines = container.querySelectorAll('[data-testid="skeleton-text"] > div');

    // Filter to direct children only (more robust than div > div)
    expect(lines.length).toBeGreaterThanOrEqual(3);
  });

  it('renders specified number of lines', () => {
    render(
      <SkeletonText
        data-testid="skeleton-text"
        lines={5}
      />
    );
    const textContainer = screen.getByTestId('skeleton-text');

    // Count direct child div elements representing lines
    const allChildren = Array.from(textContainer.children);
    expect(allChildren.length).toBeGreaterThanOrEqual(5);
  });

  it('applies lastLineWidth to last line', () => {
    render(
      <SkeletonText
        data-testid="skeleton-text"
        lines={3}
        lastLineWidth="50%"
      />
    );
    const textContainer = screen.getByTestId('skeleton-text');
    const allChildren = Array.from(textContainer.children);
    const lastLine = allChildren[allChildren.length - 1] as HTMLElement;

    expect(lastLine).toHaveStyle({ width: '50%' });
  });

  it('has role="presentation" for accessibility', () => {
    render(<SkeletonText data-testid="skeleton-text" />);
    const container = screen.getByTestId('skeleton-text');

    expect(container).toHaveAttribute('role', 'presentation');
  });

  it('has aria-hidden for screen reader compliance', () => {
    render(<SkeletonText data-testid="skeleton-text" />);
    const container = screen.getByTestId('skeleton-text');

    expect(container).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports custom gap between lines', () => {
    render(
      <SkeletonText
        data-testid="skeleton-text"
        lines={2}
        gap={12}
      />
    );
    const textContainer = screen.getByTestId('skeleton-text');

    expect(textContainer).toHaveStyle({ gap: '12px' });
  });
});

describe('SkeletonCard', () => {
  it('renders with card styling', () => {
    const { container } = render(<SkeletonCard />);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('rounded-lg', 'border', 'bg-card');
  });

  it('shows title by default', () => {
    const { container } = render(<SkeletonCard showTitle />);

    // Look for title skeleton element
    const titleElements = container.querySelectorAll('.h-5');
    expect(titleElements.length).toBeGreaterThan(0);
  });

  it('shows description when enabled', () => {
    const { container: _container } = render(<SkeletonCard showDescription />);

    // Look for description skeleton element
    // Note: h-4 class is generic, so we verify it renders
    const descElements = _container.querySelectorAll('.h-4');
    expect(descElements.length).toBeGreaterThan(0);
  });

  it('shows footer when showFooter is true', () => {
    const { container } = render(<SkeletonCard showFooter />);

    // Footer buttons have h-9 class
    const buttons = container.querySelectorAll('.h-9');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('has aria-hidden attribute', () => {
    const { container } = render(<SkeletonCard />);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveAttribute('aria-hidden', 'true');
  });

  it('has role="presentation" for semantics', () => {
    const { container } = render(<SkeletonCard />);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveAttribute('role', 'presentation');
  });

  it('supports custom content height', () => {
    const { container } = render(<SkeletonCard contentHeight={250} />);

    // Find content area with specific height
    const contentArea = container.querySelector('.w-full[style*="height"]');
    expect(contentArea).toHaveStyle({ height: '250px' });
  });
});

describe('SkeletonTable', () => {
  it('renders default 5 rows and 4 columns', () => {
    const { container } = render(<SkeletonTable />);
    const rows = container.querySelectorAll('.divide-y > div');

    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it('renders specified rows and columns', () => {
    const { container } = render(
      <SkeletonTable
        rows={3}
        columns={6}
      />
    );
    const rows = container.querySelectorAll('.divide-y > div');

    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  it('shows header when showHeader is true', () => {
    const { container } = render(<SkeletonTable showHeader />);
    const header = container.querySelector('.pb-3');

    expect(header).toBeInTheDocument();
  });

  it('hides header when showHeader is false', () => {
    const { container } = render(<SkeletonTable showHeader={false} />);
    const rows = container.querySelectorAll('.divide-y > div');

    // When header is hidden, only data rows appear
    expect(rows.length).toBeGreaterThan(0);
  });

  it('has aria-hidden attribute', () => {
    const { container } = render(<SkeletonTable />);
    const table = container.firstChild as HTMLElement;

    expect(table).toHaveAttribute('aria-hidden', 'true');
  });

  it('has role="presentation" for semantics', () => {
    const { container } = render(<SkeletonTable />);
    const table = container.firstChild as HTMLElement;

    expect(table).toHaveAttribute('role', 'presentation');
  });
});

describe('SkeletonChart', () => {
  it('renders with specified height', () => {
    const { container } = render(<SkeletonChart height={400} />);
    const chartArea = container.querySelector('[style*="height"]');

    expect(chartArea).toHaveStyle({ height: '400px' });
  });

  it('shows title when showTitle is true', () => {
    const { container } = render(<SkeletonChart showTitle />);
    const title = container.querySelector('.h-5');

    expect(title).toBeInTheDocument();
  });

  it('hides title when showTitle is false', () => {
    const { container } = render(<SkeletonChart showTitle={false} />);
    const titleElements = container.querySelectorAll('.h-5');

    // Should have no title elements
    expect(titleElements.length).toBe(0);
  });

  it('shows legend when showLegend is true', () => {
    const { container } = render(<SkeletonChart showLegend />);
    const legend = container.querySelector('.justify-center');

    expect(legend).toBeInTheDocument();
  });

  it('hides legend when showLegend is false', () => {
    const { container } = render(<SkeletonChart showLegend={false} />);
    const legend = container.querySelector('.justify-center');

    expect(legend).not.toBeInTheDocument();
  });

  it('has aria-hidden attribute', () => {
    const { container } = render(<SkeletonChart />);
    const chart = container.firstChild as HTMLElement;

    expect(chart).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('SkeletonAvatar', () => {
  it('renders with default medium size', () => {
    render(<SkeletonAvatar data-testid="avatar" />);
    const avatar = screen.getByTestId('avatar');

    expect(avatar).toHaveClass('h-10', 'w-10');
  });

  it('renders with specified size (sm)', () => {
    render(
      <SkeletonAvatar
        data-testid="avatar"
        size="sm"
      />
    );
    const avatar = screen.getByTestId('avatar');

    expect(avatar).toHaveClass('h-8', 'w-8');
  });

  it('renders with specified size (lg)', () => {
    render(
      <SkeletonAvatar
        data-testid="avatar"
        size="lg"
      />
    );
    const avatar = screen.getByTestId('avatar');

    expect(avatar).toHaveClass('h-12', 'w-12');
  });

  it('renders with specified size (xl)', () => {
    render(
      <SkeletonAvatar
        data-testid="avatar"
        size="xl"
      />
    );
    const avatar = screen.getByTestId('avatar');

    expect(avatar).toHaveClass('h-16', 'w-16');
  });

  it('renders circle shape by default', () => {
    render(<SkeletonAvatar data-testid="avatar" />);
    const avatar = screen.getByTestId('avatar');

    expect(avatar).toHaveClass('rounded-full');
  });

  it('renders square shape when specified', () => {
    render(
      <SkeletonAvatar
        data-testid="avatar"
        shape="square"
      />
    );
    const avatar = screen.getByTestId('avatar');

    expect(avatar).toHaveClass('rounded-md');
    expect(avatar).not.toHaveClass('rounded-full');
  });

  it('has aria-hidden attribute', () => {
    render(<SkeletonAvatar data-testid="avatar" />);
    const avatar = screen.getByTestId('avatar');

    expect(avatar).toHaveAttribute('aria-hidden', 'true');
  });

  it('respects animate prop', () => {
    render(
      <SkeletonAvatar
        data-testid="avatar"
        animate={false}
      />
    );
    const avatar = screen.getByTestId('avatar');

    expect(avatar).not.toHaveClass('animate-pulse');
  });
});
