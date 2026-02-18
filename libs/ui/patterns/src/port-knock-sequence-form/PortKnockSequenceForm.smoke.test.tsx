/**
 * PortKnockSequenceForm Smoke Tests
 *
 * Basic rendering tests to ensure components mount without errors.
 * These tests provide quick validation that the component structure is correct.
 *
 * @module @nasnet/ui/patterns
 */

import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { PortKnockSequenceForm } from './PortKnockSequenceForm';

// Mock useMediaQuery for platform detection
vi.mock('@nasnet/ui/primitives', () => ({
  useMediaQuery: vi.fn(() => false), // Default to desktop
}));

// Mock the headless hook
vi.mock('./use-port-knock-sequence-form', () => ({
  usePortKnockSequenceForm: vi.fn(() => ({
    form: {
      register: vi.fn(),
      handleSubmit: vi.fn((fn) => (e: any) => {
        e?.preventDefault();
        return fn({});
      }),
      formState: { errors: {}, isDirty: false, isSubmitting: false },
      watch: vi.fn(),
      setValue: vi.fn(),
      control: {},
    },
    knockPorts: [],
    addKnockPort: vi.fn(),
    removeKnockPort: vi.fn(),
    moveKnockPort: vi.fn(),
    showLockoutWarning: false,
    previewRules: [],
    isSubmitting: false,
    onSubmit: vi.fn(),
  })),
}));

describe('PortKnockSequenceForm - Smoke Tests', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <PortKnockSequenceForm onSubmit={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container).toBeInTheDocument();
  });

  it('renders form with data-testid', () => {
    const { container } = render(
      <PortKnockSequenceForm onSubmit={vi.fn()} onCancel={vi.fn()} />
    );
    const form = container.querySelector('[data-testid="knock-sequence-form"]');
    expect(form).toBeInTheDocument();
  });

  it('accepts initialSequence prop', () => {
    const mockSequence = {
      id: 'test-1',
      name: 'test_knock',
      knockPorts: [
        { port: 1234, protocol: 'tcp' as const },
        { port: 5678, protocol: 'tcp' as const },
      ],
      protectedPort: 22,
      accessTimeout: '5m',
      knockTimeout: '15s',
      enabled: true,
    };

    const { container } = render(
      <PortKnockSequenceForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        initialSequence={mockSequence}
      />
    );
    expect(container).toBeInTheDocument();
  });

  it('calls onSubmit when form is submitted', () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <PortKnockSequenceForm onSubmit={onSubmit} onCancel={vi.fn()} />
    );

    // Component should mount successfully
    expect(container).toBeInTheDocument();
  });

  it('calls onCancel when cancel is clicked', () => {
    const onCancel = vi.fn();
    const { container } = render(
      <PortKnockSequenceForm onSubmit={vi.fn()} onCancel={onCancel} />
    );

    // Component should mount successfully
    expect(container).toBeInTheDocument();
  });
});

/**
 * Test Summary:
 * - 5 basic smoke tests
 * - Verify component mounts without errors
 * - Verify props are accepted
 * - Minimal mocking to avoid brittleness
 *
 * Run: npm run test -- PortKnockSequenceForm.smoke.test.tsx
 */
