/**
 * Tests for ValidationPipeline
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  ValidationPipeline,
  mapToFormErrors,
  createValidationPipeline,
} from '../ValidationPipeline';

import type {
  ValidationRequest,
  ValidationResponse,
  ValidationStageResult,
} from '../types';

describe('ValidationPipeline', () => {
  const mockValidateFn = vi.fn<
    [ValidationRequest],
    Promise<ValidationResponse>
  >();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs schema validation locally', async () => {
    mockValidateFn.mockResolvedValue({
      stages: [],
      isValid: true,
    });

    const pipeline = new ValidationPipeline(
      { validateFn: mockValidateFn },
      { riskLevel: 'low' }
    );

    const result = await pipeline.validate('test-resource', { name: 'test' });

    expect(result.isValid).toBe(true);
    expect(result.stages.find((s) => s.stage === 'schema')?.status).toBe('passed');
  });

  it('calls backend for medium risk validation', async () => {
    mockValidateFn.mockResolvedValue({
      stages: [
        { stage: 'syntax', status: 'passed', errors: [], warnings: [] },
        { stage: 'cross-resource', status: 'passed', errors: [], warnings: [] },
        { stage: 'dependencies', status: 'passed', errors: [], warnings: [] },
      ],
      isValid: true,
    });

    const pipeline = new ValidationPipeline(
      { validateFn: mockValidateFn },
      { riskLevel: 'medium' }
    );

    const result = await pipeline.validate('test-resource', { name: 'test' });

    expect(mockValidateFn).toHaveBeenCalled();
    expect(result.isValid).toBe(true);
  });

  it('collects errors from all stages', async () => {
    mockValidateFn.mockResolvedValue({
      stages: [
        {
          stage: 'syntax',
          status: 'failed',
          errors: [
            {
              code: 'SYNTAX_ERROR',
              message: 'Invalid syntax',
              fieldPath: 'config',
              severity: 'error',
              stage: 'syntax',
            },
          ],
          warnings: [],
        },
      ],
      isValid: false,
    });

    const pipeline = new ValidationPipeline(
      { validateFn: mockValidateFn },
      { riskLevel: 'medium' }
    );

    const result = await pipeline.validate('test-resource', { name: 'test' });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe('SYNTAX_ERROR');
  });

  it('maps errors to field paths', async () => {
    mockValidateFn.mockResolvedValue({
      stages: [
        {
          stage: 'syntax',
          status: 'failed',
          errors: [
            {
              code: 'INVALID_IP',
              message: 'Invalid IP address',
              fieldPath: 'address',
              severity: 'error',
              stage: 'syntax',
            },
            {
              code: 'MISSING_KEY',
              message: 'Public key required',
              fieldPath: 'publicKey',
              severity: 'error',
              stage: 'syntax',
            },
          ],
          warnings: [],
        },
      ],
      isValid: false,
    });

    const pipeline = new ValidationPipeline(
      { validateFn: mockValidateFn },
      { riskLevel: 'medium' }
    );

    const result = await pipeline.validate('wireguard-peer', {});

    expect(result.fieldErrors['address']).toHaveLength(1);
    expect(result.fieldErrors['publicKey']).toHaveLength(1);
  });

  it('stops on error when configured', async () => {
    const stageResults: ValidationStageResult[] = [
      {
        stage: 'syntax',
        status: 'failed',
        errors: [
          {
            code: 'SYNTAX_ERROR',
            message: 'Error',
            severity: 'error',
            stage: 'syntax',
          },
        ],
        warnings: [],
      },
      {
        stage: 'cross-resource',
        status: 'passed',
        errors: [],
        warnings: [],
      },
    ];

    mockValidateFn.mockResolvedValue({
      stages: stageResults,
      isValid: false,
    });

    const pipeline = new ValidationPipeline(
      { validateFn: mockValidateFn },
      { riskLevel: 'medium', stopOnError: true }
    );

    const result = await pipeline.validate('test', {});

    // The pipeline should mark remaining stages as skipped after first failure
    const crossResourceStage = result.stages.find(
      (s) => s.stage === 'cross-resource'
    );
    expect(crossResourceStage?.status).toBe('skipped');
  });

  it('skips specified stages', async () => {
    mockValidateFn.mockResolvedValue({
      stages: [
        { stage: 'syntax', status: 'passed', errors: [], warnings: [] },
        { stage: 'dependencies', status: 'passed', errors: [], warnings: [] },
      ],
      isValid: true,
    });

    const pipeline = new ValidationPipeline(
      { validateFn: mockValidateFn },
      { riskLevel: 'medium', skipStages: ['cross-resource'] }
    );

    const result = await pipeline.validate('test', {});

    const crossResourceStage = result.stages.find(
      (s) => s.stage === 'cross-resource'
    );
    expect(crossResourceStage?.status).toBe('skipped');
  });

  it('calls callbacks during validation', async () => {
    const onStageStart = vi.fn();
    const onStageComplete = vi.fn();
    const onProgress = vi.fn();

    mockValidateFn.mockResolvedValue({
      stages: [
        { stage: 'syntax', status: 'passed', errors: [], warnings: [] },
      ],
      isValid: true,
    });

    const pipeline = new ValidationPipeline(
      {
        validateFn: mockValidateFn,
        onStageStart,
        onStageComplete,
        onProgress,
      },
      { riskLevel: 'low' }
    );

    await pipeline.validate('test', {});

    expect(onStageStart).toHaveBeenCalledWith('schema');
    expect(onStageComplete).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalled();
  });

  it('handles validation service errors', async () => {
    mockValidateFn.mockRejectedValue(new Error('Service unavailable'));

    const pipeline = new ValidationPipeline(
      { validateFn: mockValidateFn },
      { riskLevel: 'medium' }
    );

    const result = await pipeline.validate('test', {});

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('unavailable'))).toBe(
      true
    );
  });

  it('can be aborted', async () => {
    // Create a slow validation that we can abort
    mockValidateFn.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        stages: [
          { stage: 'syntax', status: 'passed', errors: [], warnings: [] },
        ],
        isValid: true,
      };
    });

    const pipeline = new ValidationPipeline(
      { validateFn: mockValidateFn },
      { riskLevel: 'medium' }
    );

    const validatePromise = pipeline.validate('test', {});

    // Abort immediately
    pipeline.abort();

    const result = await validatePromise;

    // The schema stage should still complete (local), but backend stages should be skipped
    expect(result.stages.find((s) => s.stage === 'schema')?.status).toBe('passed');
  });
});

describe('mapToFormErrors', () => {
  it('maps field errors to form error format', () => {
    const fieldErrors = {
      address: [
        {
          code: 'INVALID_IP',
          message: 'Invalid IP address',
          fieldPath: 'address',
          severity: 'error' as const,
          stage: 'syntax' as const,
        },
      ],
      port: [
        {
          code: 'INVALID_PORT',
          message: 'Port out of range',
          fieldPath: 'port',
          severity: 'error' as const,
          stage: 'syntax' as const,
        },
      ],
    };

    const formErrors = mapToFormErrors(fieldErrors);

    expect(formErrors.address).toEqual({
      type: 'INVALID_IP',
      message: 'Invalid IP address',
    });
    expect(formErrors.port).toEqual({
      type: 'INVALID_PORT',
      message: 'Port out of range',
    });
  });

  it('takes first error when multiple exist for a field', () => {
    const fieldErrors = {
      address: [
        {
          code: 'ERROR_1',
          message: 'First error',
          fieldPath: 'address',
          severity: 'error' as const,
          stage: 'syntax' as const,
        },
        {
          code: 'ERROR_2',
          message: 'Second error',
          fieldPath: 'address',
          severity: 'error' as const,
          stage: 'syntax' as const,
        },
      ],
    };

    const formErrors = mapToFormErrors(fieldErrors);

    expect(formErrors.address.type).toBe('ERROR_1');
    expect(formErrors.address.message).toBe('First error');
  });
});

describe('createValidationPipeline', () => {
  it('creates a pipeline with config', () => {
    const validateFn = vi.fn();
    const pipeline = createValidationPipeline(validateFn, { riskLevel: 'high' });

    expect(pipeline).toBeInstanceOf(ValidationPipeline);
  });

  it('creates a pipeline with callbacks', () => {
    const validateFn = vi.fn();
    const onStageStart = vi.fn();

    const pipeline = createValidationPipeline(
      validateFn,
      { riskLevel: 'medium' },
      { onStageStart }
    );

    expect(pipeline).toBeInstanceOf(ValidationPipeline);
  });
});
