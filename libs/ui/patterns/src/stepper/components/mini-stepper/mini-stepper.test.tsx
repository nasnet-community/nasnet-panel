/**
 * MiniStepper Tests
 *
 * Unit and accessibility tests for the Mini Stepper mobile pattern.
 *
 * @see NAS-4A.18: Build Mini Stepper (Mobile Pattern)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';

import { MiniStepper } from './mini-stepper';
import { useStepper } from '../../hooks/use-stepper';

import type { StepConfig } from '../../hooks/use-stepper.types';

// Note: vitest-axe auto-extends expect with toHaveNoViolations

// ===== Test Fixtures =====

const mockSteps: StepConfig[] = [
  { id: 'step1', title: 'Choose Setup' },
  { id: 'step2', title: 'WAN Configuration' },
  { id: 'step3', title: 'LAN Configuration' },
];

const mockStepsWithValidation: StepConfig[] = [
  { id: 'step1', title: 'Choose Setup' },
  {
    id: 'step2',
    title: 'WAN Configuration',
    validate: async () => ({ valid: true }),
  },
  {
    id: 'step3',
    title: 'LAN Configuration',
    validate: async () => ({
      valid: false,
      errors: { ip: 'Invalid IP address' },
    }),
  },
];

// ===== Test Wrapper Component =====

function TestWrapper({
  steps = mockSteps,
  initialStep = 0,
  onStepChange,
  onComplete,
  disableSwipe = false,
}: {
  steps?: StepConfig[];
  initialStep?: number;
  onStepChange?: (step: StepConfig, index: number) => void;
  onComplete?: () => void;
  disableSwipe?: boolean;
}) {
  const stepper = useStepper({
    steps,
    initialStep,
    onComplete,
  });

  return (
    <MiniStepper
      stepper={stepper}
      stepContent={
        <div data-testid="step-content">Content for {stepper.currentStep.title}</div>
      }
      onStepChange={onStepChange}
      disableSwipe={disableSwipe}
    />
  );
}

// ===== Tests =====

describe('MiniStepper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render compact header with step indicator', () => {
      render(<TestWrapper />);

      expect(screen.getByText('Step 1/3')).toBeInTheDocument();
      expect(screen.getByText('Choose Setup')).toBeInTheDocument();
    });

    it('should render progress bar with correct value', () => {
      render(<TestWrapper />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should render step content', () => {
      render(<TestWrapper />);

      expect(screen.getByTestId('step-content')).toBeInTheDocument();
      expect(
        screen.getByText('Content for Choose Setup')
      ).toBeInTheDocument();
    });

    it('should render navigation buttons', () => {
      render(<TestWrapper />);

      expect(
        screen.getByRole('button', { name: /go to previous step/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /go to next step/i })
      ).toBeInTheDocument();
    });

    it('should render swipe hint when swipe is enabled', () => {
      render(<TestWrapper />);

      expect(
        screen.getByText('Swipe left/right to navigate')
      ).toBeInTheDocument();
    });

    it('should not render swipe hint when swipe is disabled', () => {
      render(<TestWrapper disableSwipe />);

      expect(
        screen.queryByText('Swipe left/right to navigate')
      ).not.toBeInTheDocument();
    });
  });

  describe('Navigation - First Step', () => {
    it('should disable back button on first step', () => {
      render(<TestWrapper />);

      const backButton = screen.getByRole('button', {
        name: /go to previous step/i,
      });
      expect(backButton).toBeDisabled();
    });

    it('should enable next button on first step', () => {
      render(<TestWrapper />);

      const nextButton = screen.getByRole('button', {
        name: /go to next step/i,
      });
      expect(nextButton).toBeEnabled();
    });

    it('should navigate to next step when next button is clicked', async () => {
      render(<TestWrapper />);

      const nextButton = screen.getByRole('button', {
        name: /go to next step/i,
      });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Step 2/3')).toBeInTheDocument();
        expect(screen.getByText('WAN Configuration')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation - Middle Step', () => {
    it('should enable both buttons on middle step', async () => {
      render(<TestWrapper initialStep={1} />);

      const backButton = screen.getByRole('button', {
        name: /go to previous step/i,
      });
      const nextButton = screen.getByRole('button', {
        name: /go to next step/i,
      });

      expect(backButton).toBeEnabled();
      expect(nextButton).toBeEnabled();
    });

    it('should navigate to previous step when back button is clicked', async () => {
      render(<TestWrapper initialStep={1} />);

      const backButton = screen.getByRole('button', {
        name: /go to previous step/i,
      });
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Step 1/3')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation - Last Step', () => {
    it('should show "Finish" button on last step', () => {
      render(<TestWrapper initialStep={2} />);

      expect(
        screen.getByRole('button', { name: /finish wizard/i })
      ).toBeInTheDocument();
      expect(screen.getByText('Finish')).toBeInTheDocument();
    });

    it('should call onComplete when finish is clicked on last step', async () => {
      const onComplete = vi.fn();
      render(<TestWrapper initialStep={2} onComplete={onComplete} />);

      const finishButton = screen.getByRole('button', {
        name: /finish wizard/i,
      });
      fireEvent.click(finishButton);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Step Change Callback', () => {
    it('should call onStepChange when navigating forward', async () => {
      const onStepChange = vi.fn();
      render(<TestWrapper onStepChange={onStepChange} />);

      const nextButton = screen.getByRole('button', {
        name: /go to next step/i,
      });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(onStepChange).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'step2', title: 'WAN Configuration' }),
          1
        );
      });
    });

    it('should call onStepChange when navigating backward', async () => {
      const onStepChange = vi.fn();
      render(<TestWrapper initialStep={1} onStepChange={onStepChange} />);

      const backButton = screen.getByRole('button', {
        name: /go to previous step/i,
      });
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(onStepChange).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'step1', title: 'Choose Setup' }),
          0
        );
      });
    });
  });

  describe('Validation', () => {
    it('should prevent navigation when validation fails', async () => {
      // Start at step 2 which has validation that will fail on step 3
      render(<TestWrapper steps={mockStepsWithValidation} initialStep={1} />);

      // Navigate to step 3 (should succeed)
      const nextButton = screen.getByRole('button', {
        name: /go to next step/i,
      });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Step 3/3')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<TestWrapper />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have aria-live region for step announcements', () => {
      render(<TestWrapper />);

      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('should have descriptive aria-labels on navigation buttons', () => {
      render(<TestWrapper />);

      expect(
        screen.getByRole('button', { name: /go to previous step/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /go to next step/i })
      ).toBeInTheDocument();
    });

    it('should update aria-label to "Finish wizard" on last step', () => {
      render(<TestWrapper initialStep={2} />);

      expect(
        screen.getByRole('button', { name: /finish wizard/i })
      ).toBeInTheDocument();
    });

    it('should have aria-label on progress bar', () => {
      render(<TestWrapper />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label');
    });
  });

  describe('Touch Targets', () => {
    it('should have minimum 44px touch targets for buttons', () => {
      render(<TestWrapper />);

      const backButton = screen.getByRole('button', {
        name: /go to previous step/i,
      });
      const nextButton = screen.getByRole('button', {
        name: /go to next step/i,
      });

      // Check for min-h-[44px] class
      expect(backButton.className).toContain('min-h-[44px]');
      expect(nextButton.className).toContain('min-h-[44px]');
    });
  });

  describe('Header Constraints', () => {
    it('should have header with max height constraint', () => {
      render(<TestWrapper />);

      const header = document.querySelector('header');
      expect(header).toHaveClass('max-h-16');
    });
  });
});
