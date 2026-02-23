import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { describe, it, expect } from 'vitest';
import { ReactNode } from 'react';
import * as React from 'react';
import {
  useConfigureHealthCheck,
  validateHealthCheckConfig,
  CONFIGURE_HEALTH_CHECK_MUTATION,
} from './useConfigureHealthCheck';

function createWrapper(mocks: any[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(MockedProvider, { mocks, addTypename: false }, children);
  };
}

describe('useConfigureHealthCheck', () => {
  const instanceID = 'test-instance-456';

  it('should configure health check successfully', async () => {
    const mocks = [
      {
        request: {
          query: CONFIGURE_HEALTH_CHECK_MUTATION,
          variables: {
            input: {
              instanceID,
              intervalSeconds: 30,
              failureThreshold: 5,
            },
          },
        },
        result: {
          data: {
            configureHealthCheck: {
              status: 'healthy',
              processAlive: true,
              connectionStatus: 'connected',
              latencyMs: 10,
              lastHealthy: new Date().toISOString(),
              consecutiveFails: 0,
              uptimeSeconds: 3600,
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
        input: {
          instanceID,
          intervalSeconds: 30,
          failureThreshold: 5,
        },
      },
    });

    expect(response.data?.configureHealthCheck).toBeDefined();
    expect(response.data?.configureHealthCheck?.status).toBe('healthy');
    expect(response.data?.configureHealthCheck?.processAlive).toBe(true);
  });

  it('should handle mutation errors', async () => {
    const mocks = [
      {
        request: {
          query: CONFIGURE_HEALTH_CHECK_MUTATION,
          variables: {
            input: {
              instanceID,
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
          input: {
            instanceID,
            intervalSeconds: 60,
            failureThreshold: 3,
          },
        },
      })
    ).rejects.toThrow('Instance not found');
  });
});

describe('validateHealthCheckConfig', () => {
  it('should return empty array for valid health check config', () => {
    const validConfig = {
      intervalSeconds: 30,
      failureThreshold: 5,
    };

    const errors = validateHealthCheckConfig(validConfig);
    expect(errors).toEqual([]);
    expect(errors.length).toBe(0);
  });

  it('should reject interval below minimum (10s)', () => {
    const invalidConfig = {
      intervalSeconds: 5, // Too low
      failureThreshold: 3,
    };

    const errors = validateHealthCheckConfig(invalidConfig);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('between 10 and 300');
  });

  it('should reject interval above maximum (300s)', () => {
    const invalidConfig = {
      intervalSeconds: 400, // Too high
      failureThreshold: 3,
    };

    const errors = validateHealthCheckConfig(invalidConfig);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('between 10 and 300');
  });

  it('should reject threshold below minimum (1)', () => {
    const invalidConfig = {
      intervalSeconds: 30,
      failureThreshold: 0, // Too low
    };

    const errors = validateHealthCheckConfig(invalidConfig);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('between 1 and 10');
  });

  it('should reject threshold above maximum (10)', () => {
    const invalidConfig = {
      intervalSeconds: 30,
      failureThreshold: 15, // Too high
    };

    const errors = validateHealthCheckConfig(invalidConfig);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('between 1 and 10');
  });

  it('should accept minimum valid values (10s interval, 1 threshold)', () => {
    const validConfig = {
      intervalSeconds: 10,
      failureThreshold: 1,
    };

    const errors = validateHealthCheckConfig(validConfig);
    expect(errors).toEqual([]);
  });

  it('should accept maximum valid values (300s interval, 10 threshold)', () => {
    const validConfig = {
      intervalSeconds: 300,
      failureThreshold: 10,
    };

    const errors = validateHealthCheckConfig(validConfig);
    expect(errors).toEqual([]);
  });
});
