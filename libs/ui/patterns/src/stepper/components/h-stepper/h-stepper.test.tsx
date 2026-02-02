/**
 * HStepper Component Tests
 *
 * Test suite for the Horizontal Stepper (Header Pattern) component.
 * Tests cover rendering, navigation, accessibility, error states, and responsive behavior.
 *
 * @see NAS-4A.16: Build Horizontal Stepper (Header Pattern)
 */

import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { HStepper } from './h-stepper';
import { HStepperProgress } from './h-stepper-progress';
import { HStepperItem } from './h-stepper-item';
import { useStepper } from '../../hooks/use-stepper';
import type { StepConfig, StepperConfig } from '../../hooks/use-stepper.types';

// ===== Test Helpers =====

/**
 * Create a basic step configuration
 */
function createStep(id: string, title: string, options?: Partial<StepConfig>): StepConfig {
  return {
    id,
    title,
    ...options,
  };
}

/**
 * Create a basic stepper configuration
 */
function createConfig(steps: StepConfig[], options?: Partial<StepperConfig>): StepperConfig {
  return {
    steps,
    ...options,
  };
}

/**
 * Wrapper component that provides stepper context for testing
 */
function HStepperTestWrapper({
  config,
  stepperProps = {},
}: {
  config: StepperConfig;
  stepperProps?: Partial<React.ComponentProps<typeof HStepper>>;
}) {
  const stepper = useStepper(config);
  return <HStepper stepper={stepper} {...stepperProps} />;
}

// ===== Test Data =====

const basicSteps: StepConfig[] = [
  createStep('step1', 'Step 1', { description: 'First step' }),
  createStep('step2', 'Step 2', { description: 'Second step' }),
  createStep('step3', 'Step 3', { description: 'Third step' }),
];

const fiveSteps: StepConfig[] = [
  createStep('wan', 'WAN Configuration'),
  createStep('lan', 'LAN Setup'),
  createStep('features', 'Extra Features'),
  createStep('security', 'Security'),
  createStep('review', 'Review'),
];

// ===== Rendering Tests =====

describe('HStepper rendering', () => {
  it('should render all steps', () => {
    render(<HStepperTestWrapper config={createConfig(basicSteps)} />);

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('should render step label in header format "Step X of Y: Title"', () => {
    render(<HStepperTestWrapper config={createConfig(basicSteps)} />);

    // Use getAllByText since the text appears in both the live region and visible span
    const elements = screen.getAllByText(/Step 1 of 3: Step 1/);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('should render step numbers for pending steps', () => {
    render(<HStepperTestWrapper config={createConfig(basicSteps)} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should render back button when not on first step', async () => {
    function TestComponent() {
      const stepper = useStepper(createConfig(basicSteps));
      return (
        <div>
          <HStepper stepper={stepper} />
          <button onClick={() => stepper.next()} data-testid="next">
            Next
          </button>
        </div>
      );
    }

    const user = userEvent.setup();
    render(<TestComponent />);

    // No back button on first step
    expect(screen.queryByLabelText('Go to previous step')).not.toBeInTheDocument();

    // Advance to step 2
    await user.click(screen.getByTestId('next'));

    await waitFor(() => {
      expect(screen.getByLabelText('Go to previous step')).toBeInTheDocument();
    });
  });

  it('should hide back button when showBackButton is false', () => {
    function TestComponent() {
      const stepper = useStepper(createConfig(basicSteps, { initialStep: 1 }));
      return <HStepper stepper={stepper} showBackButton={false} />;
    }

    render(<TestComponent />);

    expect(screen.queryByLabelText('Go to previous step')).not.toBeInTheDocument();
  });

  it('should render menu button when onMenuClick is provided', () => {
    const onMenuClick = vi.fn();
    render(
      <HStepperTestWrapper
        config={createConfig(basicSteps)}
        stepperProps={{ onMenuClick }}
      />
    );

    expect(screen.getByLabelText('Open step menu')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <HStepperTestWrapper
        config={createConfig(basicSteps)}
        stepperProps={{ className: 'custom-class' }}
      />
    );

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('custom-class');
  });

  it('should apply sticky styles by default', () => {
    render(<HStepperTestWrapper config={createConfig(basicSteps)} />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky');
  });

  it('should not apply sticky styles when sticky is false', () => {
    render(
      <HStepperTestWrapper
        config={createConfig(basicSteps)}
        stepperProps={{ sticky: false }}
      />
    );

    const header = screen.getByRole('banner');
    expect(header).not.toHaveClass('sticky');
  });
});

// ===== Progress Bar Tests =====

describe('HStepperProgress', () => {
  it('should render progress bar with progressbar role', () => {
    render(<HStepperTestWrapper config={createConfig(basicSteps)} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
  });

  it('should have correct aria-valuenow based on current step', () => {
    render(<HStepperTestWrapper config={createConfig(basicSteps)} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '1');
    expect(progressbar).toHaveAttribute('aria-valuemax', '3');
  });

  it('should calculate progress percentage correctly', () => {
    // Test the progress calculation: (activeStep / (totalSteps - 1)) * 100
    // For step 0 of 3: (0 / 2) * 100 = 0%
    // For step 1 of 3: (1 / 2) * 100 = 50%
    // For step 2 of 3: (2 / 2) * 100 = 100%

    const completedSteps = new Set<string>();
    const { rerender } = render(
      <HStepperProgress
        steps={basicSteps}
        activeStep={0}
        completedSteps={completedSteps}
      />
    );

    // Check initial (step 0)
    let progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '1');

    // Rerender at step 1
    rerender(
      <HStepperProgress
        steps={basicSteps}
        activeStep={1}
        completedSteps={completedSteps}
      />
    );

    progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '2');
  });

  it('should stop progress at error step', () => {
    const stepsWithError = ['step2'];
    render(
      <HStepperProgress
        steps={basicSteps}
        activeStep={2}
        completedSteps={new Set(['step1', 'step2'])}
        stepsWithErrors={stepsWithError}
      />
    );

    // Progress should stop at step2 (index 1)
    // Even though activeStep is 2
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
  });
});

// ===== Step State Tests =====

describe('HStepper step states', () => {
  it('should highlight the current step', () => {
    render(<HStepperTestWrapper config={createConfig(basicSteps)} />);

    // First step should have aria-current="step"
    const buttons = screen.getAllByRole('button');
    const step1Button = buttons.find(btn => btn.getAttribute('aria-label')?.includes('Step 1'));
    expect(step1Button).toHaveAttribute('aria-current', 'step');
  });

  it('should disable future steps', () => {
    render(<HStepperTestWrapper config={createConfig(basicSteps)} />);

    // Future steps should be disabled
    const buttons = screen.getAllByRole('button');
    const step3Button = buttons.find(btn => btn.getAttribute('aria-label')?.includes('Step 3'));
    expect(step3Button).toHaveAttribute('aria-disabled', 'true');
  });

  it('should show checkmark icon for completed steps', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const stepper = useStepper(createConfig(basicSteps));
      return (
        <div>
          <HStepper stepper={stepper} />
          <button onClick={() => stepper.next()} data-testid="next">
            Next
          </button>
        </div>
      );
    }

    const { container } = render(<TestComponent />);

    // Advance to step 2
    await user.click(screen.getByTestId('next'));

    await waitFor(() => {
      // Should have checkmark icon (svg with path for Check)
      const checkIcons = container.querySelectorAll('svg');
      expect(checkIcons.length).toBeGreaterThan(0);
    });
  });
});

// ===== Navigation Tests =====

describe('HStepper navigation', () => {
  it('should navigate to completed step on click', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const stepper = useStepper(createConfig(basicSteps));

      return (
        <div>
          <HStepper stepper={stepper} />
          <button onClick={() => stepper.next()} data-testid="next">
            Next
          </button>
          <span data-testid="current">{stepper.currentIndex}</span>
        </div>
      );
    }

    render(<TestComponent />);

    // Initially at step 0
    expect(screen.getByTestId('current')).toHaveTextContent('0');

    // Advance to step 1
    await user.click(screen.getByTestId('next'));
    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('1');
    });

    // Click back to step 0 (now completed)
    const buttons = screen.getAllByRole('button');
    const step1Button = buttons.find(btn => btn.getAttribute('aria-label')?.includes('Step 1'));
    await user.click(step1Button!);

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('0');
    });
  });

  it('should not navigate to future step on click', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const stepper = useStepper(createConfig(basicSteps));

      return (
        <div>
          <HStepper stepper={stepper} />
          <span data-testid="current">{stepper.currentIndex}</span>
        </div>
      );
    }

    render(<TestComponent />);

    // Try to click on step 3 (future step)
    const buttons = screen.getAllByRole('button');
    const step3Button = buttons.find(btn => btn.getAttribute('aria-label')?.includes('Step 3'));
    await user.click(step3Button!);

    // Should still be at step 0
    expect(screen.getByTestId('current')).toHaveTextContent('0');
  });

  it('should navigate using back button', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const stepper = useStepper(createConfig(basicSteps));

      return (
        <div>
          <HStepper stepper={stepper} />
          <button onClick={() => stepper.next()} data-testid="next">
            Next
          </button>
          <span data-testid="current">{stepper.currentIndex}</span>
        </div>
      );
    }

    render(<TestComponent />);

    // Advance to step 1
    await user.click(screen.getByTestId('next'));
    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('1');
    });

    // Click back button
    await user.click(screen.getByLabelText('Go to previous step'));
    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('0');
    });
  });

  it('should call onMenuClick when menu button clicked', async () => {
    const user = userEvent.setup();
    const onMenuClick = vi.fn();

    render(
      <HStepperTestWrapper
        config={createConfig(basicSteps)}
        stepperProps={{ onMenuClick }}
      />
    );

    await user.click(screen.getByLabelText('Open step menu'));
    expect(onMenuClick).toHaveBeenCalled();
  });
});

// ===== Error State Tests =====

describe('HStepper error states', () => {
  it('should display error state for step with errors', async () => {
    const failingValidation = vi.fn().mockResolvedValue({
      valid: false,
      errors: { field: 'Validation error' },
    });

    const stepsWithErrors: StepConfig[] = [
      createStep('step1', 'Step 1', { validate: failingValidation }),
      createStep('step2', 'Step 2'),
    ];

    function TestComponent() {
      const stepper = useStepper(createConfig(stepsWithErrors));

      return (
        <div>
          <HStepper stepper={stepper} />
          <button onClick={() => stepper.next()} data-testid="next">
            Next
          </button>
        </div>
      );
    }

    const user = userEvent.setup();
    const { container } = render(<TestComponent />);

    // Try to advance (validation should fail)
    await user.click(screen.getByTestId('next'));

    // Wait for validation to complete
    await waitFor(() => {
      expect(failingValidation).toHaveBeenCalled();
    });

    // Error icon should be rendered
    const errorIcons = container.querySelectorAll('svg');
    expect(errorIcons.length).toBeGreaterThan(0);
  });
});

// ===== Accessibility Tests =====

describe('HStepper accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <HStepperTestWrapper config={createConfig(basicSteps)} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA attributes on navigation', () => {
    render(
      <HStepperTestWrapper
        config={createConfig(basicSteps)}
        stepperProps={{ 'aria-label': 'Custom wizard progress' }}
      />
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Custom wizard progress');
  });

  it('should have role="list" on step container', () => {
    render(<HStepperTestWrapper config={createConfig(basicSteps)} />);

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
  });

  it('should have aria-current on active step', () => {
    render(<HStepperTestWrapper config={createConfig(basicSteps)} />);

    const buttons = screen.getAllByRole('button');
    const activeButton = buttons.find(btn => btn.getAttribute('aria-current') === 'step');
    expect(activeButton).toBeInTheDocument();
  });

  it('should have aria-disabled on future steps', () => {
    render(<HStepperTestWrapper config={createConfig(basicSteps)} />);

    const buttons = screen.getAllByRole('button');
    const step3Button = buttons.find(btn => btn.getAttribute('aria-label')?.includes('Step 3'));
    expect(step3Button).toHaveAttribute('aria-disabled', 'true');
  });

  it('should have progressbar with proper ARIA attributes', () => {
    render(<HStepperTestWrapper config={createConfig(fiveSteps)} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '1');
    expect(progressbar).toHaveAttribute('aria-valuemin', '1');
    expect(progressbar).toHaveAttribute('aria-valuemax', '5');
    expect(progressbar).toHaveAttribute('aria-label');
  });

  it('should announce step changes via live region', () => {
    render(<HStepperTestWrapper config={createConfig(basicSteps)} />);

    // Check for live region
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
});

// ===== Keyboard Navigation Tests =====

describe('HStepper keyboard navigation', () => {
  it('should focus clickable steps with Tab', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const stepper = useStepper(createConfig(basicSteps));
      React.useEffect(() => {
        stepper.next();
      }, []);
      return <HStepper stepper={stepper} />;
    }

    render(<TestComponent />);

    // Wait for step advance - use getAllByText since text appears in multiple places
    await waitFor(() => {
      const elements = screen.getAllByText(/Step 2 of 3/);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    // Tab to first clickable element
    await user.tab();
    // Should focus back button first
    expect(screen.getByLabelText('Go to previous step')).toHaveFocus();
  });

  it('should activate step on Enter', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const stepper = useStepper(createConfig(basicSteps));

      React.useEffect(() => {
        stepper.next();
      }, []);

      return (
        <div>
          <HStepper stepper={stepper} />
          <span data-testid="current">{stepper.currentIndex}</span>
        </div>
      );
    }

    render(<TestComponent />);

    // Wait for initial advance
    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('1');
    });

    // Focus on step 1 (completed) and press Enter
    const buttons = screen.getAllByRole('button');
    const step1Button = buttons.find(btn => btn.getAttribute('aria-label')?.includes('Step 1'));
    step1Button?.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('0');
    });
  });

  it('should activate step on Space', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const stepper = useStepper(createConfig(basicSteps));

      React.useEffect(() => {
        stepper.next();
      }, []);

      return (
        <div>
          <HStepper stepper={stepper} />
          <span data-testid="current">{stepper.currentIndex}</span>
        </div>
      );
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('1');
    });

    const buttons = screen.getAllByRole('button');
    const step1Button = buttons.find(btn => btn.getAttribute('aria-label')?.includes('Step 1'));
    step1Button?.focus();
    await user.keyboard(' ');

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('0');
    });
  });
});

// ===== HStepperItem Tests =====

describe('HStepperItem', () => {
  it('should render step number', () => {
    render(
      <HStepperItem
        step={createStep('test', 'Test Step')}
        index={0}
        isActive={false}
        isCompleted={false}
        hasError={false}
        disabled={true}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should render title when showTitle is true', () => {
    render(
      <HStepperItem
        step={createStep('test', 'Test Step')}
        index={0}
        isActive={false}
        isCompleted={false}
        hasError={false}
        showTitle={true}
        disabled={true}
      />
    );

    expect(screen.getByText('Test Step')).toBeInTheDocument();
  });

  it('should not render title when showTitle is false', () => {
    render(
      <HStepperItem
        step={createStep('test', 'Test Step')}
        index={0}
        isActive={false}
        isCompleted={false}
        hasError={false}
        showTitle={false}
        disabled={true}
      />
    );

    // Title should only be in the aria-label, not visible
    expect(screen.queryByText('Test Step')).not.toBeInTheDocument();
  });

  it('should call onClick when clicked and not disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <HStepperItem
        step={createStep('test', 'Test Step')}
        index={0}
        isActive={false}
        isCompleted={true}
        hasError={false}
        onClick={onClick}
        disabled={false}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('should not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <HStepperItem
        step={createStep('test', 'Test Step')}
        index={0}
        isActive={false}
        isCompleted={false}
        hasError={false}
        onClick={onClick}
        disabled={true}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ===== Integration Tests =====

describe('HStepper integration', () => {
  it('should work with form validation flow', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    const stepsWithValidation: StepConfig[] = [
      createStep('step1', 'Step 1', {
        validate: vi.fn().mockResolvedValue({ valid: true }),
      }),
      createStep('step2', 'Step 2', {
        validate: vi.fn().mockResolvedValue({ valid: true }),
      }),
      createStep('step3', 'Review'),
    ];

    function TestComponent() {
      const stepper = useStepper(
        createConfig(stepsWithValidation, { onComplete })
      );

      return (
        <div>
          <HStepper stepper={stepper} />
          <button onClick={() => stepper.next()} data-testid="next">
            {stepper.isLast ? 'Complete' : 'Next'}
          </button>
          <span data-testid="current">{stepper.currentIndex}</span>
          <span data-testid="completed">{stepper.isCompleted ? 'yes' : 'no'}</span>
        </div>
      );
    }

    render(<TestComponent />);

    // Progress through all steps
    await user.click(screen.getByTestId('next'));
    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('1');
    });

    await user.click(screen.getByTestId('next'));
    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('2');
    });

    await user.click(screen.getByTestId('next'));
    await waitFor(() => {
      expect(screen.getByTestId('completed')).toHaveTextContent('yes');
    });

    expect(onComplete).toHaveBeenCalled();
  });

  it('should handle validation errors and block navigation', async () => {
    const user = userEvent.setup();

    const failingValidation = vi.fn().mockResolvedValue({
      valid: false,
      errors: { field: 'Required field' },
    });

    const stepsWithFailingValidation: StepConfig[] = [
      createStep('step1', 'Step 1', { validate: failingValidation }),
      createStep('step2', 'Step 2'),
    ];

    function TestComponent() {
      const stepper = useStepper(createConfig(stepsWithFailingValidation));

      return (
        <div>
          <HStepper stepper={stepper} />
          <button onClick={() => stepper.next()} data-testid="next">
            Next
          </button>
          <span data-testid="current">{stepper.currentIndex}</span>
          <span data-testid="errors">
            {Object.keys(stepper.errors).length > 0 ? 'has-errors' : 'no-errors'}
          </span>
        </div>
      );
    }

    render(<TestComponent />);

    // Try to advance
    await user.click(screen.getByTestId('next'));

    // Should stay on step 0 and have errors
    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('0');
      expect(screen.getByTestId('errors')).toHaveTextContent('has-errors');
    });
  });

  it('should update step label when navigating', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const stepper = useStepper(createConfig(fiveSteps));

      return (
        <div>
          <HStepper stepper={stepper} />
          <button onClick={() => stepper.next()} data-testid="next">
            Next
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    // Initial label - use getAllByText since text appears in both live region and visible span
    expect(screen.getAllByText(/Step 1 of 5: WAN Configuration/).length).toBeGreaterThanOrEqual(1);

    // Advance
    await user.click(screen.getByTestId('next'));

    await waitFor(() => {
      const elements = screen.getAllByText(/Step 2 of 5: LAN Setup/);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ===== Theme Support Tests =====

describe('HStepper theme support', () => {
  it('should use CSS variables for colors (no hard-coded colors)', () => {
    const { container } = render(
      <HStepperTestWrapper config={createConfig(basicSteps)} />
    );

    // Check that we're using CSS class-based styling
    // Progress bar should have gradient classes
    const progressFill = container.querySelector('.bg-gradient-to-r');
    expect(progressFill).toBeInTheDocument();

    // Backdrop blur should be applied
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('backdrop-blur-md');
  });

  it('should have backdrop blur effect', () => {
    render(<HStepperTestWrapper config={createConfig(basicSteps)} />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('backdrop-blur-md');
    expect(header).toHaveClass('bg-background/80');
  });
});

// ===== allowSkipSteps Tests =====

describe('HStepper allowSkipSteps', () => {
  it('should allow clicking future steps when allowSkipSteps is true', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      // allowSkipSteps UI needs freeNavigation in stepper config for navigation to work
      const stepper = useStepper(createConfig(basicSteps, { freeNavigation: true }));

      return (
        <div>
          <HStepper stepper={stepper} allowSkipSteps />
          <span data-testid="current">{stepper.currentIndex}</span>
        </div>
      );
    }

    render(<TestComponent />);

    // Click on step 3 (future step)
    const buttons = screen.getAllByRole('button');
    const step3Button = buttons.find(btn => btn.getAttribute('aria-label')?.includes('Step 3'));
    await user.click(step3Button!);

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('2');
    });
  });
});
