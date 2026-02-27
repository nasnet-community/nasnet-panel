/**
 * MetricDisplay Tests
 *
 * Tests for the MetricDisplay pattern component.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Activity } from 'lucide-react';
import { describe, it, expect, vi } from 'vitest';

import { MetricDisplayDesktop } from './MetricDisplay.Desktop';
import { MetricDisplayMobile } from './MetricDisplay.Mobile';
import { useMetricDisplay } from './useMetricDisplay';

// Mock the platform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

describe('useMetricDisplay', () => {
  it('formats numeric values correctly', () => {
    const result = useMetricDisplay({
      label: 'Test',
      value: 1234567,
    });
    expect(result.formattedValue).toBe('1,234,567');
  });

  it('includes unit in formatted value', () => {
    const result = useMetricDisplay({
      label: 'CPU',
      value: 85,
      unit: '%',
    });
    expect(result.formattedValue).toBe('85 %');
  });

  it('handles string values', () => {
    const result = useMetricDisplay({
      label: 'Status',
      value: 'Active',
    });
    expect(result.formattedValue).toBe('Active');
  });

  it('sets interactive state when onClick provided', () => {
    const onClick = vi.fn();
    const result = useMetricDisplay({
      label: 'Test',
      value: 100,
      onClick,
    });
    expect(result.isInteractive).toBe(true);
    expect(result.ariaProps.role).toBe('button');
    expect(result.ariaProps.tabIndex).toBe(0);
  });

  it('sets non-interactive state when no onClick', () => {
    const result = useMetricDisplay({
      label: 'Test',
      value: 100,
    });
    expect(result.isInteractive).toBe(false);
    expect(result.ariaProps.role).toBe('article');
    expect(result.ariaProps.tabIndex).toBe(-1);
  });

  it('returns correct trend icon name', () => {
    expect(useMetricDisplay({ label: 'Test', value: 1, trend: 'up' }).trendIconName).toBe(
      'arrow-up'
    );
    expect(useMetricDisplay({ label: 'Test', value: 1, trend: 'down' }).trendIconName).toBe(
      'arrow-down'
    );
    expect(useMetricDisplay({ label: 'Test', value: 1, trend: 'stable' }).trendIconName).toBe(
      'minus'
    );
    expect(useMetricDisplay({ label: 'Test', value: 1 }).trendIconName).toBeNull();
  });

  it('returns correct trend classes', () => {
    expect(useMetricDisplay({ label: 'Test', value: 1, trend: 'up' }).trendClasses).toBe(
      'text-success'
    );
    expect(useMetricDisplay({ label: 'Test', value: 1, trend: 'down' }).trendClasses).toBe(
      'text-error'
    );
    expect(useMetricDisplay({ label: 'Test', value: 1, trend: 'stable' }).trendClasses).toContain(
      'text-slate'
    );
  });

  it('returns correct value classes for variants', () => {
    expect(useMetricDisplay({ label: 'Test', value: 1, variant: 'success' }).valueClasses).toBe(
      'text-success'
    );
    expect(useMetricDisplay({ label: 'Test', value: 1, variant: 'warning' }).valueClasses).toBe(
      'text-warning'
    );
    expect(useMetricDisplay({ label: 'Test', value: 1, variant: 'error' }).valueClasses).toBe(
      'text-error'
    );
    expect(useMetricDisplay({ label: 'Test', value: 1, variant: 'info' }).valueClasses).toBe(
      'text-info'
    );
    expect(
      useMetricDisplay({ label: 'Test', value: 1, variant: 'default' }).valueClasses
    ).toContain('text-slate');
  });

  it('generates accessible status text', () => {
    const result = useMetricDisplay({
      label: 'CPU Usage',
      value: 85,
      unit: '%',
      trend: 'up',
      trendValue: '+5%',
    });
    expect(result.statusText).toContain('CPU Usage');
    expect(result.statusText).toContain('85');
    expect(result.statusText).toContain('%');
    expect(result.statusText).toContain('increased by');
    expect(result.statusText).toContain('+5%');
  });
});

describe('MetricDisplayMobile', () => {
  it('renders label and value', () => {
    render(
      <MetricDisplayMobile
        label="CPU Usage"
        value={85}
        unit="%"
      />
    );
    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('85 %')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <MetricDisplayMobile
        label="Activity"
        value={100}
        icon={Activity}
      />
    );
    // Icon should be rendered (Activity from lucide-react)
    const container = screen.getByRole('article');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading', () => {
    render(
      <MetricDisplayMobile
        label="Test"
        value={0}
        isLoading
      />
    );
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('renders as button when onClick provided', () => {
    const onClick = vi.fn();
    render(
      <MetricDisplayMobile
        label="Test"
        value={100}
        onClick={onClick}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });

  it('renders description when provided', () => {
    render(
      <MetricDisplayMobile
        label="Test"
        value={100}
        description="Additional info"
      />
    );
    expect(screen.getByText('Additional info')).toBeInTheDocument();
  });

  it('renders trend indicator', () => {
    render(
      <MetricDisplayMobile
        label="Test"
        value={100}
        trend="up"
        trendValue="+10%"
      />
    );
    expect(screen.getByText('+10%')).toBeInTheDocument();
  });
});

describe('MetricDisplayDesktop', () => {
  it('renders label and value', () => {
    render(
      <MetricDisplayDesktop
        label="Memory"
        value={512}
        unit="MB"
      />
    );
    expect(screen.getByText('Memory')).toBeInTheDocument();
    expect(screen.getByText('512 MB')).toBeInTheDocument();
  });

  it('supports keyboard navigation when interactive', () => {
    const onClick = vi.fn();
    render(
      <MetricDisplayDesktop
        label="Test"
        value={100}
        onClick={onClick}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();

    onClick.mockClear();
    fireEvent.keyDown(button, { key: ' ' });
    expect(onClick).toHaveBeenCalled();
  });

  it('has focus styles when interactive', () => {
    const onClick = vi.fn();
    render(
      <MetricDisplayDesktop
        label="Test"
        value={100}
        onClick={onClick}
      />
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('focus-visible:ring');
  });

  it('renders loading state', () => {
    render(
      <MetricDisplayDesktop
        label="Test"
        value={0}
        isLoading
      />
    );
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });
});
