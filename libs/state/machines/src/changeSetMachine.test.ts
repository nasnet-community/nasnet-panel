/**
 * Tests for Change Set Machine
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createActor } from 'xstate';

import type {
  ChangeSet,
  ChangeSetItem,
  ChangeSetValidationResult,
} from '@nasnet/core/types';

import {
  createChangeSetMachine,
  isChangeSetProcessing,
  isChangeSetFinal,
  isChangeSetCancellable,
  getChangeSetMachineStateDescription,
  type ChangeSetMachineConfig,
} from './changeSetMachine';

// Mock dependencies
vi.mock('@nasnet/core/utils', () => ({
  buildDependencyGraph: vi.fn((items: ChangeSetItem[]) =>
    new Map(items.map((item) => [item.id, { id: item.id, dependencies: item.dependencies }]))
  ),
  topologicalSort: vi.fn(() => ({
    success: true,
    sortedIds: [],
    error: null,
  })),
  reverseOrder: vi.fn((ids: string[]) => [...ids].reverse()),
}));

// ============================================================================
// Test Utilities
// ============================================================================

function createTestChangeSet(overrides?: Partial<ChangeSet>): ChangeSet {
  return {
    id: 'cs-1',
    name: 'Test Change Set',
    routerId: 'router-1',
    items: [
      createTestItem({ id: 'item-1', name: 'Bridge' }),
      createTestItem({ id: 'item-2', name: 'DHCP', dependencies: ['item-1'] }),
    ],
    status: 'DRAFT',
    validation: null,
    rollbackPlan: [],
    error: null,
    createdAt: new Date(),
    applyStartedAt: null,
    completedAt: null,
    source: 'test',
    version: 1,
    ...overrides,
  };
}

function createTestItem(overrides?: Partial<ChangeSetItem>): ChangeSetItem {
  return {
    id: 'test-item',
    name: 'Test Item',
    resourceType: 'test.resource',
    resourceCategory: 'NETWORKING',
    operation: 'CREATE',
    configuration: { name: 'test' },
    dependencies: [],
    status: 'PENDING',
    error: null,
    applyOrder: 0,
    applyStartedAt: null,
    applyCompletedAt: null,
    confirmedState: null,
    ...overrides,
  };
}

function createSuccessValidation(): ChangeSetValidationResult {
  return {
    canApply: true,
    errors: [],
    warnings: [],
    conflicts: [],
    missingDependencies: [],
    circularDependencies: null,
  };
}

function createFailedValidation(): ChangeSetValidationResult {
  return {
    canApply: false,
    errors: [
      {
        itemId: 'item-1',
        field: 'name',
        message: 'Name is required',
        severity: 'ERROR',
        code: 'REQUIRED',
      },
    ],
    warnings: [],
    conflicts: [],
    missingDependencies: [],
    circularDependencies: null,
  };
}

function createMachineConfig(overrides?: Partial<ChangeSetMachineConfig>): ChangeSetMachineConfig {
  return {
    validateChangeSet: vi.fn().mockResolvedValue(createSuccessValidation()),
    applyItem: vi.fn().mockResolvedValue({
      confirmedState: { id: 'created-id' },
      resourceUuid: 'uuid-123',
    }),
    rollbackItem: vi.fn().mockResolvedValue(undefined),
    onValidationComplete: vi.fn(),
    onProgress: vi.fn(),
    onComplete: vi.fn(),
    onFailed: vi.fn(),
    onRolledBack: vi.fn(),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('createChangeSetMachine', () => {
  describe('Initial State', () => {
    it('should start in idle state', () => {
      const config = createMachineConfig();
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);
      actor.start();

      expect(actor.getSnapshot().value).toBe('idle');

      actor.stop();
    });

    it('should have empty initial context', () => {
      const config = createMachineConfig();
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);
      actor.start();

      const context = actor.getSnapshot().context;
      expect(context.changeSet).toBe(null);
      expect(context.routerId).toBe(null);
      expect(context.sortedItems).toHaveLength(0);
      expect(context.appliedItems).toHaveLength(0);
      expect(context.error).toBe(null);

      actor.stop();
    });
  });

  describe('LOAD Event', () => {
    it('should load change set and stay in idle', () => {
      const config = createMachineConfig();
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);
      actor.start();

      const changeSet = createTestChangeSet();
      actor.send({ type: 'LOAD', changeSet, routerId: 'router-1' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('idle');
      expect(snapshot.context.changeSet?.id).toBe('cs-1');
      expect(snapshot.context.routerId).toBe('router-1');

      actor.stop();
    });
  });

  describe('Validation Flow', () => {
    it('should transition to validating on START_VALIDATION', async () => {
      const config = createMachineConfig();
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);
      actor.start();

      const changeSet = createTestChangeSet();
      actor.send({ type: 'LOAD', changeSet, routerId: 'router-1' });
      actor.send({ type: 'START_VALIDATION' });

      // Should be validating
      expect(actor.getSnapshot().value).toBe('validating');

      actor.stop();
    });

    it('should transition to ready on successful validation', async () => {
      const validateFn = vi.fn().mockResolvedValue(createSuccessValidation());
      const config = createMachineConfig({ validateChangeSet: validateFn });
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);

      const changeSet = createTestChangeSet();
      actor.start();
      actor.send({ type: 'LOAD', changeSet, routerId: 'router-1' });
      actor.send({ type: 'START_VALIDATION' });

      // Wait for validation to complete
      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('ready');
      });

      expect(actor.getSnapshot().context.validationResult?.canApply).toBe(true);

      actor.stop();
    });

    it('should stay in idle with error on failed validation', async () => {
      const validateFn = vi.fn().mockResolvedValue(createFailedValidation());
      const config = createMachineConfig({ validateChangeSet: validateFn });
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);

      const changeSet = createTestChangeSet();
      actor.start();
      actor.send({ type: 'LOAD', changeSet, routerId: 'router-1' });
      actor.send({ type: 'START_VALIDATION' });

      // Wait for validation to complete - should go back to idle
      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('idle');
      });

      expect(actor.getSnapshot().context.validationResult?.canApply).toBe(false);
      expect(actor.getSnapshot().context.errorMessage).toContain('Validation failed');

      actor.stop();
    });

    it('should call onValidationComplete callback', async () => {
      const onValidationComplete = vi.fn();
      const config = createMachineConfig({ onValidationComplete });
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);

      const changeSet = createTestChangeSet();
      actor.start();
      actor.send({ type: 'LOAD', changeSet, routerId: 'router-1' });
      actor.send({ type: 'START_VALIDATION' });

      await vi.waitFor(() => {
        expect(onValidationComplete).toHaveBeenCalled();
      });

      actor.stop();
    });
  });

  describe('Apply Flow', () => {
    it('should transition to applying on APPLY from ready state', async () => {
      const config = createMachineConfig();
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);

      const changeSet = createTestChangeSet();
      actor.start();
      actor.send({ type: 'LOAD', changeSet, routerId: 'router-1' });
      actor.send({ type: 'START_VALIDATION' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('ready');
      });

      actor.send({ type: 'APPLY' });

      // Should be in applying state (nested state)
      expect(actor.getSnapshot().value).toEqual({ applying: 'applyingItem' });

      actor.stop();
    });

    it('should apply items and transition to completed', async () => {
      const applyFn = vi.fn().mockResolvedValue({
        confirmedState: { id: 'created' },
        resourceUuid: 'uuid-123',
      });
      const onComplete = vi.fn();
      const config = createMachineConfig({ applyItem: applyFn, onComplete });
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);

      // Create change set with single item for simpler test
      const changeSet = createTestChangeSet({
        items: [createTestItem({ id: 'item-1', name: 'Single Item' })],
      });

      actor.start();
      actor.send({ type: 'LOAD', changeSet, routerId: 'router-1' });
      actor.send({ type: 'START_VALIDATION' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('ready');
      });

      actor.send({ type: 'APPLY' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('completed');
      });

      expect(applyFn).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
      expect(actor.getSnapshot().context.appliedItems).toHaveLength(1);

      actor.stop();
    });

    it('should track applied items in context', async () => {
      const applyFn = vi.fn().mockResolvedValue({
        confirmedState: { name: 'created-resource' },
        resourceUuid: 'uuid-456',
      });
      const config = createMachineConfig({ applyItem: applyFn });
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);

      const changeSet = createTestChangeSet({
        items: [createTestItem({ id: 'item-1' })],
      });

      actor.start();
      actor.send({ type: 'LOAD', changeSet, routerId: 'router-1' });
      actor.send({ type: 'START_VALIDATION' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('ready');
      });

      actor.send({ type: 'APPLY' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('completed');
      });

      const context = actor.getSnapshot().context;
      expect(context.appliedItems).toHaveLength(1);
      expect(context.appliedItems[0].confirmedState).toEqual({ name: 'created-resource' });

      actor.stop();
    });
  });

  describe('Error Handling and Rollback', () => {
    it('should transition to rollingBack on apply error', async () => {
      const applyFn = vi.fn().mockRejectedValue(new Error('Network error'));
      const config = createMachineConfig({ applyItem: applyFn });
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);

      const changeSet = createTestChangeSet({
        items: [createTestItem({ id: 'item-1' })],
      });

      actor.start();
      actor.send({ type: 'LOAD', changeSet, routerId: 'router-1' });
      actor.send({ type: 'START_VALIDATION' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('ready');
      });

      actor.send({ type: 'APPLY' });

      await vi.waitFor(() => {
        // Should be in rollingBack or rolledBack state
        const value = actor.getSnapshot().value;
        expect(['rollingBack', 'rolledBack'].includes(value as string)).toBe(true);
      });

      expect(actor.getSnapshot().context.error).not.toBe(null);
      expect(actor.getSnapshot().context.error?.message).toBe('Network error');

      actor.stop();
    });

    it('should set error details correctly', async () => {
      const applyFn = vi.fn()
        .mockResolvedValueOnce({ confirmedState: {}, resourceUuid: 'uuid-1' })
        .mockRejectedValueOnce(new Error('Second item failed'));

      const config = createMachineConfig({ applyItem: applyFn });
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);

      const changeSet = createTestChangeSet({
        items: [
          createTestItem({ id: 'item-1', name: 'First' }),
          createTestItem({ id: 'item-2', name: 'Second' }),
        ],
      });

      actor.start();
      actor.send({ type: 'LOAD', changeSet, routerId: 'router-1' });
      actor.send({ type: 'START_VALIDATION' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('ready');
      });

      actor.send({ type: 'APPLY' });

      await vi.waitFor(() => {
        const value = actor.getSnapshot().value;
        return ['rollingBack', 'rolledBack', 'partialFailure'].includes(value as string);
      });

      const error = actor.getSnapshot().context.error;
      expect(error?.partiallyAppliedItemIds).toContain('item-1');
      expect(error?.message).toBe('Second item failed');

      actor.stop();
    });

    it('should transition to rolledBack after successful rollback', async () => {
      const applyFn = vi.fn().mockRejectedValue(new Error('Apply failed'));
      const rollbackFn = vi.fn().mockResolvedValue(undefined);
      const onRolledBack = vi.fn();

      const config = createMachineConfig({
        applyItem: applyFn,
        rollbackItem: rollbackFn,
        onRolledBack,
      });
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);

      const changeSet = createTestChangeSet({
        items: [createTestItem({ id: 'item-1' })],
      });

      actor.start();
      actor.send({ type: 'LOAD', changeSet, routerId: 'router-1' });
      actor.send({ type: 'START_VALIDATION' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('ready');
      });

      actor.send({ type: 'APPLY' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('rolledBack');
      });

      expect(onRolledBack).toHaveBeenCalled();

      actor.stop();
    });
  });

  describe('Cancellation', () => {
    it('should transition to cancelled from validating', async () => {
      // Create a slow validation that we can cancel
      const validateFn = vi.fn().mockImplementation(() =>
        new Promise((resolve) => setTimeout(() => resolve(createSuccessValidation()), 1000))
      );
      const config = createMachineConfig({ validateChangeSet: validateFn });
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);

      const changeSet = createTestChangeSet();
      actor.start();
      actor.send({ type: 'LOAD', changeSet, routerId: 'router-1' });
      actor.send({ type: 'START_VALIDATION' });

      // Cancel immediately
      actor.send({ type: 'CANCEL' });

      expect(actor.getSnapshot().value).toBe('cancelled');

      actor.stop();
    });

    it('should transition to cancelled from ready', async () => {
      const config = createMachineConfig();
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);

      const changeSet = createTestChangeSet();
      actor.start();
      actor.send({ type: 'LOAD', changeSet, routerId: 'router-1' });
      actor.send({ type: 'START_VALIDATION' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('ready');
      });

      actor.send({ type: 'CANCEL' });

      expect(actor.getSnapshot().value).toBe('cancelled');

      actor.stop();
    });
  });

  describe('Reset', () => {
    it('should reset to idle state', async () => {
      const config = createMachineConfig();
      const machine = createChangeSetMachine(config);
      const actor = createActor(machine);

      const changeSet = createTestChangeSet();
      actor.start();
      actor.send({ type: 'LOAD', changeSet, routerId: 'router-1' });
      actor.send({ type: 'START_VALIDATION' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('ready');
      });

      actor.send({ type: 'RESET' });

      const context = actor.getSnapshot().context;
      expect(actor.getSnapshot().value).toBe('idle');
      expect(context.changeSet).toBe(null);
      expect(context.routerId).toBe(null);
      expect(context.sortedItems).toHaveLength(0);

      actor.stop();
    });
  });
});

describe('State Helper Functions', () => {
  describe('isChangeSetProcessing', () => {
    it('should return true for validating state', () => {
      expect(isChangeSetProcessing('validating')).toBe(true);
    });

    it('should return true for rollingBack state', () => {
      expect(isChangeSetProcessing('rollingBack')).toBe(true);
    });

    it('should return true for applying state (object)', () => {
      expect(isChangeSetProcessing({ applying: 'applyingItem' })).toBe(true);
    });

    it('should return false for idle state', () => {
      expect(isChangeSetProcessing('idle')).toBe(false);
    });

    it('should return false for ready state', () => {
      expect(isChangeSetProcessing('ready')).toBe(false);
    });
  });

  describe('isChangeSetFinal', () => {
    it('should return true for completed state', () => {
      expect(isChangeSetFinal('completed')).toBe(true);
    });

    it('should return true for rolledBack state', () => {
      expect(isChangeSetFinal('rolledBack')).toBe(true);
    });

    it('should return true for failed state', () => {
      expect(isChangeSetFinal('failed')).toBe(true);
    });

    it('should return true for partialFailure state', () => {
      expect(isChangeSetFinal('partialFailure')).toBe(true);
    });

    it('should return true for cancelled state', () => {
      expect(isChangeSetFinal('cancelled')).toBe(true);
    });

    it('should return false for applying state (object)', () => {
      expect(isChangeSetFinal({ applying: 'applyingItem' })).toBe(false);
    });

    it('should return false for idle state', () => {
      expect(isChangeSetFinal('idle')).toBe(false);
    });
  });

  describe('isChangeSetCancellable', () => {
    it('should return true for validating state', () => {
      expect(isChangeSetCancellable('validating')).toBe(true);
    });

    it('should return true for ready state', () => {
      expect(isChangeSetCancellable('ready')).toBe(true);
    });

    it('should return true for applying state (object)', () => {
      expect(isChangeSetCancellable({ applying: 'applyingItem' })).toBe(true);
    });

    it('should return false for idle state', () => {
      expect(isChangeSetCancellable('idle')).toBe(false);
    });

    it('should return false for completed state', () => {
      expect(isChangeSetCancellable('completed')).toBe(false);
    });
  });

  describe('getChangeSetMachineStateDescription', () => {
    it('should return correct description for idle', () => {
      expect(getChangeSetMachineStateDescription('idle')).toBe('Ready');
    });

    it('should return correct description for validating', () => {
      expect(getChangeSetMachineStateDescription('validating')).toBe('Validating changes...');
    });

    it('should return correct description for ready', () => {
      expect(getChangeSetMachineStateDescription('ready')).toBe('Ready to apply');
    });

    it('should return correct description for applying', () => {
      expect(getChangeSetMachineStateDescription({ applying: 'applyingItem' })).toBe(
        'Applying changes...'
      );
    });

    it('should return correct description for completed', () => {
      expect(getChangeSetMachineStateDescription('completed')).toBe('Changes applied');
    });

    it('should return correct description for rolledBack', () => {
      expect(getChangeSetMachineStateDescription('rolledBack')).toBe('Changes rolled back');
    });

    it('should return correct description for failed', () => {
      expect(getChangeSetMachineStateDescription('failed')).toBe('Apply failed');
    });

    it('should return correct description for partialFailure', () => {
      expect(getChangeSetMachineStateDescription('partialFailure')).toBe(
        'Rollback partially failed'
      );
    });

    it('should return correct description for cancelled', () => {
      expect(getChangeSetMachineStateDescription('cancelled')).toBe('Cancelled');
    });

    it('should return Unknown for unknown state', () => {
      expect(getChangeSetMachineStateDescription('unknown-state')).toBe('Unknown');
    });
  });
});
