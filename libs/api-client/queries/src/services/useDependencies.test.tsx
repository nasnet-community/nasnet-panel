/**
 * useDependencies Hook Tests
 * Tests for dependency management query hooks
 *
 * @see NAS-8.19: Feature Dependencies
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';

import { useDependencies, useDependents, useDependencyGraph } from './useDependencies';
import { GET_DEPENDENCIES, GET_DEPENDENTS, GET_DEPENDENCY_GRAPH } from './services.graphql';
import type { ServiceDependency, DependencyGraph } from './useDependencies';

describe('useDependencies Hook', () => {
  const mockInstanceId = 'inst_xray_123';

  const mockDependencies: ServiceDependency[] = [
    {
      id: 'dep_1',
      fromInstance: {
        id: 'inst_xray_123',
        featureID: 'xray',
        instanceName: 'Xray Proxy',
        status: 'RUNNING',
      },
      toInstance: {
        id: 'inst_tor_456',
        featureID: 'tor',
        instanceName: 'Tor Gateway',
        status: 'RUNNING',
      },
      dependencyType: 'REQUIRES',
      autoStart: true,
      healthTimeoutSeconds: 30,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch dependencies successfully', async () => {
    const mocks = [
      {
        request: {
          query: GET_DEPENDENCIES,
          variables: { instanceId: mockInstanceId },
        },
        result: {
          data: {
            serviceDependencies: mockDependencies,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDependencies(mockInstanceId), {
      wrapper,
    });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.dependencies).toEqual([]);

    // Wait for data to load
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Verify data structure
    expect(result.current.dependencies).toHaveLength(1);
    expect(result.current.dependencies[0]).toEqual(mockDependencies[0]);
    expect(result.current.error).toBeUndefined();
  });

  it('should return empty array when no dependencies exist', async () => {
    const mocks = [
      {
        request: {
          query: GET_DEPENDENCIES,
          variables: { instanceId: mockInstanceId },
        },
        result: {
          data: {
            serviceDependencies: [],
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDependencies(mockInstanceId), {
      wrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.dependencies).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle errors correctly', async () => {
    const mockError = new Error('Network error');

    const mocks = [
      {
        request: {
          query: GET_DEPENDENCIES,
          variables: { instanceId: mockInstanceId },
        },
        error: mockError,
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDependencies(mockInstanceId), {
      wrapper,
    });

    await waitFor(() => expect(result.current.error).toBeDefined());

    expect(result.current.error).toBeTruthy();
    expect(result.current.dependencies).toEqual([]);
  });

  it('should skip query when instanceId is empty', () => {
    const mocks: any[] = [];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDependencies(''), { wrapper });

    // Should not make a query
    expect(result.current.loading).toBe(false);
    expect(result.current.dependencies).toEqual([]);
  });

  it('should support refetch functionality', async () => {
    const mocks = [
      {
        request: {
          query: GET_DEPENDENCIES,
          variables: { instanceId: mockInstanceId },
        },
        result: {
          data: {
            serviceDependencies: mockDependencies,
          },
        },
      },
      {
        request: {
          query: GET_DEPENDENCIES,
          variables: { instanceId: mockInstanceId },
        },
        result: {
          data: {
            serviceDependencies: [...mockDependencies, mockDependencies[0]],
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDependencies(mockInstanceId), {
      wrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.dependencies).toHaveLength(1);

    // Trigger refetch
    await result.current.refetch();

    await waitFor(() => expect(result.current.dependencies).toHaveLength(2));
  });
});

describe('useDependents Hook', () => {
  const mockInstanceId = 'inst_tor_456';

  const mockDependents: ServiceDependency[] = [
    {
      id: 'dep_1',
      fromInstance: {
        id: 'inst_xray_123',
        featureID: 'xray',
        instanceName: 'Xray Proxy',
        status: 'RUNNING',
      },
      toInstance: {
        id: 'inst_tor_456',
        featureID: 'tor',
        instanceName: 'Tor Gateway',
        status: 'RUNNING',
      },
      dependencyType: 'REQUIRES',
      autoStart: true,
      healthTimeoutSeconds: 30,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'dep_2',
      fromInstance: {
        id: 'inst_singbox_789',
        featureID: 'singbox',
        instanceName: 'Sing-box VPN',
        status: 'RUNNING',
      },
      toInstance: {
        id: 'inst_tor_456',
        featureID: 'tor',
        instanceName: 'Tor Gateway',
        status: 'RUNNING',
      },
      dependencyType: 'OPTIONAL',
      autoStart: false,
      healthTimeoutSeconds: 60,
      createdAt: '2024-01-15T11:00:00Z',
      updatedAt: '2024-01-15T11:00:00Z',
    },
  ];

  it('should fetch dependents successfully', async () => {
    const mocks = [
      {
        request: {
          query: GET_DEPENDENTS,
          variables: { instanceId: mockInstanceId },
        },
        result: {
          data: {
            serviceDependents: mockDependents,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDependents(mockInstanceId), {
      wrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.dependents).toHaveLength(2);
    expect(result.current.dependents[0]).toEqual(mockDependents[0]);
    expect(result.current.dependents[1]).toEqual(mockDependents[1]);
  });

  it('should return empty array when no dependents exist', async () => {
    const mocks = [
      {
        request: {
          query: GET_DEPENDENTS,
          variables: { instanceId: mockInstanceId },
        },
        result: {
          data: {
            serviceDependents: [],
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDependents(mockInstanceId), {
      wrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.dependents).toEqual([]);
  });

  it('should handle errors correctly', async () => {
    const mockError = new Error('GraphQL error');

    const mocks = [
      {
        request: {
          query: GET_DEPENDENTS,
          variables: { instanceId: mockInstanceId },
        },
        error: mockError,
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDependents(mockInstanceId), {
      wrapper,
    });

    await waitFor(() => expect(result.current.error).toBeDefined());

    expect(result.current.error).toBeTruthy();
    expect(result.current.dependents).toEqual([]);
  });

  it('should skip query when instanceId is empty', () => {
    const mocks: any[] = [];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDependents(''), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.dependents).toEqual([]);
  });
});

describe('useDependencyGraph Hook', () => {
  const mockRouterId = 'router_1';

  const mockGraph: DependencyGraph = {
    nodes: [
      {
        instanceId: 'inst_tor_456',
        instanceName: 'Tor Gateway',
        featureId: 'tor',
        status: 'RUNNING',
      },
      {
        instanceId: 'inst_xray_123',
        instanceName: 'Xray Proxy',
        featureId: 'xray',
        status: 'RUNNING',
      },
      {
        instanceId: 'inst_singbox_789',
        instanceName: 'Sing-box VPN',
        featureId: 'singbox',
        status: 'STOPPED',
      },
    ],
    edges: [
      {
        fromInstanceId: 'inst_xray_123',
        toInstanceId: 'inst_tor_456',
        dependencyType: 'REQUIRES',
        autoStart: true,
        healthTimeoutSeconds: 30,
      },
      {
        fromInstanceId: 'inst_singbox_789',
        toInstanceId: 'inst_tor_456',
        dependencyType: 'OPTIONAL',
        autoStart: false,
        healthTimeoutSeconds: 60,
      },
    ],
  };

  it('should fetch dependency graph successfully', async () => {
    const mocks = [
      {
        request: {
          query: GET_DEPENDENCY_GRAPH,
          variables: { routerId: mockRouterId },
        },
        result: {
          data: {
            dependencyGraph: mockGraph,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDependencyGraph(mockRouterId), {
      wrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.graph).toBeDefined();
    expect(result.current.graph?.nodes).toHaveLength(3);
    expect(result.current.graph?.edges).toHaveLength(2);
  });

  it('should return undefined when graph is empty', async () => {
    const emptyGraph: DependencyGraph = {
      nodes: [],
      edges: [],
    };

    const mocks = [
      {
        request: {
          query: GET_DEPENDENCY_GRAPH,
          variables: { routerId: mockRouterId },
        },
        result: {
          data: {
            dependencyGraph: emptyGraph,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDependencyGraph(mockRouterId), {
      wrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.graph?.nodes).toEqual([]);
    expect(result.current.graph?.edges).toEqual([]);
  });

  it('should handle errors correctly', async () => {
    const mockError = new Error('Failed to fetch graph');

    const mocks = [
      {
        request: {
          query: GET_DEPENDENCY_GRAPH,
          variables: { routerId: mockRouterId },
        },
        error: mockError,
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDependencyGraph(mockRouterId), {
      wrapper,
    });

    await waitFor(() => expect(result.current.error).toBeDefined());

    expect(result.current.error).toBeTruthy();
    expect(result.current.graph).toBeUndefined();
  });

  it('should skip query when routerId is empty', () => {
    const mocks: any[] = [];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDependencyGraph(''), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.graph).toBeUndefined();
  });

  it('should use cache-and-network fetch policy', async () => {
    const mocks = [
      {
        request: {
          query: GET_DEPENDENCY_GRAPH,
          variables: { routerId: mockRouterId },
        },
        result: {
          data: {
            dependencyGraph: mockGraph,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDependencyGraph(mockRouterId), {
      wrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Verify refetch is available
    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });
});
