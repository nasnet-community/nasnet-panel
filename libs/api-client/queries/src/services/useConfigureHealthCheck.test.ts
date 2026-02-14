import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { describe, it, expect } from 'vitest';
import { ReactNode } from 'react';
import {
  useConfigureHealthCheck,
  validateHealthCheckConfig,
  CONFIGURE_HEALTH_CHECK_MUTATION,
} from './useConfigureHealthCheck';

function createWrapper(mocks: any[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MockedProvider mocks={mocks} addTypename={false}>{children}</MockedProvider>;
  };
}

describe('useConfigureHealthCheck', () => {
  const routerID = 'test-router-123';
  const instanceID = 'test-instance-456';

  it('should configure health check successfully', async () => {
    const mocks = [
      {
        request: {
          query: CONFIGURE_HEALTH_CHECK_MUTATION,
          variables: {
            routerID,
            instanceID,
            input: {
              intervalSeconds: 30,
              failureThreshold: 5,
            },
          },
        },
        result: {
          data: {
            configureHealthCheck: {
              success: true,
              message: 'Health check configured successfully',
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useConfigureHealthCheck(), {
      wrapper: createWrapper(mocks),
    });

    const [configureHealthCheck] = result.current;

    // Execute mutation
    const response = await configureHealthCheck({
      variables: {
        routerID,
        instanceID,
        input: {
          intervalSeconds: 30,
          failureThreshold: 5,
        },
      },
    });

    expect(response.data?.configureHealthCheck.success).toBe(true);
    expect(response.data?.configureHealthCheck.message).toBe(
      'Health check configured successfully'
    );
  });

  it('should handle mutation errors', async () => {
    const mocks = [
      {
        request: {
          query: CONFIGURE_HEALTH_CHECK_MUTATION,
          variables: {
            routerID,
            instanceID,
            input: {
              intervalSeconds: 60,
              failureThreshold: 3,
            },
          },
        },
        error: new Error('Instance not found'),
      },
    ];

    const { result } = renderHook(() => useConfigureHealthCheck(), {
      wrapper: createWrapper(mocks),
    });

    const [configureHealthCheck] = result.current;

    await expect(
      configureHealthCheck({
        variables: {
          routerID,
          instanceID,
          input: {
            intervalSeconds: 60,
            failureThreshold: 3,
          },
        },
      })
    ).rejects.toThrow('Instance not found');
  });
});

describe('validateHealthCheckConfig', () => {
  it('should validate valid health check config', () => {
    const validConfig = {
      intervalSeconds: 30,
      failureThreshold: 5,
    };

    const result = validateHealthCheckConfig(validConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.intervalSeconds).toBe(30);
      expect(result.data.failureThreshold).toBe(5);
    }
  });

  it('should reject interval below minimum (10s)', () => {
    const invalidConfig = {
      intervalSeconds: 5, // Too low
      failureThreshold: 3,
    };

    const result = validateHealthCheckConfig(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['intervalSeconds']);
      expect(result.error.issues[0].message).toContain('at least 10');
    }
  });

  it('should reject interval above maximum (300s)', () => {
    const invalidConfig = {
      intervalSeconds: 400, // Too high
      failureThreshold: 3,
    };

    const result = validateHealthCheckConfig(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['intervalSeconds']);
      expect(result.error.issues[0].message).toContain('at most 300');
    }
  });

  it('should reject threshold below minimum (1)', () => {
    const invalidConfig = {
      intervalSeconds: 30,
      failureThreshold: 0, // Too low
    };

    const result = validateHealthCheckConfig(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['failureThreshold']);
      expect(result.error.issues[0].message).toContain('at least 1');
    }
  });

  it('should reject threshold above maximum (10)', () => {
    const invalidConfig = {
      intervalSeconds: 30,
      failureThreshold: 15, // Too high
    };

    const result = validateHealthCheckConfig(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['failureThreshold']);
      expect(result.error.issues[0].message).toContain('at most 10');
    }
  });

  it('should accept minimum valid values (10s interval, 1 threshold)', () => {
    const validConfig = {
      intervalSeconds: 10,
      failureThreshold: 1,
    };

    const result = validateHealthCheckConfig(validConfig);
    expect(result.success).toBe(true);
  });

  it('should accept maximum valid values (300s interval, 10 threshold)', () => {
    const validConfig = {
      intervalSeconds: 300,
      failureThreshold: 10,
    };

    const result = validateHealthCheckConfig(validConfig);
    expect(result.success).toBe(true);
  });

  it('should reject missing fields', () => {
    const invalidConfig = {
      intervalSeconds: 30,
      // Missing failureThreshold
    };

    const result = validateHealthCheckConfig(invalidConfig);
    expect(result.success).toBe(false);
  });

  it('should reject non-integer values', () => {
    const invalidConfig = {
      intervalSeconds: 30.5, // Must be integer
      failureThreshold: 3,
    };

    const result = validateHealthCheckConfig(invalidConfig);
    expect(result.success).toBe(false);
  });
});
