/**
 * CStepper Component Tests
 *
 * Test suite for the Content Stepper (Desktop with Preview) component.
 * Tests cover rendering, layout, preview panel, navigation, accessibility, and keyboard shortcuts.
 *
 * @see NAS-4A.17: Build Content Stepper (Desktop with Preview)
 */

import * as React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';

import { CStepper } from './c-stepper';
import { useStepper } from '../../hooks/use-stepper';

import type { StepConfig, StepperConfig } from '../../hooks/use-stepper.types';

// Note: vitest-axe auto-extends expect with toHaveNoViolations

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
function CStepperTestWrapper({
  config,
  stepperProps = {},
  stepContent = <div data-testid="step-content">Step Content</div>,
  previewContent,
}: {
  config: StepperConfig;
  stepperProps?: Partial<React.ComponentProps<typeof CStepper>>;
  stepContent?: React.ReactNode;
  previewContent?: React.ReactNode;
}) {
  const stepper = useStepper(config);
  return (
    <CStepper
      stepper={stepper}
      stepContent={stepContent}
      previewContent={previewContent}
      {...stepperProps}
    />
  );
}

// ===== Test Data =====

const basicSteps: StepConfig[] = [
  createStep('step1', 'Step 1', { description: 'First step description' }),
  createStep('step2', 'Step 2', { description: 'Second step description' }),
  createStep('step3', 'Step 3', { description: 'Third step description' }),
];

// ===== Mock window resize =====

function mockWindowResize(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

// ===== Global Setup =====

// Set default viewport width for all tests to prevent auto-collapse
beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1920,
  });
});

// ===== Rendering Tests =====

describe('CStepper rendering', () => {
  it('should render three-column layout', () => {
    render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        previewContent={<div data-testid="preview-content">Preview</div>}
      />
    );

    // Check for sidebar (VStepper navigation)
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Check for main content area
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Check for preview panel
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('should render step content in center area', () => {
    render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        stepContent={<div data-testid="custom-step-content">Custom Content</div>}
      />
    );

    expect(screen.getByTestId('custom-step-content')).toBeInTheDocument();
  });

  it('should render preview content in preview panel', () => {
    render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        previewContent={<div data-testid="preview-content">Preview Content</div>}
      />
    );

    expect(screen.getByTestId('preview-content')).toBeInTheDocument();
  });

  it('should render without preview panel when previewContent is not provided', () => {
    render(<CStepperTestWrapper config={createConfig(basicSteps)} />);

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        stepperProps={{ className: 'custom-class' }}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should render with custom preview title', () => {
    render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        previewContent={<div>Content</div>}
        stepperProps={{ previewTitle: 'Configuration Preview' }}
      />
    );

    // Find the title in the preview panel header (h3 element)
    expect(screen.getByRole('heading', { name: 'Configuration Preview' })).toBeInTheDocument();
  });
});

// ===== Navigation Tests =====

describe('CStepper navigation', () => {
  it('should render Previous and Next buttons', () => {
    render(<CStepperTestWrapper config={createConfig(basicSteps)} />);

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('should disable Previous button on first step', () => {
    render(<CStepperTestWrapper config={createConfig(basicSteps)} />);

    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).toBeDisabled();
  });

  it('should show Complete button on last step', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const stepper = useStepper(createConfig(basicSteps));

      return (
        <div>
          <CStepper
            stepper={stepper}
            stepContent={<div>Content</div>}
          />
          <span data-testid="current-index">{stepper.currentIndex}</span>
        </div>
      );
    }

    render(<TestComponent />);

    // Navigate through steps using Next button
    const nextButton = screen.getByRole('button', { name: /next/i });

    // Click Next to go to step 2
    await user.click(nextButton);
    await waitFor(() => {
      expect(screen.getByTestId('current-index')).toHaveTextContent('1');
    });

    // Click Next to go to step 3 (last step)
    await user.click(nextButton);
    await waitFor(() => {
      expect(screen.getByTestId('current-index')).toHaveTextContent('2');
    });

    // Now should show Complete button instead of Next
    expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
  });

  it('should navigate forward on Next click', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const stepper = useStepper(createConfig(basicSteps));

      return (
        <div>
          <CStepper
            stepper={stepper}
            stepContent={<div>Step: {stepper.currentStep.title}</div>}
          />
          <span data-testid="current-step">{stepper.currentIndex}</span>
        </div>
      );
    }

    render(<TestComponent />);

    expect(screen.getByTestId('current-step')).toHaveTextContent('0');

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    });
  });

  it('should navigate backward on Previous click', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const stepper = useStepper(createConfig(basicSteps));

      React.useEffect(() => {
        stepper.next(); // Start at step 1
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <div>
          <CStepper
            stepper={stepper}
            stepContent={<div>Step: {stepper.currentStep.title}</div>}
          />
          <span data-testid="current-step">{stepper.currentIndex}</span>
        </div>
      );
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    });

    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent('0');
    });
  });

  it('should use custom navigation labels', () => {
    render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        stepperProps={{
          navigationLabels: {
            previous: 'Go Back',
            next: 'Continue',
            complete: 'Finish',
          },
        }}
      />
    );

    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });
});

// ===== Preview Panel Tests =====

describe('CStepper preview panel', () => {
  it('should show preview panel by default when previewContent is provided', () => {
    render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        previewContent={<div>Preview</div>}
        stepperProps={{ defaultShowPreview: true }}
      />
    );

    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('should hide preview panel when defaultShowPreview is false', () => {
    render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        previewContent={<div>Preview</div>}
        stepperProps={{ defaultShowPreview: false }}
      />
    );

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('should show floating toggle button when preview is collapsed', () => {
    render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        previewContent={<div>Preview</div>}
        stepperProps={{ defaultShowPreview: false }}
      />
    );

    expect(screen.getByRole('button', { name: /show preview/i })).toBeInTheDocument();
  });

  it('should collapse preview panel on close button click', async () => {
    const user = userEvent.setup();
    const onPreviewToggle = vi.fn();

    render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        previewContent={<div>Preview</div>}
        stepperProps={{ onPreviewToggle }}
      />
    );

    // Find and click close button
    const closeButton = screen.getByRole('button', { name: /close preview/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });

    expect(onPreviewToggle).toHaveBeenCalledWith(false);
  });

  it('should expand preview panel on toggle button click', async () => {
    const user = userEvent.setup();
    const onPreviewToggle = vi.fn();

    render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        previewContent={<div>Preview</div>}
        stepperProps={{ defaultShowPreview: false, onPreviewToggle }}
      />
    );

    // Click the floating toggle button
    const toggleButton = screen.getByRole('button', { name: /show preview/i });
    await user.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    expect(onPreviewToggle).toHaveBeenCalledWith(true);
  });
});

// ===== Responsive Behavior Tests =====

describe('CStepper responsive behavior', () => {
  beforeEach(() => {
    // Reset window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });
  });

  it('should auto-collapse preview below 1280px', async () => {
    const onPreviewToggle = vi.fn();

    render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        previewContent={<div>Preview</div>}
        stepperProps={{ onPreviewToggle }}
      />
    );

    // Initially visible
    expect(screen.getByRole('complementary')).toBeInTheDocument();

    // Resize to narrow viewport
    mockWindowResize(1200);

    await waitFor(() => {
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });

    expect(onPreviewToggle).toHaveBeenCalledWith(false);
  });
});

// ===== Keyboard Shortcuts Tests =====

describe('CStepper keyboard shortcuts', () => {
  it('should toggle preview on Alt+P', async () => {
    const user = userEvent.setup();

    render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        previewContent={<div>Preview</div>}
      />
    );

    // Initially visible
    expect(screen.getByRole('complementary')).toBeInTheDocument();

    // Press Alt+P to hide
    await user.keyboard('{Alt>}p{/Alt}');

    await waitFor(() => {
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });

    // Press Alt+P to show
    await user.keyboard('{Alt>}p{/Alt}');

    await waitFor(() => {
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });
  });

  it('should navigate forward on Alt+N', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const stepper = useStepper(createConfig(basicSteps));

      return (
        <div>
          <CStepper stepper={stepper} stepContent={<div>Content</div>} />
          <span data-testid="current">{stepper.currentIndex}</span>
        </div>
      );
    }

    render(<TestComponent />);

    expect(screen.getByTestId('current')).toHaveTextContent('0');

    await user.keyboard('{Alt>}n{/Alt}');

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('1');
    });
  });

  it('should navigate backward on Alt+B', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const stepper = useStepper(createConfig(basicSteps));

      React.useEffect(() => {
        stepper.next();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <div>
          <CStepper stepper={stepper} stepContent={<div>Content</div>} />
          <span data-testid="current">{stepper.currentIndex}</span>
        </div>
      );
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('1');
    });

    await user.keyboard('{Alt>}b{/Alt}');

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('0');
    });
  });
});

// ===== Accessibility Tests =====

describe('CStepper accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        previewContent={<div>Preview</div>}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA roles', () => {
    render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        previewContent={<div>Preview</div>}
        stepperProps={{ 'aria-label': 'Setup wizard' }}
      />
    );

    // Navigation sidebar
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Main content area (top-level landmark, not nested in region)
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Preview panel is complementary (top-level landmark, not nested in region)
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('should have aria-label on container', () => {
    const { container } = render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        stepperProps={{ 'aria-label': 'Custom wizard label' }}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-label', 'Custom wizard label');
  });

  it('should have accessible name on preview close button', () => {
    render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        previewContent={<div>Preview</div>}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close preview/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('should have accessible name on preview toggle button', () => {
    render(
      <CStepperTestWrapper
        config={createConfig(basicSteps)}
        previewContent={<div>Preview</div>}
        stepperProps={{ defaultShowPreview: false }}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /show preview/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('should have live region for step content', () => {
    const { container } = render(
      <CStepperTestWrapper config={createConfig(basicSteps)} />
    );

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });
});

// ===== Error Handling Tests =====

describe('CStepper error handling', () => {
  it('should display validation errors', async () => {
    const user = userEvent.setup();

    const failingStep: StepConfig[] = [
      createStep('step1', 'Step 1', {
        validate: vi.fn().mockResolvedValue({
          valid: false,
          errors: { field1: 'Field is required' },
        }),
      }),
      createStep('step2', 'Step 2'),
    ];

    function TestComponent() {
      const stepper = useStepper(createConfig(failingStep));

      return (
        <div>
          <CStepper
            stepper={stepper}
            stepContent={
              <div>
                {Object.keys(stepper.errors).length > 0 && (
                  <div data-testid="errors">
                    {Object.values(stepper.errors).join(', ')}
                  </div>
                )}
              </div>
            }
          />
          <span data-testid="current">{stepper.currentIndex}</span>
        </div>
      );
    }

    render(<TestComponent />);

    // Try to navigate
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    // Should stay on step 0 and show errors
    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('0');
      expect(screen.getByTestId('errors')).toHaveTextContent('Field is required');
    });
  });

  it('should not advance on validation failure', async () => {
    const user = userEvent.setup();

    const failingValidation = vi.fn().mockResolvedValue({
      valid: false,
      errors: { field: 'Error' },
    });

    const stepsWithValidation: StepConfig[] = [
      createStep('step1', 'Step 1', { validate: failingValidation }),
      createStep('step2', 'Step 2'),
    ];

    function TestComponent() {
      const stepper = useStepper(createConfig(stepsWithValidation));

      return (
        <div>
          <CStepper stepper={stepper} stepContent={<div>Content</div>} />
          <span data-testid="current">{stepper.currentIndex}</span>
        </div>
      );
    }

    render(<TestComponent />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('0');
      expect(failingValidation).toHaveBeenCalled();
    });
  });
});

// ===== Integration Tests =====

describe('CStepper integration', () => {
  it('should complete wizard flow', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    function TestComponent() {
      const stepper = useStepper(
        createConfig(basicSteps, { onComplete })
      );

      return (
        <div>
          <CStepper
            stepper={stepper}
            stepContent={<div>Step: {stepper.currentStep.title}</div>}
          />
          <span data-testid="completed">{stepper.isCompleted ? 'yes' : 'no'}</span>
        </div>
      );
    }

    render(<TestComponent />);

    // Navigate through all steps
    for (let i = 0; i < 3; i++) {
      const nextButton = screen.getByRole('button', {
        name: i < 2 ? /next/i : /complete/i,
      });
      await user.click(nextButton);
      await new Promise((r) => setTimeout(r, 50)); // Small delay for state updates
    }

    await waitFor(() => {
      expect(screen.getByTestId('completed')).toHaveTextContent('yes');
    });

    expect(onComplete).toHaveBeenCalled();
  });

  it('should integrate with VStepper for sidebar navigation', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const stepper = useStepper(createConfig(basicSteps));

      return (
        <div>
          <CStepper
            stepper={stepper}
            stepContent={<div>Step: {stepper.currentStep.title}</div>}
          />
          <button onClick={() => stepper.next()} data-testid="external-next">
            External Next
          </button>
          <span data-testid="current">{stepper.currentIndex}</span>
        </div>
      );
    }

    render(<TestComponent />);

    // Advance using external button
    await user.click(screen.getByTestId('external-next'));

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('1');
    });

    // Click on completed step in sidebar to navigate back
    const step1Button = screen.getByRole('button', { name: /step 1/i });
    await user.click(step1Button);

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('0');
    });
  });
});
