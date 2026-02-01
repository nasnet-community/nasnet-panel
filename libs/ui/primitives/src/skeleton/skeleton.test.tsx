/**
 * Skeleton Components Tests
 *
 * @see NAS-4.16: Implement Loading States & Skeleton UI
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
    render(<Skeleton data-testid="skeleton" className="h-4 w-full" />);
    const skeleton = screen.getByTestId('skeleton');

    expect(skeleton).toHaveClass('h-4', 'w-full');
  });

  it('has aria-hidden attribute', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');

    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not animate when animate prop is false', () => {
    render(<Skeleton data-testid="skeleton" animate={false} />);
    const skeleton = screen.getByTestId('skeleton');

    expect(skeleton).not.toHaveClass('animate-pulse');
  });
});

describe('SkeletonText', () => {
  it('renders default 3 lines', () => {
    render(<SkeletonText data-testid="skeleton-text" />);
    const container = screen.getByTestId('skeleton-text');
    const lines = container.querySelectorAll('div > div');

    expect(lines).toHaveLength(3);
  });

  it('renders specified number of lines', () => {
    render(<SkeletonText data-testid="skeleton-text" lines={5} />);
    const container = screen.getByTestId('skeleton-text');
    const lines = container.querySelectorAll('div > div');

    expect(lines).toHaveLength(5);
  });

  it('applies lastLineWidth to last line', () => {
    render(<SkeletonText data-testid="skeleton-text" lines={3} lastLineWidth="50%" />);
    const container = screen.getByTestId('skeleton-text');
    const lines = container.querySelectorAll('div > div');
    const lastLine = lines[lines.length - 1];

    expect(lastLine).toHaveStyle({ width: '50%' });
  });

  it('has role="presentation" for accessibility', () => {
    render(<SkeletonText data-testid="skeleton-text" />);
    const container = screen.getByTestId('skeleton-text');

    expect(container).toHaveAttribute('role', 'presentation');
  });
});

describe('SkeletonCard', () => {
  it('renders with title by default', () => {
    const { container } = render(<SkeletonCard />);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('rounded-lg', 'border', 'bg-card');
  });

  it('shows footer when showFooter is true', () => {
    const { container } = render(<SkeletonCard showFooter />);

    // Footer has two buttons
    const buttons = container.querySelectorAll('.h-9');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('has aria-hidden attribute', () => {
    const { container } = render(<SkeletonCard />);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('SkeletonTable', () => {
  it('renders default 5 rows and 4 columns', () => {
    const { container } = render(<SkeletonTable />);
    const rows = container.querySelectorAll('.divide-y > div');

    expect(rows).toHaveLength(5);
  });

  it('renders specified rows and columns', () => {
    const { container } = render(<SkeletonTable rows={3} columns={6} />);
    const rows = container.querySelectorAll('.divide-y > div');
    const firstRowCells = rows[0]?.querySelectorAll('div');

    expect(rows).toHaveLength(3);
    expect(firstRowCells).toHaveLength(6);
  });

  it('shows header when showHeader is true', () => {
    const { container } = render(<SkeletonTable showHeader />);
    const header = container.querySelector('.border-b');

    expect(header).toBeInTheDocument();
  });

  it('hides header when showHeader is false', () => {
    const { container } = render(<SkeletonTable showHeader={false} />);
    const header = container.querySelector('.pb-3.border-b');

    expect(header).not.toBeInTheDocument();
  });
});

describe('SkeletonChart', () => {
  it('renders with specified height', () => {
    const { container } = render(<SkeletonChart height={400} />);
    const chartArea = container.querySelector('.w-full[style]');

    expect(chartArea).toHaveStyle({ height: '400px' });
  });

  it('shows title when showTitle is true', () => {
    const { container } = render(<SkeletonChart showTitle />);
    const title = container.querySelector('.h-5.w-1\\/3');

    expect(title).toBeInTheDocument();
  });

  it('shows legend when showLegend is true', () => {
    const { container } = render(<SkeletonChart showLegend />);
    const legend = container.querySelector('.justify-center');

    expect(legend).toBeInTheDocument();
  });
});

describe('SkeletonAvatar', () => {
  it('renders with default medium size', () => {
    render(<SkeletonAvatar data-testid="avatar" />);
    const avatar = screen.getByTestId('avatar');

    expect(avatar).toHaveClass('h-10', 'w-10');
  });

  it('renders with specified size', () => {
    render(<SkeletonAvatar data-testid="avatar" size="lg" />);
    const avatar = screen.getByTestId('avatar');

    expect(avatar).toHaveClass('h-12', 'w-12');
  });

  it('renders circle shape by default', () => {
    render(<SkeletonAvatar data-testid="avatar" />);
    const avatar = screen.getByTestId('avatar');

    expect(avatar).toHaveClass('rounded-full');
  });

  it('renders square shape when specified', () => {
    render(<SkeletonAvatar data-testid="avatar" shape="square" />);
    const avatar = screen.getByTestId('avatar');

    expect(avatar).toHaveClass('rounded-md');
    expect(avatar).not.toHaveClass('rounded-full');
  });
});
