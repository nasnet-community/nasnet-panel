/**
 * Wizard Machine Tests
 *
 * @see NAS-4.6: Implement Complex Flows with XState
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createActor } from 'xstate';

import { createWizardMachine } from '../wizardMachine';

// Test data type
interface TestWizardData extends Record<string, unknown> {
  name: string;
  email: string;
  age: number;
}

// Test configuration factory
function createTestMachine(
  overrides: Partial<{
    validateStep: (
      step: number,
      data: Partial<TestWizardData>
    ) => Promise<{ valid: boolean; errors?: Record<string, string> }>;
    onSubmit: (data: TestWizardData) => Promise<void>;
  }> = {}
) {
  return createWizardMachine<TestWizardData>({
    id: 'test-wizard',
    totalSteps: 3,
    validateStep: overrides.validateStep ?? (async () => ({ valid: true })),
    onSubmit: overrides.onSubmit ?? (async () => {}),
  });
}

describe('Wizard Machine', () => {
  describe('Initial State', () => {
    it('should start at step 1', () => {
      const machine = createTestMachine();
      const actor = createActor(machine, {});
      actor.start();

      expect(actor.getSnapshot().context.currentStep).toBe(1);
    });

    it('should start in step state', () => {
      const machine = createTestMachine();
      const actor = createActor(machine, {});
      actor.start();

      expect(actor.getSnapshot().matches('step')).toBe(true);
    });

    it('should have empty data initially', () => {
      const machine = createTestMachine();
      const actor = createActor(machine, {});
      actor.start();

      expect(actor.getSnapshot().context.data).toEqual({});
    });

    it('should have empty errors initially', () => {
      const machine = createTestMachine();
      const actor = createActor(machine, {});
      actor.start();

      expect(actor.getSnapshot().context.errors).toEqual({});
    });

    it('should have a session ID', () => {
      const machine = createTestMachine();
      const actor = createActor(machine, {});
      actor.start();

      expect(actor.getSnapshot().context.sessionId).toBeDefined();
      expect(typeof actor.getSnapshot().context.sessionId).toBe('string');
    });
  });

  describe('Navigation - Back', () => {
    it('should prevent going back from step 1', () => {
      const machine = createTestMachine();
      const actor = createActor(machine, {});
      actor.start();

      actor.send({ type: 'BACK' });

      expect(actor.getSnapshot().context.currentStep).toBe(1);
    });

    it('should go back from step 2 to step 1', async () => {
      const machine = createTestMachine();
      const actor = createActor(machine, {});
      actor.start();

      // Advance to step 2
      actor.send({ type: 'NEXT', data: { name: 'Test' } });

      // Wait for validation
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Go back
      actor.send({ type: 'BACK' });

      expect(actor.getSnapshot().context.currentStep).toBe(1);
    });

    it('should preserve data when going back', async () => {
      const machine = createTestMachine();
      const actor = createActor(machine, {});
      actor.start();

      // Set data and advance
      actor.send({ type: 'NEXT', data: { name: 'Test User' } });

      // Wait for validation
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Go back
      actor.send({ type: 'BACK' });

      // Data should still be there
      expect(actor.getSnapshot().context.data.name).toBe('Test User');
    });
  });

  describe('Navigation - Next', () => {
    it('should transition to validating on NEXT', () => {
      const machine = createTestMachine();
      const actor = createActor(machine, {});
      actor.start();

      actor.send({ type: 'NEXT', data: { name: 'Test' } });

      expect(actor.getSnapshot().matches('validating')).toBe(true);
    });

    it('should merge data on NEXT', () => {
      const machine = createTestMachine();
      const actor = createActor(machine, {});
      actor.start();

      actor.send({ type: 'NEXT', data: { name: 'Test' } });

      expect(actor.getSnapshot().context.data.name).toBe('Test');
    });

    it('should advance step on successful validation', async () => {
      const validateStep = vi.fn().mockResolvedValue({ valid: true });
      const machine = createTestMachine({ validateStep });
      const actor = createActor(machine, {});
      actor.start();

      actor.send({ type: 'NEXT', data: { name: 'Test' } });

      // Wait for validation to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(actor.getSnapshot().context.currentStep).toBe(2);
    });

    it('should call validateStep with correct arguments', async () => {
      const validateStep = vi.fn().mockResolvedValue({ valid: true });
      const machine = createTestMachine({ validateStep });
      const actor = createActor(machine, {});
      actor.start();

      actor.send({ type: 'NEXT', data: { name: 'Test' } });

      // Wait for validation
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(validateStep).toHaveBeenCalledWith(1, { name: 'Test' });
    });
  });

  describe('Validation Failure', () => {
    it('should stay on current step when validation fails', async () => {
      const validateStep = vi.fn().mockResolvedValue({
        valid: false,
        errors: { name: 'Name is required' },
      });
      const machine = createTestMachine({ validateStep });
      const actor = createActor(machine, {});
      actor.start();

      actor.send({ type: 'NEXT' });

      // Wait for validation
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(actor.getSnapshot().context.currentStep).toBe(1);
      expect(actor.getSnapshot().matches('step')).toBe(true);
    });

    it('should set errors when validation fails', async () => {
      const validateStep = vi.fn().mockResolvedValue({
        valid: false,
        errors: { name: 'Name is required' },
      });
      const machine = createTestMachine({ validateStep });
      const actor = createActor(machine, {});
      actor.start();

      actor.send({ type: 'NEXT' });

      // Wait for validation
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(actor.getSnapshot().context.errors).toEqual({ name: 'Name is required' });
    });
  });

  describe('Data Management', () => {
    it('should set data without advancing via SET_DATA', () => {
      const machine = createTestMachine();
      const actor = createActor(machine, {});
      actor.start();

      actor.send({ type: 'SET_DATA', data: { email: 'test@example.com' } });

      expect(actor.getSnapshot().context.data.email).toBe('test@example.com');
      expect(actor.getSnapshot().context.currentStep).toBe(1);
    });

    it('should merge multiple data updates', () => {
      const machine = createTestMachine();
      const actor = createActor(machine, {});
      actor.start();

      actor.send({ type: 'SET_DATA', data: { name: 'Test' } });
      actor.send({ type: 'SET_DATA', data: { email: 'test@example.com' } });

      expect(actor.getSnapshot().context.data).toEqual({
        name: 'Test',
        email: 'test@example.com',
      });
    });
  });

  describe('Error Clearing', () => {
    it('should clear errors via CLEAR_ERRORS', async () => {
      const validateStep = vi.fn().mockResolvedValue({
        valid: false,
        errors: { name: 'Required' },
      });
      const machine = createTestMachine({ validateStep });
      const actor = createActor(machine, {});
      actor.start();

      actor.send({ type: 'NEXT' });

      // Wait for validation
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Clear errors
      actor.send({ type: 'CLEAR_ERRORS' });

      expect(actor.getSnapshot().context.errors).toEqual({});
    });
  });

  describe('Cancellation', () => {
    it('should transition to cancelled state on CANCEL', () => {
      const machine = createTestMachine();
      const actor = createActor(machine, {});
      actor.start();

      actor.send({ type: 'CANCEL' });

      expect(actor.getSnapshot().matches('cancelled')).toBe(true);
    });

    it('should be a final state', () => {
      const machine = createTestMachine();
      const actor = createActor(machine, {});
      actor.start();

      actor.send({ type: 'CANCEL' });

      expect(actor.getSnapshot().status).toBe('done');
    });
  });

  describe('Submission', () => {
    it('should call onSubmit when completing last step', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const machine = createWizardMachine<TestWizardData>({
        id: 'test',
        totalSteps: 1, // Single step wizard
        validateStep: async () => ({ valid: true }),
        onSubmit,
      });
      const actor = createActor(machine, {});
      actor.start();

      actor.send({ type: 'NEXT', data: { name: 'Test', email: 'test@test.com', age: 25 } });

      // Wait for validation and submission
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onSubmit).toHaveBeenCalled();
    });

    it('should transition to completed after successful submission', async () => {
      const machine = createWizardMachine<TestWizardData>({
        id: 'test',
        totalSteps: 1,
        validateStep: async () => ({ valid: true }),
        onSubmit: async () => {},
      });
      const actor = createActor(machine, {});
      actor.start();

      actor.send({ type: 'NEXT', data: { name: 'Test', email: 'test@test.com', age: 25 } });

      // Wait for completion
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(actor.getSnapshot().matches('completed')).toBe(true);
    });
  });

  describe('Session Restoration', () => {
    it('should restore context from saved state', () => {
      const machine = createTestMachine();
      const actor = createActor(machine, {});
      actor.start();

      const savedContext = {
        currentStep: 2,
        totalSteps: 3,
        data: { name: 'Saved User' },
        errors: {},
        sessionId: 'saved-session-123',
      };

      actor.send({ type: 'RESTORE', savedContext });

      expect(actor.getSnapshot().context.currentStep).toBe(2);
      expect(actor.getSnapshot().context.data.name).toBe('Saved User');
      expect(actor.getSnapshot().context.sessionId).toBe('saved-session-123');
    });
  });
});
