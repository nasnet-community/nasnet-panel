/**
 * Troubleshoot Machine Tests
 * Unit tests for the XState troubleshooting wizard machine (NAS-5.11)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createActor, waitFor } from 'xstate';
import type { ActorLogic } from 'xstate';
import { createTroubleshootMachine } from './troubleshoot-machine';
import type { TroubleshootContext } from '../types/troubleshoot.types';

describe('TroubleshootMachine', () => {
  const mockRouterId = 'router-123';
  let machine: ReturnType<typeof createTroubleshootMachine>;

  beforeEach(() => {
    machine = createTroubleshootMachine(mockRouterId);
  });

  describe('Initial State', () => {
    it('should start in idle state', () => {
      const actor = createActor(machine);
      actor.start();

      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context.routerId).toBe(mockRouterId);
      expect(actor.getSnapshot().context.overallStatus).toBe('idle');
      expect(actor.getSnapshot().context.steps).toHaveLength(5);
    });

    it('should have correct initial step configuration', () => {
      const actor = createActor(machine);
      actor.start();

      const { steps } = actor.getSnapshot().context;
      expect(steps[0].id).toBe('wan');
      expect(steps[1].id).toBe('gateway');
      expect(steps[2].id).toBe('internet');
      expect(steps[3].id).toBe('dns');
      expect(steps[4].id).toBe('nat');
      expect(steps.every((step) => step.status === 'pending')).toBe(true);
    });
  });

  describe('START Event', () => {
    it('should transition from idle to initializing', () => {
      const mockNetworkConfig = {
        wanInterface: 'ether1',
        gateway: '192.168.1.1',
      };

      const actor = createActor(
        machine.provide({
          actors: {
            detectNetworkConfig: vi.fn(async () => mockNetworkConfig) as unknown as ActorLogic<
              any,
              any,
              any,
              any,
              any
            >,
            executeDiagnosticStep: vi.fn(async () => ({
              success: true,
              message: 'Check passed',
              executionTimeMs: 100,
            })) as unknown as ActorLogic<any, any, any, any, any>,
            applyFix: vi.fn() as unknown as ActorLogic<any, any, any, any, any>,
          },
        })
      );

      actor.start();
      actor.send({ type: 'START' });

      expect(actor.getSnapshot().value).toBe('initializing');
      expect(actor.getSnapshot().context.overallStatus).toBe('running');
      expect(actor.getSnapshot().context.startTime).toBeTruthy();
    });

    it('should detect network configuration during initialization', async () => {
      const mockNetworkConfig = {
        wanInterface: 'ether2',
        gateway: '10.0.0.1',
      };

      const detectSpy = vi.fn(async () => mockNetworkConfig);

      const actor = createActor(
        machine.provide({
          actors: {
            detectNetworkConfig: detectSpy as unknown as ActorLogic<any, any, any, any, any>,
            executeDiagnosticStep: vi.fn(async () => ({
              success: true,
              message: 'Check passed',
              executionTimeMs: 100,
            })) as unknown as ActorLogic<any, any, any, any, any>,
            applyFix: vi.fn() as unknown as ActorLogic<any, any, any, any, any>,
          },
        })
      );

      actor.start();
      actor.send({ type: 'START' });

      // Wait for transition to runningDiagnostic
      await waitFor(actor, (state) => state.matches('runningDiagnostic'));

      expect(detectSpy).toHaveBeenCalledWith({ input: { routerId: mockRouterId } });
      expect(actor.getSnapshot().context.wanInterface).toBe('ether2');
      expect(actor.getSnapshot().context.gateway).toBe('10.0.0.1');
    });
  });

  describe('Diagnostic Execution', () => {
    it('should execute diagnostic steps sequentially', async () => {
      const executeSpy = vi.fn(async ({ input }) => ({
        success: true,
        message: `${input.step.id} passed`,
        executionTimeMs: 100,
      }));

      const actor = createActor(
        machine.provide({
          actors: {
            detectNetworkConfig: vi.fn(async () => ({
              wanInterface: 'ether1',
              gateway: '192.168.1.1',
            })) as unknown as ActorLogic<any, any, any, any, any>,
            executeDiagnosticStep: executeSpy as unknown as ActorLogic<any, any, any, any, any>,
            applyFix: vi.fn() as unknown as ActorLogic<any, any, any, any, any>,
          },
        })
      );

      actor.start();
      actor.send({ type: 'START' });

      // Wait for completion
      await waitFor(actor, (state) => state.matches('completed'));

      // Should have executed all 5 steps
      expect(executeSpy).toHaveBeenCalledTimes(5);
      expect(actor.getSnapshot().context.steps.every((s) => s.status === 'passed')).toBe(true);
    });

    it('should mark step as running during execution', async () => {
      let resolveExecution: (value: any) => void;
      const executionPromise = new Promise((resolve) => {
        resolveExecution = resolve;
      });

      const actor = createActor(
        machine.provide({
          actors: {
            detectNetworkConfig: vi.fn(async () => ({
              wanInterface: 'ether1',
              gateway: '192.168.1.1',
            })) as unknown as ActorLogic<any, any, any, any, any>,
            executeDiagnosticStep: vi.fn(async () => executionPromise) as unknown as ActorLogic<
              any,
              any,
              any,
              any,
              any
            >,
            applyFix: vi.fn() as unknown as ActorLogic<any, any, any, any, any>,
          },
        })
      );

      actor.start();
      actor.send({ type: 'START' });

      // Wait for first step to be running
      await waitFor(actor, (state) => state.context.steps[0].status === 'running');

      expect(actor.getSnapshot().context.steps[0].status).toBe('running');
      expect(actor.getSnapshot().context.currentStepIndex).toBe(0);

      // Resolve execution to let test complete
      resolveExecution!({ success: true, message: 'Passed', executionTimeMs: 100 });
    });
  });

  describe('Fix Application', () => {
    it('should wait for user decision when step fails with fix available', async () => {
      const actor = createActor(
        machine.provide({
          actors: {
            detectNetworkConfig: vi.fn(async () => ({
              wanInterface: 'ether1',
              gateway: null,
            })) as unknown as ActorLogic<any, any, any, any, any>,
            executeDiagnosticStep: vi.fn(async ({ input }) => {
              if (input.step.id === 'wan') {
                return {
                  success: false,
                  message: 'WAN interface is disabled',
                  issueCode: 'WAN_DISABLED',
                  executionTimeMs: 100,
                };
              }
              return { success: true, message: 'Passed', executionTimeMs: 100 };
            }) as unknown as ActorLogic<any, any, any, any, any>,
            applyFix: vi.fn(async () => ({ success: true })) as unknown as ActorLogic<
              any,
              any,
              any,
              any,
              any
            >,
          },
        })
      );

      actor.start();
      actor.send({ type: 'START' });

      // Wait for machine to reach awaitingFixDecision state
      await waitFor(actor, (state) => state.matches({ runningDiagnostic: 'awaitingFixDecision' }));

      expect(actor.getSnapshot().context.steps[0].status).toBe('failed');
      expect(actor.getSnapshot().context.steps[0].fix).toBeTruthy();
    });

    it('should apply fix when APPLY_FIX event is sent', async () => {
      const applyFixSpy = vi.fn(async () => ({ success: true }));

      const actor = createActor(
        machine.provide({
          actors: {
            detectNetworkConfig: vi.fn(async () => ({
              wanInterface: 'ether1',
              gateway: null,
            })) as unknown as ActorLogic<any, any, any, any, any>,
            executeDiagnosticStep: vi.fn(async ({ input }) => {
              if (input.step.id === 'wan') {
                return {
                  success: false,
                  message: 'WAN disabled',
                  issueCode: 'WAN_DISABLED',
                  executionTimeMs: 100,
                };
              }
              return { success: true, message: 'Passed', executionTimeMs: 100 };
            }) as unknown as ActorLogic<any, any, any, any, any>,
            applyFix: applyFixSpy as unknown as ActorLogic<any, any, any, any, any>,
          },
        })
      );

      actor.start();
      actor.send({ type: 'START' });

      // Wait for awaitingFixDecision
      await waitFor(actor, (state) => state.matches({ runningDiagnostic: 'awaitingFixDecision' }));

      // Apply the fix
      actor.send({ type: 'APPLY_FIX' });

      // Wait for applyingFix state
      await waitFor(actor, (state) => state.matches({ runningDiagnostic: 'applyingFix' }));

      expect(applyFixSpy).toHaveBeenCalled();
    });

    it('should skip to next step when SKIP_FIX event is sent', async () => {
      const actor = createActor(
        machine.provide({
          actors: {
            detectNetworkConfig: vi.fn(async () => ({
              wanInterface: 'ether1',
              gateway: '192.168.1.1',
            })) as unknown as ActorLogic<any, any, any, any, any>,
            executeDiagnosticStep: vi.fn(async ({ input }) => {
              if (input.step.id === 'wan') {
                return {
                  success: false,
                  message: 'Failed',
                  issueCode: 'WAN_DISABLED',
                  executionTimeMs: 100,
                };
              }
              return { success: true, message: 'Passed', executionTimeMs: 100 };
            }) as unknown as ActorLogic<any, any, any, any, any>,
            applyFix: vi.fn() as unknown as ActorLogic<any, any, any, any, any>,
          },
        })
      );

      actor.start();
      actor.send({ type: 'START' });

      // Wait for awaitingFixDecision
      await waitFor(actor, (state) => state.matches({ runningDiagnostic: 'awaitingFixDecision' }));

      const stepIndexBefore = actor.getSnapshot().context.currentStepIndex;

      // Skip the fix
      actor.send({ type: 'SKIP_FIX' });

      // Wait for next step to start
      await waitFor(actor, (state) => state.context.currentStepIndex > stepIndexBefore);

      expect(actor.getSnapshot().context.currentStepIndex).toBe(stepIndexBefore + 1);
      expect(actor.getSnapshot().context.steps[1].status).toBe('running');
    });
  });

  describe('CANCEL Event', () => {
    it('should cancel from any state and return to idle', async () => {
      const actor = createActor(
        machine.provide({
          actors: {
            detectNetworkConfig: vi.fn(async () => ({
              wanInterface: 'ether1',
              gateway: '192.168.1.1',
            })) as unknown as ActorLogic<any, any, any, any, any>,
            executeDiagnosticStep: vi.fn(async () => {
              // Never resolve to keep machine in running state
              return new Promise(() => {});
            }) as unknown as ActorLogic<any, any, any, any, any>,
            applyFix: vi.fn() as unknown as ActorLogic<any, any, any, any, any>,
          },
        })
      );

      actor.start();
      actor.send({ type: 'START' });

      // Wait for runningDiagnostic state
      await waitFor(actor, (state) => state.matches('runningDiagnostic'));

      // Cancel the session
      actor.send({ type: 'CANCEL' });

      // Should transition to idle
      await waitFor(actor, (state) => state.matches('idle'));

      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context.overallStatus).toBe('idle');
    });
  });

  describe('Completion', () => {
    it('should transition to completed when all steps pass', async () => {
      const actor = createActor(
        machine.provide({
          actors: {
            detectNetworkConfig: vi.fn(async () => ({
              wanInterface: 'ether1',
              gateway: '192.168.1.1',
            })) as unknown as ActorLogic<any, any, any, any, any>,
            executeDiagnosticStep: vi.fn(async () => ({
              success: true,
              message: 'Passed',
              executionTimeMs: 100,
            })) as unknown as ActorLogic<any, any, any, any, any>,
            applyFix: vi.fn() as unknown as ActorLogic<any, any, any, any, any>,
          },
        })
      );

      actor.start();
      actor.send({ type: 'START' });

      // Wait for completion
      await waitFor(actor, (state) => state.matches('completed'));

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('completed');
      expect(snapshot.context.overallStatus).toBe('completed');
      expect(snapshot.context.endTime).toBeTruthy();
      expect(snapshot.context.steps.every((s) => s.status === 'passed')).toBe(true);
    });

    it('should support RESTART from completed state', async () => {
      const actor = createActor(
        machine.provide({
          actors: {
            detectNetworkConfig: vi.fn(async () => ({
              wanInterface: 'ether1',
              gateway: '192.168.1.1',
            })) as unknown as ActorLogic<any, any, any, any, any>,
            executeDiagnosticStep: vi.fn(async () => ({
              success: true,
              message: 'Passed',
              executionTimeMs: 100,
            })) as unknown as ActorLogic<any, any, any, any, any>,
            applyFix: vi.fn() as unknown as ActorLogic<any, any, any, any, any>,
          },
        })
      );

      actor.start();
      actor.send({ type: 'START' });

      // Wait for completion
      await waitFor(actor, (state) => state.matches('completed'));

      // Restart
      actor.send({ type: 'RESTART' });

      // Should be back in idle state with reset context
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('idle');
      expect(snapshot.context.overallStatus).toBe('idle');
      expect(snapshot.context.currentStepIndex).toBe(0);
      expect(snapshot.context.appliedFixes).toHaveLength(0);
      expect(snapshot.context.steps.every((s) => s.status === 'pending')).toBe(true);
    });
  });
});
