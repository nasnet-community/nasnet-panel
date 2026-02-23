// libs/features/diagnostics/src/components/TroubleshootWizard/StepAnnouncer.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StepAnnouncer } from './StepAnnouncer';
import type { DiagnosticStep } from '../../types/troubleshoot.types';

const mockStep: DiagnosticStep = {
  id: 'wan',
  name: 'WAN Interface',
  description: 'Check physical connection',
  status: 'pending',
};

const mockStepRunning: DiagnosticStep = {
  id: 'wan',
  name: 'WAN Interface',
  description: 'Check physical connection',
  status: 'running',
};

const mockStepPassed: DiagnosticStep = {
  id: 'wan',
  name: 'WAN Interface',
  description: 'Check physical connection',
  status: 'passed',
  result: {
    success: true,
    message: 'WAN interface is up',
    executionTimeMs: 1000,
  },
};

const mockStepFailed: DiagnosticStep = {
  id: 'wan',
  name: 'WAN Interface',
  description: 'Check physical connection',
  status: 'failed',
  result: {
    success: false,
    message: 'WAN interface is down',
    executionTimeMs: 500,
  },
};

describe('StepAnnouncer', () => {
  it('should render as an ARIA live region', () => {
    const { container } = render(
      <StepAnnouncer
        currentStep={mockStep}
        currentStepIndex={0}
        totalSteps={5}
        isApplyingFix={false}
        isVerifying={false}
        isCompleted={false}
      />
    );

    const liveRegion = container.querySelector('[role="status"]');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('should be hidden from visual display (sr-only)', () => {
    const { container } = render(
      <StepAnnouncer
        currentStep={mockStep}
        currentStepIndex={0}
        totalSteps={5}
        isApplyingFix={false}
        isVerifying={false}
        isCompleted={false}
      />
    );

    const liveRegion = container.querySelector('[role="status"]');
    expect(liveRegion).toHaveClass('sr-only');
  });

  it('should announce when step starts running', () => {
    const { rerender } = render(
      <StepAnnouncer
        currentStep={mockStep}
        currentStepIndex={0}
        totalSteps={5}
        isApplyingFix={false}
        isVerifying={false}
        isCompleted={false}
      />
    );

    rerender(
      <StepAnnouncer
        currentStep={mockStepRunning}
        currentStepIndex={0}
        totalSteps={5}
        isApplyingFix={false}
        isVerifying={false}
        isCompleted={false}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent(/running/i);
  });

  it('should announce when step passes', () => {
    const { rerender } = render(
      <StepAnnouncer
        currentStep={mockStep}
        currentStepIndex={0}
        totalSteps={5}
        isApplyingFix={false}
        isVerifying={false}
        isCompleted={false}
      />
    );

    rerender(
      <StepAnnouncer
        currentStep={mockStepPassed}
        currentStepIndex={0}
        totalSteps={5}
        isApplyingFix={false}
        isVerifying={false}
        isCompleted={false}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent(/passed|up/i);
  });

  it('should announce when step fails', () => {
    const { rerender } = render(
      <StepAnnouncer
        currentStep={mockStep}
        currentStepIndex={0}
        totalSteps={5}
        isApplyingFix={false}
        isVerifying={false}
        isCompleted={false}
      />
    );

    rerender(
      <StepAnnouncer
        currentStep={mockStepFailed}
        currentStepIndex={0}
        totalSteps={5}
        isApplyingFix={false}
        isVerifying={false}
        isCompleted={false}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent(/failed|down/i);
  });

  it('should announce when applying fix', () => {
    const { rerender } = render(
      <StepAnnouncer
        currentStep={mockStepFailed}
        currentStepIndex={0}
        totalSteps={5}
        isApplyingFix={false}
        isVerifying={false}
        isCompleted={false}
      />
    );

    rerender(
      <StepAnnouncer
        currentStep={mockStepFailed}
        currentStepIndex={0}
        totalSteps={5}
        isApplyingFix={true}
        isVerifying={false}
        isCompleted={false}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent(/applying|fix/i);
  });

  it('should announce when wizard is completed', () => {
    const { rerender } = render(
      <StepAnnouncer
        currentStep={mockStepPassed}
        currentStepIndex={4}
        totalSteps={5}
        isApplyingFix={false}
        isVerifying={false}
        isCompleted={false}
      />
    );

    rerender(
      <StepAnnouncer
        currentStep={mockStepPassed}
        currentStepIndex={4}
        totalSteps={5}
        isApplyingFix={false}
        isVerifying={false}
        isCompleted={true}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent(/complete/i);
  });

  it('should have displayName for debugging', () => {
    expect(StepAnnouncer.displayName).toBe('StepAnnouncer');
  });
});
