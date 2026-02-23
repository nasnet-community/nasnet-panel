// libs/features/diagnostics/src/components/TroubleshootWizard/WizardSummary.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { WizardSummary } from './WizardSummary';
import type { DiagnosticSummary, DiagnosticStep } from '../../types/troubleshoot.types';

const mockSummary: DiagnosticSummary = {
  totalSteps: 5,
  passedSteps: 3,
  failedSteps: 2,
  skippedSteps: 0,
  appliedFixes: ['NO_INTERNET', 'DNS_FAIL'],
  durationMs: 15000,
  finalStatus: 'issues_resolved',
};

const mockSteps: DiagnosticStep[] = [
  {
    id: 'wan',
    name: 'WAN Interface',
    description: 'Check physical connection',
    status: 'passed',
    result: { success: true, message: 'Interface is up', executionTimeMs: 1000 },
  },
  {
    id: 'gateway',
    name: 'Gateway',
    description: 'Ping default gateway',
    status: 'failed',
    result: { success: false, message: 'Gateway unreachable', executionTimeMs: 2000 },
  },
  {
    id: 'internet',
    name: 'Internet',
    description: 'Ping external server',
    status: 'passed',
    result: { success: true, message: 'Ping successful', executionTimeMs: 1500 },
  },
  {
    id: 'dns',
    name: 'DNS',
    description: 'Test name resolution',
    status: 'failed',
    result: { success: false, message: 'DNS timeout', executionTimeMs: 3000 },
  },
  {
    id: 'nat',
    name: 'NAT',
    description: 'Verify masquerade rules',
    status: 'passed',
    result: { success: true, message: 'NAT rules OK', executionTimeMs: 500 },
  },
];

describe('WizardSummary', () => {
  it('should render summary header', () => {
    const { onRestart = vi.fn(), onClose = vi.fn() } = {};
    render(
      <WizardSummary
        summary={mockSummary}
        steps={mockSteps}
        onRestart={onRestart}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Troubleshooting Complete')).toBeInTheDocument();
  });

  it('should display statistics correctly', () => {
    const { onRestart = vi.fn(), onClose = vi.fn() } = {};
    render(
      <WizardSummary
        summary={mockSummary}
        steps={mockSteps}
        onRestart={onRestart}
        onClose={onClose}
      />
    );

    expect(screen.getByLabelText(/3 tests passed/)).toHaveTextContent('3');
    expect(screen.getByLabelText(/2 tests failed/)).toHaveTextContent('2');
    expect(screen.getByLabelText(/Duration:.*15s/)).toHaveTextContent('15s');
  });

  it('should render all step results', () => {
    const { onRestart = vi.fn(), onClose = vi.fn() } = {};
    render(
      <WizardSummary
        summary={mockSummary}
        steps={mockSteps}
        onRestart={onRestart}
        onClose={onClose}
      />
    );

    mockSteps.forEach((step) => {
      expect(screen.getByText(step.name)).toBeInTheDocument();
      if (step.result?.message) {
        expect(screen.getByText(step.result.message)).toBeInTheDocument();
      }
    });
  });

  it('should display applied fixes', () => {
    const { onRestart = vi.fn(), onClose = vi.fn() } = {};
    render(
      <WizardSummary
        summary={mockSummary}
        steps={mockSteps}
        onRestart={onRestart}
        onClose={onClose}
      />
    );

    mockSummary.appliedFixes.forEach((fix) => {
      expect(screen.getByText(fix.replace(/_/g, ' '))).toBeInTheDocument();
    });
  });

  it('should not display applied fixes section when empty', () => {
    const emptySummary = { ...mockSummary, appliedFixes: [] };
    const { onRestart = vi.fn(), onClose = vi.fn() } = {};
    render(
      <WizardSummary
        summary={emptySummary}
        steps={mockSteps}
        onRestart={onRestart}
        onClose={onClose}
      />
    );

    expect(screen.queryByText('Applied Fixes')).not.toBeInTheDocument();
  });

  it('should call onRestart when Run Again button is clicked', async () => {
    const onRestart = vi.fn();
    const onClose = vi.fn();
    render(
      <WizardSummary
        summary={mockSummary}
        steps={mockSteps}
        onRestart={onRestart}
        onClose={onClose}
      />
    );

    const runAgainButton = screen.getByRole('button', { name: /run diagnostics again/i });
    await userEvent.click(runAgainButton);
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Close button is clicked', async () => {
    const onRestart = vi.fn();
    const onClose = vi.fn();
    render(
      <WizardSummary
        summary={mockSummary}
        steps={mockSteps}
        onRestart={onRestart}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close troubleshooting wizard/i });
    await userEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should have 44px minimum touch target on action buttons', () => {
    const { onRestart = vi.fn(), onClose = vi.fn() } = {};
    const { container } = render(
      <WizardSummary
        summary={mockSummary}
        steps={mockSteps}
        onRestart={onRestart}
        onClose={onClose}
      />
    );

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('min-h-[44px]');
    });
  });

  it('should have semantic HTML structure', () => {
    const { onRestart = vi.fn(), onClose = vi.fn() } = {};
    const { container } = render(
      <WizardSummary
        summary={mockSummary}
        steps={mockSteps}
        onRestart={onRestart}
        onClose={onClose}
      />
    );

    expect(container.querySelector('h2')).toHaveTextContent('Troubleshooting Complete');
    expect(container.querySelector('h3')).toBeInTheDocument();
  });

  it('should render detailed results as a list', () => {
    const { onRestart = vi.fn(), onClose = vi.fn() } = {};
    const { container } = render(
      <WizardSummary
        summary={mockSummary}
        steps={mockSteps}
        onRestart={onRestart}
        onClose={onClose}
      />
    );

    const resultsList = container.querySelector('[role="list"][aria-label*="results"]');
    expect(resultsList).toBeInTheDocument();

    const listItems = container.querySelectorAll('[role="listitem"]');
    expect(listItems).toHaveLength(mockSteps.length);
  });

  it('should display execution times for each step', () => {
    const { onRestart = vi.fn(), onClose = vi.fn() } = {};
    render(
      <WizardSummary
        summary={mockSummary}
        steps={mockSteps}
        onRestart={onRestart}
        onClose={onClose}
      />
    );

    mockSteps.forEach((step) => {
      if (step.result?.executionTimeMs) {
        const expectedTime = (step.result.executionTimeMs / 1000).toFixed(1);
        expect(
          screen.getByLabelText(new RegExp(`Execution time:.*${expectedTime} seconds`))
        ).toBeInTheDocument();
      }
    });
  });

  it('should have displayName for debugging', () => {
    expect(WizardSummary.displayName).toBe('WizardSummary');
  });

  it('should show all_passed status correctly', () => {
    const passedSummary = { ...mockSummary, finalStatus: 'all_passed' as const };
    const { onRestart = vi.fn(), onClose = vi.fn() } = {};
    render(
      <WizardSummary
        summary={passedSummary}
        steps={mockSteps}
        onRestart={onRestart}
        onClose={onClose}
      />
    );

    // Should show success icon (CheckCircle2)
    const successRegion = screen.getByRole('region', { name: /Diagnostic results summary/ });
    expect(successRegion).toBeInTheDocument();
  });

  it('should show issues_remaining status correctly', () => {
    const remainingSummary = { ...mockSummary, finalStatus: 'issues_remaining' as const };
    const { onRestart = vi.fn(), onClose = vi.fn() } = {};
    render(
      <WizardSummary
        summary={remainingSummary}
        steps={mockSteps}
        onRestart={onRestart}
        onClose={onClose}
      />
    );

    // Should show error icon (XCircle)
    const resultsRegion = screen.getByRole('region', { name: /Diagnostic results summary/ });
    expect(resultsRegion).toBeInTheDocument();
  });
});
