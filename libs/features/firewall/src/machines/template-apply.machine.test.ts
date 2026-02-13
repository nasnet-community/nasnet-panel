/**
 * Unit Tests for Template Apply Machine (XState)
 *
 * Tests state transitions, guards, actions, and error handling for the template application flow.
 *
 * Coverage:
 * - State transitions (idle → configuring → previewing → reviewing → applying → success/error)
 * - Guards (validation, conflicts, risk assessment, rollback availability)
 * - Actions (store data, callbacks, error handling)
 * - Safety flow (high-risk confirmation, rollback)
 * - Edge cases and error recovery
 *
 * @see libs/features/firewall/src/machines/template-apply.machine.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createActor, waitFor as xstateWaitFor } from 'xstate';
import {
  createTemplateApplyMachine,
  type TemplateApplyConfig,
  type TemplateApplyContext,
  isTemplateFinal,
  isTemplateCancellable,
  isTemplateProcessing,
  getTemplateStateDescription,
} from './template-apply.machine';
import {
  mockBasicSecurityTemplate,
  mockHomeNetworkTemplate,
  mockPreviewResult,
  mockPreviewResultWithConflicts,
  mockSuccessfulApplyResult,
  mockPartialFailureResult,
  mockHighImpactAnalysis,
  generateMockVariables,
} from '../../__test-utils__/firewall-templates/template-fixtures';
import type { TemplatePreviewResult, FirewallTemplateResult } from '../schemas/templateSchemas';

describe('Template Apply Machine', () => {
  let mockConfig: TemplateApplyConfig;

  beforeEach(() => {
    mockConfig = {
      previewTemplate: vi.fn().mockResolvedValue(mockPreviewResult),
      applyTemplate: vi.fn().mockResolvedValue(mockSuccessfulApplyResult),
      executeRollback: vi.fn().mockResolvedValue(undefined),
      onSuccess: vi.fn(),
      onRollback: vi.fn(),
      onError: vi.fn(),
    };
  });

  describe('Initial State', () => {
    it('should start in idle state', () => {
      const machine = createTemplateApplyMachine(mockConfig);
      const actor = createActor(machine);
      actor.start();

      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('should initialize context correctly', () => {
      const machine = createTemplateApplyMachine(mockConfig);
      const actor = createActor(machine);
      actor.start();

      const context = actor.getSnapshot().context;
      expect(context.routerId).toBeNull();
      expect(context.template).toBeNull();
      expect(context.variables).toEqual({});
      expect(context.validationErrors).toEqual([]);
      expect(context.previewResult).toBeNull();
      expect(context.applyResult).toBeNull();
      expect(context.applyStartedAt).toBeNull();
      expect(context.errorMessage).toBeNull();
    });
  });

  describe('State Transitions - Happy Path', () => {
    it('should transition from idle to configuring on SELECT_TEMPLATE', () => {
      const machine = createTemplateApplyMachine(mockConfig);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      expect(actor.getSnapshot().value).toBe('configuring');
      expect(actor.getSnapshot().context.template).toEqual(mockBasicSecurityTemplate);
      expect(actor.getSnapshot().context.routerId).toBe('router-1');
    });

    it('should update variables in configuring state', () => {
      const machine = createTemplateApplyMachine(mockConfig);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      const variables = generateMockVariables();
      actor.send({ type: 'UPDATE_VARIABLES', variables });

      expect(actor.getSnapshot().context.variables).toEqual(variables);
    });

    it('should transition from configuring to previewing on PREVIEW', async () => {
      const machine = createTemplateApplyMachine(mockConfig);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      expect(actor.getSnapshot().value).toBe('previewing');
    });

    it('should transition from previewing to reviewing after successful preview', async () => {
      const machine = createTemplateApplyMachine(mockConfig);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      expect(actor.getSnapshot().value).toBe('reviewing');
      expect(actor.getSnapshot().context.previewResult).toEqual(mockPreviewResult);
    });

    it('should transition from reviewing to applying for low-risk templates', async () => {
      const machine = createTemplateApplyMachine(mockConfig);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      actor.send({ type: 'CONFIRM' });

      expect(actor.getSnapshot().value).toBe('applying');
    });

    it('should transition from applying to success', async () => {
      const machine = createTemplateApplyMachine(mockConfig);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      actor.send({ type: 'CONFIRM' });

      await xstateWaitFor(actor, (state) => state.matches('success'), { timeout: 1000 });

      expect(actor.getSnapshot().value).toBe('success');
      expect(actor.getSnapshot().context.applyResult).toEqual(mockSuccessfulApplyResult);
      expect(mockConfig.onSuccess).toHaveBeenCalled();
    });
  });

  describe('High-Risk Flow', () => {
    it('should transition to confirming for high-risk templates', async () => {
      const highRiskPreview: TemplatePreviewResult = {
        ...mockPreviewResult,
        impactAnalysis: mockHighImpactAnalysis,
      };

      const configWithHighRisk: TemplateApplyConfig = {
        ...mockConfig,
        previewTemplate: vi.fn().mockResolvedValue(highRiskPreview),
      };

      const machine = createTemplateApplyMachine(configWithHighRisk);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      actor.send({ type: 'CONFIRM' });

      expect(actor.getSnapshot().value).toBe('confirming');
    });

    it('should require acknowledgment for high-risk operations', async () => {
      const highRiskPreview: TemplatePreviewResult = {
        ...mockPreviewResult,
        impactAnalysis: mockHighImpactAnalysis,
      };

      const configWithHighRisk: TemplateApplyConfig = {
        ...mockConfig,
        previewTemplate: vi.fn().mockResolvedValue(highRiskPreview),
      };

      const machine = createTemplateApplyMachine(configWithHighRisk);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      actor.send({ type: 'CONFIRM' });

      await xstateWaitFor(actor, (state) => state.matches('confirming'), { timeout: 1000 });

      actor.send({ type: 'ACKNOWLEDGED' });

      expect(actor.getSnapshot().value).toBe('applying');
    });

    it('should allow canceling from confirming state', async () => {
      const highRiskPreview: TemplatePreviewResult = {
        ...mockPreviewResult,
        impactAnalysis: mockHighImpactAnalysis,
      };

      const configWithHighRisk: TemplateApplyConfig = {
        ...mockConfig,
        previewTemplate: vi.fn().mockResolvedValue(highRiskPreview),
      };

      const machine = createTemplateApplyMachine(configWithHighRisk);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      actor.send({ type: 'CONFIRM' });

      await xstateWaitFor(actor, (state) => state.matches('confirming'), { timeout: 1000 });

      actor.send({ type: 'CANCEL' });

      expect(actor.getSnapshot().value).toBe('reviewing');
    });
  });

  describe('Error Handling', () => {
    it('should transition to error on preview failure', async () => {
      const previewError = new Error('Failed to connect to router');
      const configWithError: TemplateApplyConfig = {
        ...mockConfig,
        previewTemplate: vi.fn().mockRejectedValue(previewError),
      };

      const machine = createTemplateApplyMachine(configWithError);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('error'), { timeout: 1000 });

      expect(actor.getSnapshot().value).toBe('error');
      expect(actor.getSnapshot().context.errorMessage).toBe(previewError.message);
      expect(mockConfig.onError).toHaveBeenCalledWith(previewError.message);
    });

    it('should transition to error on apply failure', async () => {
      const configWithFailure: TemplateApplyConfig = {
        ...mockConfig,
        applyTemplate: vi.fn().mockResolvedValue(mockPartialFailureResult),
      };

      const machine = createTemplateApplyMachine(configWithFailure);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      actor.send({ type: 'CONFIRM' });

      await xstateWaitFor(actor, (state) => state.matches('error'), { timeout: 1000 });

      expect(actor.getSnapshot().value).toBe('error');
    });

    it('should allow retry from error state', async () => {
      let callCount = 0;
      const configWithRetry: TemplateApplyConfig = {
        ...mockConfig,
        previewTemplate: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject(new Error('Temporary error'));
          }
          return Promise.resolve(mockPreviewResult);
        }),
      };

      const machine = createTemplateApplyMachine(configWithRetry);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('error'), { timeout: 1000 });

      actor.send({ type: 'RETRY' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      expect(actor.getSnapshot().value).toBe('reviewing');
    });
  });

  describe('Rollback Flow', () => {
    it('should execute rollback from success state', async () => {
      const machine = createTemplateApplyMachine(mockConfig);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      actor.send({ type: 'CONFIRM' });

      await xstateWaitFor(actor, (state) => state.matches('success'), { timeout: 1000 });

      actor.send({ type: 'ROLLBACK' });

      await xstateWaitFor(actor, (state) => state.matches('rolledBack'), { timeout: 1000 });

      expect(actor.getSnapshot().value).toBe('rolledBack');
      expect(mockConfig.executeRollback).toHaveBeenCalledWith({
        routerId: 'router-1',
        rollbackId: mockSuccessfulApplyResult.rollbackId,
      });
      expect(mockConfig.onRollback).toHaveBeenCalled();
    });

    it('should execute rollback from error state if rollback data exists', async () => {
      const configWithError: TemplateApplyConfig = {
        ...mockConfig,
        applyTemplate: vi.fn().mockResolvedValue(mockPartialFailureResult),
      };

      const machine = createTemplateApplyMachine(configWithError);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      actor.send({ type: 'CONFIRM' });

      await xstateWaitFor(actor, (state) => state.matches('error'), { timeout: 1000 });

      actor.send({ type: 'ROLLBACK' });

      await xstateWaitFor(actor, (state) => state.matches('rolledBack'), { timeout: 1000 });

      expect(actor.getSnapshot().value).toBe('rolledBack');
    });

    it('should handle rollback failure', async () => {
      const rollbackError = new Error('Rollback failed');
      const configWithRollbackError: TemplateApplyConfig = {
        ...mockConfig,
        executeRollback: vi.fn().mockRejectedValue(rollbackError),
      };

      const machine = createTemplateApplyMachine(configWithRollbackError);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      actor.send({ type: 'CONFIRM' });

      await xstateWaitFor(actor, (state) => state.matches('success'), { timeout: 1000 });

      actor.send({ type: 'ROLLBACK' });

      await xstateWaitFor(actor, (state) => state.matches('error'), { timeout: 1000 });

      expect(actor.getSnapshot().value).toBe('error');
      expect(actor.getSnapshot().context.errorMessage).toBe(rollbackError.message);
    });
  });

  describe('Cancel Flow', () => {
    it('should cancel from configuring state', () => {
      const machine = createTemplateApplyMachine(mockConfig);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'CANCEL' });

      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context.template).toBeNull();
      expect(actor.getSnapshot().context.routerId).toBeNull();
    });

    it('should cancel from reviewing state', async () => {
      const machine = createTemplateApplyMachine(mockConfig);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      actor.send({ type: 'CANCEL' });

      expect(actor.getSnapshot().value).toBe('idle');
    });
  });

  describe('Reset Flow', () => {
    it('should reset from success state', async () => {
      const machine = createTemplateApplyMachine(mockConfig);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      actor.send({ type: 'CONFIRM' });

      await xstateWaitFor(actor, (state) => state.matches('success'), { timeout: 1000 });

      actor.send({ type: 'RESET' });

      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context.template).toBeNull();
    });

    it('should reset from error state', async () => {
      const configWithError: TemplateApplyConfig = {
        ...mockConfig,
        previewTemplate: vi.fn().mockRejectedValue(new Error('Test error')),
      };

      const machine = createTemplateApplyMachine(configWithError);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('error'), { timeout: 1000 });

      actor.send({ type: 'RESET' });

      expect(actor.getSnapshot().value).toBe('idle');
    });
  });

  describe('Guards', () => {
    it('should detect high risk based on rule count', async () => {
      const highRiskPreview: TemplatePreviewResult = {
        ...mockPreviewResult,
        impactAnalysis: {
          ...mockPreviewResult.impactAnalysis,
          newRulesCount: 15, // > 10 = high risk
        },
      };

      const configWithHighRisk: TemplateApplyConfig = {
        ...mockConfig,
        previewTemplate: vi.fn().mockResolvedValue(highRiskPreview),
      };

      const machine = createTemplateApplyMachine(configWithHighRisk);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      actor.send({ type: 'CONFIRM' });

      expect(actor.getSnapshot().value).toBe('confirming');
    });

    it('should detect high risk based on affected chains', async () => {
      const highRiskPreview: TemplatePreviewResult = {
        ...mockPreviewResult,
        impactAnalysis: {
          ...mockPreviewResult.impactAnalysis,
          affectedChains: ['input', 'forward', 'output', 'prerouting'], // > 3 = high risk
        },
      };

      const configWithHighRisk: TemplateApplyConfig = {
        ...mockConfig,
        previewTemplate: vi.fn().mockResolvedValue(highRiskPreview),
      };

      const machine = createTemplateApplyMachine(configWithHighRisk);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockBasicSecurityTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      actor.send({ type: 'CONFIRM' });

      expect(actor.getSnapshot().value).toBe('confirming');
    });

    it('should detect high risk when conflicts exist', async () => {
      const configWithConflicts: TemplateApplyConfig = {
        ...mockConfig,
        previewTemplate: vi.fn().mockResolvedValue(mockPreviewResultWithConflicts),
      };

      const machine = createTemplateApplyMachine(configWithConflicts);
      const actor = createActor(machine);
      actor.start();

      actor.send({
        type: 'SELECT_TEMPLATE',
        template: mockHomeNetworkTemplate,
        routerId: 'router-1',
      });

      actor.send({ type: 'UPDATE_VARIABLES', variables: generateMockVariables() });
      actor.send({ type: 'PREVIEW' });

      await xstateWaitFor(actor, (state) => state.matches('reviewing'), { timeout: 1000 });

      actor.send({ type: 'CONFIRM' });

      expect(actor.getSnapshot().value).toBe('confirming');
    });
  });

  describe('Helper Functions', () => {
    it('isTemplateFinal should identify final states', () => {
      expect(isTemplateFinal('success')).toBe(true);
      expect(isTemplateFinal('rolledBack')).toBe(true);
      expect(isTemplateFinal('idle')).toBe(false);
      expect(isTemplateFinal('error')).toBe(false);
    });

    it('isTemplateCancellable should identify cancellable states', () => {
      expect(isTemplateCancellable('configuring')).toBe(true);
      expect(isTemplateCancellable('reviewing')).toBe(true);
      expect(isTemplateCancellable('confirming')).toBe(true);
      expect(isTemplateCancellable('previewing')).toBe(false);
      expect(isTemplateCancellable('applying')).toBe(false);
    });

    it('isTemplateProcessing should identify processing states', () => {
      expect(isTemplateProcessing('previewing')).toBe(true);
      expect(isTemplateProcessing('applying')).toBe(true);
      expect(isTemplateProcessing('rollingBack')).toBe(true);
      expect(isTemplateProcessing('idle')).toBe(false);
      expect(isTemplateProcessing('reviewing')).toBe(false);
    });

    it('getTemplateStateDescription should return human-readable descriptions', () => {
      expect(getTemplateStateDescription('idle')).toBe('Select a template');
      expect(getTemplateStateDescription('configuring')).toBe('Configure template variables');
      expect(getTemplateStateDescription('previewing')).toBe('Generating preview...');
      expect(getTemplateStateDescription('reviewing')).toBe('Review changes');
      expect(getTemplateStateDescription('confirming')).toBe('Confirm high-risk operation');
      expect(getTemplateStateDescription('applying')).toBe('Applying template...');
      expect(getTemplateStateDescription('success')).toBe('Template applied successfully');
      expect(getTemplateStateDescription('rollingBack')).toBe('Rolling back changes...');
      expect(getTemplateStateDescription('rolledBack')).toBe('Changes rolled back');
      expect(getTemplateStateDescription('error')).toBe('Error occurred');
    });
  });
});
