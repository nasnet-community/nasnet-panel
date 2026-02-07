/**
 * Tests for ping XState machine
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createActor } from 'xstate';
import { pingMachine } from './ping-machine';
import type { PingResult } from '../components/PingTool/PingTool.types';

describe('ping-machine', () => {
  const createMockResult = (
    seq: number,
    time: number | null = 12.5,
    error: string | null = null
  ): PingResult => ({
    seq,
    bytes: time !== null ? 56 : null,
    ttl: time !== null ? 52 : null,
    time,
    target: '8.8.8.8',
    source: null,
    error,
    timestamp: new Date(),
  });

  describe('initial state', () => {
    it('should start in idle state', () => {
      const actor = createActor(pingMachine);
      actor.start();

      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context.results).toEqual([]);
      expect(actor.getSnapshot().context.count).toBe(10);
    });
  });

  describe('START event', () => {
    it('should transition from idle to running on START', () => {
      const actor = createActor(pingMachine);
      actor.start();

      actor.send({ type: 'START', target: '8.8.8.8', count: 5 });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('running');
      expect(snapshot.context.target).toBe('8.8.8.8');
      expect(snapshot.context.count).toBe(5);
    });

    it('should reset context on START', () => {
      const actor = createActor(pingMachine);
      actor.start();

      // First ping
      actor.send({ type: 'START', target: '8.8.8.8', count: 2 });
      actor.send({ type: 'JOB_STARTED', jobId: 'job-1' });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(1) });

      // Start new ping - should reset
      actor.send({ type: 'START', target: 'google.com', count: 10 });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.results).toEqual([]);
      expect(snapshot.context.target).toBe('google.com');
      expect(snapshot.context.count).toBe(10);
      expect(snapshot.context.error).toBeNull();
    });
  });

  describe('JOB_STARTED event', () => {
    it('should store jobId in context', () => {
      const actor = createActor(pingMachine);
      actor.start();

      actor.send({ type: 'START', target: '8.8.8.8', count: 5 });
      actor.send({ type: 'JOB_STARTED', jobId: 'job-123' });

      expect(actor.getSnapshot().context.jobId).toBe('job-123');
    });
  });

  describe('RESULT_RECEIVED event', () => {
    it('should append result to context', () => {
      const actor = createActor(pingMachine);
      actor.start();

      actor.send({ type: 'START', target: '8.8.8.8', count: 5 });

      const result1 = createMockResult(1, 12.5);
      actor.send({ type: 'RESULT_RECEIVED', result: result1 });

      expect(actor.getSnapshot().context.results).toHaveLength(1);
      expect(actor.getSnapshot().context.results[0]).toEqual(result1);
    });

    it('should update statistics on each result', () => {
      const actor = createActor(pingMachine);
      actor.start();

      actor.send({ type: 'START', target: '8.8.8.8', count: 5 });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(1, 12.5) });

      const stats = actor.getSnapshot().context.statistics;
      expect(stats.sent).toBe(1);
      expect(stats.received).toBe(1);
      expect(stats.minRtt).toBeCloseTo(12.5, 1);
    });

    it('should accumulate multiple results', () => {
      const actor = createActor(pingMachine);
      actor.start();

      actor.send({ type: 'START', target: '8.8.8.8', count: 5 });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(1, 12.5) });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(2, 14.2) });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(3, 11.8) });

      const context = actor.getSnapshot().context;
      expect(context.results).toHaveLength(3);
      expect(context.statistics.sent).toBe(3);
      expect(context.statistics.received).toBe(3);
      expect(context.statistics.avgRtt).toBeCloseTo(12.83, 1);
    });
  });

  describe('isComplete guard and auto-transition', () => {
    it('should transition to complete when results.length reaches count', () => {
      const actor = createActor(pingMachine);
      actor.start();

      actor.send({ type: 'START', target: '8.8.8.8', count: 3 });

      // Send results - should stay in running until count is reached
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(1, 12.5) });
      expect(actor.getSnapshot().value).toBe('running');

      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(2, 14.2) });
      expect(actor.getSnapshot().value).toBe('running');

      // Third result should trigger completion
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(3, 11.8) });
      expect(actor.getSnapshot().value).toBe('complete');
    });

    it('should preserve results and statistics in complete state', () => {
      const actor = createActor(pingMachine);
      actor.start();

      actor.send({ type: 'START', target: '8.8.8.8', count: 2 });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(1, 12.5) });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(2, 14.2) });

      const context = actor.getSnapshot().context;
      expect(context.results).toHaveLength(2);
      expect(context.statistics.sent).toBe(2);
    });
  });

  describe('STOP event', () => {
    it('should transition to stopped when STOP is sent during running', () => {
      const actor = createActor(pingMachine);
      actor.start();

      actor.send({ type: 'START', target: '8.8.8.8', count: 10 });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(1, 12.5) });

      actor.send({ type: 'STOP' });

      expect(actor.getSnapshot().value).toBe('stopped');
    });

    it('should preserve results when stopped', () => {
      const actor = createActor(pingMachine);
      actor.start();

      actor.send({ type: 'START', target: '8.8.8.8', count: 10 });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(1, 12.5) });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(2, 14.2) });

      actor.send({ type: 'STOP' });

      const context = actor.getSnapshot().context;
      expect(context.results).toHaveLength(2);
      expect(context.statistics.sent).toBe(2);
    });
  });

  describe('ERROR event', () => {
    it('should transition to error state on ERROR event', () => {
      const actor = createActor(pingMachine);
      actor.start();

      actor.send({ type: 'START', target: '8.8.8.8', count: 5 });
      actor.send({ type: 'ERROR', error: 'Connection failed' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('error');
      expect(snapshot.context.error).toBe('Connection failed');
    });
  });

  describe('restart after terminal states', () => {
    it('should allow restart from stopped state', () => {
      const actor = createActor(pingMachine);
      actor.start();

      actor.send({ type: 'START', target: '8.8.8.8', count: 5 });
      actor.send({ type: 'STOP' });
      expect(actor.getSnapshot().value).toBe('stopped');

      // Restart
      actor.send({ type: 'START', target: 'google.com', count: 3 });
      expect(actor.getSnapshot().value).toBe('running');
      expect(actor.getSnapshot().context.target).toBe('google.com');
    });

    it('should allow restart from complete state', () => {
      const actor = createActor(pingMachine);
      actor.start();

      actor.send({ type: 'START', target: '8.8.8.8', count: 2 });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(1, 12.5) });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(2, 14.2) });
      expect(actor.getSnapshot().value).toBe('complete');

      // Restart
      actor.send({ type: 'START', target: 'localhost', count: 5 });
      expect(actor.getSnapshot().value).toBe('running');
      expect(actor.getSnapshot().context.results).toEqual([]);
    });

    it('should allow restart from error state', () => {
      const actor = createActor(pingMachine);
      actor.start();

      actor.send({ type: 'START', target: '8.8.8.8', count: 5 });
      actor.send({ type: 'ERROR', error: 'Network error' });
      expect(actor.getSnapshot().value).toBe('error');

      // Restart
      actor.send({ type: 'START', target: 'google.com', count: 3 });
      expect(actor.getSnapshot().value).toBe('running');
      expect(actor.getSnapshot().context.error).toBeNull();
    });
  });

  describe('statistics calculation with timeouts', () => {
    it('should handle timeout results correctly in statistics', () => {
      const actor = createActor(pingMachine);
      actor.start();

      actor.send({ type: 'START', target: '8.8.8.8', count: 4 });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(1, 12.5) });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(2, null, 'timeout') });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(3, 14.2) });
      actor.send({ type: 'RESULT_RECEIVED', result: createMockResult(4, null, 'timeout') });

      const stats = actor.getSnapshot().context.statistics;
      expect(stats.sent).toBe(4);
      expect(stats.received).toBe(2);
      expect(stats.lost).toBe(2);
      expect(stats.lossPercent).toBe(50);
    });
  });
});
