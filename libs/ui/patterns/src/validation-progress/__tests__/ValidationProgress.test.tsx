/**
 * Tests for ValidationProgress components
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ValidationProgress, useValidationProgress } from '../ValidationProgress';
import { ValidationStage } from '../ValidationStage';

import type { ValidationStageResult, ValidationStageName } from '../types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ValidationStage', () => {
  const baseResult: ValidationStageResult = {
    stage: 'schema',
    status: 'pending',
    errors: [],
    warnings: [],
  };

  it('renders stage with pending status', () => {
    render(<ValidationStage result={baseResult} />);
    expect(screen.getByText('Schema')).toBeInTheDocument();
    expect(screen.getByText('Type and structure validation')).toBeInTheDocument();
  });

  it('renders stage with passed status', () => {
    render(<ValidationStage result={{ ...baseResult, status: 'passed', durationMs: 45 }} />);
    expect(screen.getByText('Schema')).toBeInTheDocument();
    expect(screen.getByText('45ms')).toBeInTheDocument();
  });

  it('renders stage with failed status and errors', () => {
    render(
      <ValidationStage
        result={{
          ...baseResult,
          status: 'failed',
          errors: [{ code: 'E001', message: 'Invalid format', fieldPath: 'email' }],
        }}
        isExpanded
      />
    );
    expect(screen.getByText('1 error')).toBeInTheDocument();
    expect(screen.getByText('Invalid format')).toBeInTheDocument();
    expect(screen.getByText(/Field:/)).toBeInTheDocument();
  });

  it('toggles expand/collapse on click', () => {
    const onToggle = vi.fn();
    render(
      <ValidationStage
        result={{
          ...baseResult,
          status: 'failed',
          errors: [{ code: 'E001', message: 'Error' }],
        }}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalled();
  });
});

describe('ValidationProgress', () => {
  it('renders all stages', () => {
    render(<ValidationProgress />);
    expect(screen.getByText('Schema')).toBeInTheDocument();
    expect(screen.getByText('Syntax')).toBeInTheDocument();
    expect(screen.getByText('Cross-Resource')).toBeInTheDocument();
    expect(screen.getByText('Dependencies')).toBeInTheDocument();
    expect(screen.getByText('Network')).toBeInTheDocument();
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Dry Run')).toBeInTheDocument();
  });

  it('shows "Ready to validate" when no stages running', () => {
    render(<ValidationProgress />);
    expect(screen.getByText('Ready to validate')).toBeInTheDocument();
  });

  it('shows "Validating..." when a stage is running', () => {
    const stages: ValidationStageResult[] = [
      { stage: 'schema', status: 'passed', errors: [], warnings: [] },
      { stage: 'syntax', status: 'running', errors: [], warnings: [] },
    ];
    render(<ValidationProgress stages={stages} />);
    expect(screen.getByText('Validating...')).toBeInTheDocument();
  });

  it('shows "Validation Passed" when complete and valid', () => {
    const stages: ValidationStageResult[] = [
      { stage: 'schema', status: 'passed', errors: [], warnings: [] },
      { stage: 'syntax', status: 'passed', errors: [], warnings: [] },
    ];
    render(
      <ValidationProgress
        stages={stages}
        isComplete
        isValid
      />
    );
    expect(screen.getByText('Validation Passed')).toBeInTheDocument();
  });

  it('shows "Validation Failed" when complete and invalid', () => {
    const stages: ValidationStageResult[] = [
      { stage: 'schema', status: 'passed', errors: [], warnings: [] },
      {
        stage: 'syntax',
        status: 'failed',
        errors: [{ code: 'E001', message: 'Error' }],
        warnings: [],
      },
    ];
    render(
      <ValidationProgress
        stages={stages}
        isComplete
        isValid={false}
      />
    );
    expect(screen.getByText('Validation Failed')).toBeInTheDocument();
  });

  it('shows only specified visible stages', () => {
    const visibleStages: ValidationStageName[] = ['schema', 'syntax'];
    render(<ValidationProgress visibleStages={visibleStages} />);

    expect(screen.getByText('Schema')).toBeInTheDocument();
    expect(screen.getByText('Syntax')).toBeInTheDocument();
    expect(screen.queryByText('Cross-Resource')).not.toBeInTheDocument();
    expect(screen.queryByText('Dry Run')).not.toBeInTheDocument();
  });

  it('shows total duration when complete', () => {
    render(
      <ValidationProgress
        isComplete
        isValid
        totalDurationMs={1250}
      />
    );
    expect(screen.getByText('1250ms')).toBeInTheDocument();
  });

  it('shows error summary when complete with errors', () => {
    const stages: ValidationStageResult[] = [
      {
        stage: 'schema',
        status: 'failed',
        errors: [
          { code: 'E001', message: 'Error 1' },
          { code: 'E002', message: 'Error 2' },
        ],
        warnings: [],
      },
    ];
    render(
      <ValidationProgress
        stages={stages}
        isComplete
        isValid={false}
      />
    );
    // Multiple elements may show the error count (stage badge + summary)
    expect(screen.getAllByText(/2 errors/).length).toBeGreaterThan(0);
  });
});

describe('useValidationProgress', () => {
  it('initializes with empty state', () => {
    const { result } = renderHook(() => useValidationProgress());

    expect(result.current.stages).toEqual([]);
    expect(result.current.currentStageIndex).toBe(-1);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.isValid).toBeUndefined();
  });

  // Note: More detailed hook tests would require @testing-library/react-hooks
});

// Helper to render hooks
function renderHook<T>(hook: () => T) {
  const result: { current: T } = { current: undefined as T };
  function HookWrapper() {
    result.current = hook();
    return null;
  }
  render(<HookWrapper />);
  return { result };
}
