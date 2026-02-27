/**
 * Confidence Indicator Component Tests
 *
 * Tests for the ConfidenceIndicator component, hook, and presenters.
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';

import {
  ConfidenceIndicator,
  ConfidenceIndicatorBase,
  ConfidenceIndicatorDot,
  ConfidenceLevelLabel,
  useConfidenceIndicator,
  CONFIDENCE_THRESHOLDS,
  LEVEL_COLORS,
  LEVEL_ICONS,
  LEVEL_LABELS,
} from './index';

// Mock the useReducedMotion hook
vi.mock('@nasnet/ui/primitives', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nasnet/ui/primitives')>();
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

// Test component for the hook
function HookTester(props: Parameters<typeof useConfidenceIndicator>[0]) {
  const state = useConfidenceIndicator(props);
  return (
    <div data-testid="hook-result">
      <span data-testid="level">{state.level}</span>
      <span data-testid="color">{state.color}</span>
      <span data-testid="iconName">{state.iconName}</span>
      <span data-testid="percentage">{state.percentage}</span>
      <span data-testid="method">{state.method || 'none'}</span>
      <span data-testid="canOverride">{String(state.canOverride)}</span>
      <span data-testid="ariaLabel">{state.ariaLabel}</span>
      <span data-testid="levelLabel">{state.levelLabel}</span>
      <button
        data-testid="override"
        onClick={state.handleOverride}
      >
        Override
      </button>
    </div>
  );
}

describe('useConfidenceIndicator Hook', () => {
  describe('Level Calculation', () => {
    it('should return high level for confidence >= 90', () => {
      const testCases = [90, 95, 99, 100];

      testCases.forEach((confidence) => {
        const { unmount } = render(<HookTester confidence={confidence} />);
        expect(screen.getByTestId('level')).toHaveTextContent('high');
        unmount();
      });
    });

    it('should return medium level for confidence >= 60 and < 90', () => {
      const testCases = [60, 75, 85, 89];

      testCases.forEach((confidence) => {
        const { unmount } = render(<HookTester confidence={confidence} />);
        expect(screen.getByTestId('level')).toHaveTextContent('medium');
        unmount();
      });
    });

    it('should return low level for confidence < 60', () => {
      const testCases = [0, 25, 45, 59];

      testCases.forEach((confidence) => {
        const { unmount } = render(<HookTester confidence={confidence} />);
        expect(screen.getByTestId('level')).toHaveTextContent('low');
        unmount();
      });
    });

    it('should handle boundary values correctly', () => {
      // Test exact boundaries
      const boundaries = [
        { confidence: 90, expected: 'high' },
        { confidence: 89, expected: 'medium' },
        { confidence: 60, expected: 'medium' },
        { confidence: 59, expected: 'low' },
      ];

      boundaries.forEach(({ confidence, expected }) => {
        const { unmount } = render(<HookTester confidence={confidence} />);
        expect(screen.getByTestId('level')).toHaveTextContent(expected);
        unmount();
      });
    });

    it('should clamp values to 0-100', () => {
      const { unmount: unmount1 } = render(<HookTester confidence={-10} />);
      expect(screen.getByTestId('percentage')).toHaveTextContent('0');
      unmount1();

      const { unmount: unmount2 } = render(<HookTester confidence={150} />);
      expect(screen.getByTestId('percentage')).toHaveTextContent('100');
      unmount2();
    });
  });

  describe('Color Mapping', () => {
    it('should return success color for high level', () => {
      render(<HookTester confidence={95} />);
      expect(screen.getByTestId('color')).toHaveTextContent('success');
    });

    it('should return warning color for medium level', () => {
      render(<HookTester confidence={75} />);
      expect(screen.getByTestId('color')).toHaveTextContent('warning');
    });

    it('should return error color for low level', () => {
      render(<HookTester confidence={45} />);
      expect(screen.getByTestId('color')).toHaveTextContent('error');
    });
  });

  describe('Icon Mapping', () => {
    it('should return CheckCircle2 for high level', () => {
      render(<HookTester confidence={95} />);
      expect(screen.getByTestId('iconName')).toHaveTextContent('CheckCircle2');
    });

    it('should return AlertTriangle for medium level', () => {
      render(<HookTester confidence={75} />);
      expect(screen.getByTestId('iconName')).toHaveTextContent('AlertTriangle');
    });

    it('should return XCircle for low level', () => {
      render(<HookTester confidence={45} />);
      expect(screen.getByTestId('iconName')).toHaveTextContent('XCircle');
    });
  });

  describe('Override Handling', () => {
    it('should return canOverride true when onOverride is provided', () => {
      const onOverride = vi.fn();
      render(
        <HookTester
          confidence={90}
          onOverride={onOverride}
        />
      );
      expect(screen.getByTestId('canOverride')).toHaveTextContent('true');
    });

    it('should return canOverride false when onOverride is not provided', () => {
      render(<HookTester confidence={90} />);
      expect(screen.getByTestId('canOverride')).toHaveTextContent('false');
    });

    it('should call onOverride when handleOverride is invoked', async () => {
      const user = userEvent.setup();
      const onOverride = vi.fn();
      render(
        <HookTester
          confidence={90}
          onOverride={onOverride}
        />
      );

      await user.click(screen.getByTestId('override'));
      expect(onOverride).toHaveBeenCalledTimes(1);
    });

    it('should not throw when handleOverride is called without onOverride', async () => {
      const user = userEvent.setup();
      render(<HookTester confidence={90} />);

      // Should not throw
      await expect(user.click(screen.getByTestId('override'))).resolves.not.toThrow();
    });
  });

  describe('ARIA Label Generation', () => {
    it('should include level label in aria label', () => {
      render(<HookTester confidence={95} />);
      expect(screen.getByTestId('ariaLabel')).toHaveTextContent('High confidence');
    });

    it('should include percentage when showPercentage is true', () => {
      render(
        <HookTester
          confidence={87}
          showPercentage
        />
      );
      expect(screen.getByTestId('ariaLabel')).toHaveTextContent('87%');
    });

    it('should include method when provided', () => {
      render(
        <HookTester
          confidence={90}
          method="Auto-detected via DHCP"
        />
      );
      expect(screen.getByTestId('ariaLabel')).toHaveTextContent('Auto-detected via DHCP');
    });

    it('should combine all parts correctly', () => {
      render(
        <HookTester
          confidence={92}
          method="Confirmed via ping"
          showPercentage
        />
      );
      const ariaLabel = screen.getByTestId('ariaLabel').textContent;
      expect(ariaLabel).toContain('High confidence');
      expect(ariaLabel).toContain('92%');
      expect(ariaLabel).toContain('Confirmed via ping');
    });
  });
});

describe('ConfidenceIndicator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<ConfidenceIndicator confidence={90} />);
      // Auto variant renders multiple status elements (mobile + desktop)
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
    });

    it('should render with all props', () => {
      const onOverride = vi.fn();
      render(
        <ConfidenceIndicator
          confidence={85}
          method="Auto-detected"
          onOverride={onOverride}
          showPercentage
          size="md"
          variant="desktop"
        />
      );
      // Desktop variant renders an interactive button
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render mobile variant when specified', () => {
      render(
        <ConfidenceIndicator
          confidence={90}
          variant="mobile"
        />
      );
      // Mobile variant uses a button with aria-haspopup
      expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('should render desktop variant when specified', () => {
      render(
        <ConfidenceIndicator
          confidence={90}
          variant="desktop"
        />
      );
      // Desktop renders an interactive button for tooltip trigger
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render auto variant with both mobile and desktop presenters', () => {
      render(
        <ConfidenceIndicator
          confidence={90}
          variant="auto"
        />
      );
      // Auto variant renders both with CSS visibility - expect multiple status elements
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThanOrEqual(2); // Mobile + Desktop
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', async () => {
      render(
        <ConfidenceIndicator
          confidence={95}
          method="Auto-detected via DHCP"
          variant="desktop"
        />
      );

      // Find the element with the aria-label
      const indicator = screen.getByLabelText(/High confidence/i);
      expect(indicator).toBeInTheDocument();
    });

    it('should have role="status" for dynamic updates in auto variant', () => {
      render(
        <ConfidenceIndicator
          confidence={90}
          variant="auto"
        />
      );
      // Auto variant has role="status" wrapper for live announcements
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
    });

    it('should pass axe accessibility tests', async () => {
      const { container } = render(
        <ConfidenceIndicator
          confidence={90}
          method="Auto-detected"
          variant="desktop"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have visible focus indicator', () => {
      render(
        <ConfidenceIndicator
          confidence={90}
          variant="desktop"
          onOverride={() => {}}
        />
      );

      // The interactive element should have focus-visible classes
      const indicator = screen.getByLabelText(/High confidence/i);
      expect(indicator.className).toContain('focus-visible:');
    });
  });
});

describe('ConfidenceIndicatorBase', () => {
  it('should render with correct level styling', () => {
    const state = {
      level: 'high' as const,
      color: 'success' as const,
      iconName: 'CheckCircle2' as const,
      percentage: 95,
      method: undefined,
      canOverride: false,
      handleOverride: vi.fn(),
      ariaLabel: 'High confidence, 95%',
      levelLabel: 'High confidence',
      showPercentage: true,
    };

    render(
      <ConfidenceIndicatorBase
        state={state}
        size="md"
      />
    );

    // Check for success color classes
    const indicator = screen.getByRole('status');
    expect(indicator.className).toContain('bg-success');
    expect(indicator.className).toContain('text-success');
  });

  it('should be interactive when interactive prop is true', () => {
    const state = {
      level: 'high' as const,
      color: 'success' as const,
      iconName: 'CheckCircle2' as const,
      percentage: 95,
      method: undefined,
      canOverride: true,
      handleOverride: vi.fn(),
      ariaLabel: 'High confidence, 95%',
      levelLabel: 'High confidence',
      showPercentage: true,
    };

    render(
      <ConfidenceIndicatorBase
        state={state}
        size="md"
        interactive
      />
    );

    const indicator = screen.getByRole('button');
    expect(indicator).toHaveAttribute('tabIndex', '0');
  });

  it('should call onClick when clicked and interactive', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const state = {
      level: 'high' as const,
      color: 'success' as const,
      iconName: 'CheckCircle2' as const,
      percentage: 95,
      method: undefined,
      canOverride: true,
      handleOverride: vi.fn(),
      ariaLabel: 'High confidence, 95%',
      levelLabel: 'High confidence',
      showPercentage: true,
    };

    render(
      <ConfidenceIndicatorBase
        state={state}
        size="md"
        interactive
        onClick={onClick}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('ConfidenceIndicatorDot', () => {
  it('should render with correct color for each level', () => {
    const levels = ['high', 'medium', 'low'] as const;
    const colors = ['bg-success', 'bg-warning', 'bg-error'];

    levels.forEach((level, index) => {
      const { container, unmount } = render(
        <ConfidenceIndicatorDot
          level={level}
          size="md"
        />
      );
      expect(container.firstChild).toHaveClass(colors[index]);
      unmount();
    });
  });

  it('should render correct sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    const sizeClasses = ['h-2', 'h-2.5', 'h-3'];

    sizes.forEach((size, index) => {
      const { container, unmount } = render(
        <ConfidenceIndicatorDot
          level="high"
          size={size}
        />
      );
      expect(container.firstChild).toHaveClass(sizeClasses[index]);
      unmount();
    });
  });
});

describe('ConfidenceLevelLabel', () => {
  it('should display level label', () => {
    const state = {
      level: 'high' as const,
      color: 'success' as const,
      iconName: 'CheckCircle2' as const,
      percentage: 95,
      method: undefined,
      canOverride: false,
      handleOverride: vi.fn(),
      ariaLabel: 'High confidence, 95%',
      levelLabel: 'High confidence',
      showPercentage: true,
    };

    render(
      <ConfidenceLevelLabel
        state={state}
        size="md"
      />
    );
    expect(screen.getByText(/High confidence/)).toBeInTheDocument();
  });

  it('should show percentage when showPercentage is true', () => {
    const state = {
      level: 'high' as const,
      color: 'success' as const,
      iconName: 'CheckCircle2' as const,
      percentage: 95,
      method: undefined,
      canOverride: false,
      handleOverride: vi.fn(),
      ariaLabel: 'High confidence, 95%',
      levelLabel: 'High confidence',
      showPercentage: true,
    };

    render(
      <ConfidenceLevelLabel
        state={state}
        size="md"
        showPercentage
      />
    );
    expect(screen.getByText(/(95%)/)).toBeInTheDocument();
  });

  it('should not show percentage when showPercentage is false', () => {
    const state = {
      level: 'high' as const,
      color: 'success' as const,
      iconName: 'CheckCircle2' as const,
      percentage: 95,
      method: undefined,
      canOverride: false,
      handleOverride: vi.fn(),
      ariaLabel: 'High confidence, 95%',
      levelLabel: 'High confidence',
      showPercentage: false,
    };

    render(
      <ConfidenceLevelLabel
        state={state}
        size="md"
        showPercentage={false}
      />
    );
    expect(screen.queryByText(/(95%)/)).not.toBeInTheDocument();
  });
});

describe('Constants', () => {
  it('should export correct threshold values', () => {
    expect(CONFIDENCE_THRESHOLDS.HIGH).toBe(90);
    expect(CONFIDENCE_THRESHOLDS.MEDIUM).toBe(60);
  });

  it('should export correct color mapping', () => {
    expect(LEVEL_COLORS.high).toBe('success');
    expect(LEVEL_COLORS.medium).toBe('warning');
    expect(LEVEL_COLORS.low).toBe('error');
  });

  it('should export correct icon mapping', () => {
    expect(LEVEL_ICONS.high).toBe('CheckCircle2');
    expect(LEVEL_ICONS.medium).toBe('AlertTriangle');
    expect(LEVEL_ICONS.low).toBe('XCircle');
  });

  it('should export correct label mapping', () => {
    expect(LEVEL_LABELS.high).toBe('High confidence');
    expect(LEVEL_LABELS.medium).toBe('Medium confidence');
    expect(LEVEL_LABELS.low).toBe('Low confidence');
  });
});

describe('Tooltip/Sheet Behavior', () => {
  it('should open tooltip on hover (desktop)', async () => {
    const user = userEvent.setup();
    render(
      <ConfidenceIndicator
        confidence={90}
        method="Auto-detected"
        variant="desktop"
      />
    );

    const indicator = screen.getByLabelText(/High confidence/i);
    await user.hover(indicator);

    // Wait for tooltip to appear - use getAllByText since tooltip duplicates content
    await waitFor(
      () => {
        const elements = screen.getAllByText(/Auto-detected/);
        expect(elements.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 1000 }
    );
  });

  it('should show override button when onOverride is provided', async () => {
    const user = userEvent.setup();
    const onOverride = vi.fn();
    render(
      <ConfidenceIndicator
        confidence={90}
        method="Auto-detected"
        variant="desktop"
        onOverride={onOverride}
      />
    );

    const indicator = screen.getByLabelText(/High confidence/i);
    await user.click(indicator);

    // Wait for tooltip/popover to appear with override button
    await waitFor(
      () => {
        const overrideButtons = screen.getAllByText(/Edit manually/i);
        expect(overrideButtons.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 1000 }
    );
  });
});
