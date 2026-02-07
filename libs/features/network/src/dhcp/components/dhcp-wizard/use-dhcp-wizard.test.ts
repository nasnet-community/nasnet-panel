/**
 * DHCP Wizard Hook Tests
 * Tests for useDHCPWizard hook validation functions
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';

// Mock dependencies
vi.mock('@nasnet/state/stores', () => ({
  useConnectionStore: vi.fn(() => ({
    currentRouterIp: '192.168.1.1',
  })),
}));

vi.mock('@nasnet/api-client/queries', () => ({
  useCreateDHCPServer: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

// Import after mocks
import { useDHCPWizard } from './use-dhcp-wizard';

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useDHCPWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hook initialization', () => {
    it('should initialize with 4 steps', () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.stepper.steps).toHaveLength(4);
      expect(result.current.stepper.steps[0].id).toBe('interface');
      expect(result.current.stepper.steps[1].id).toBe('pool');
      expect(result.current.stepper.steps[2].id).toBe('network');
      expect(result.current.stepper.steps[3].id).toBe('review');
    });

    it('should start at step 0 (interface)', () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.stepper.currentStepIndex).toBe(0);
      expect(result.current.stepper.currentStep.id).toBe('interface');
    });

    it('should not be creating initially', () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isCreating).toBe(false);
    });
  });

  describe('interface step validation', () => {
    it('should fail validation when interface is not selected', async () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      const validation = await result.current.stepper.steps[0].validate?.({});

      expect(validation?.valid).toBe(false);
      expect(validation?.errors.interface).toBeDefined();
    });

    it('should pass validation when interface is selected', async () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      const validation = await result.current.stepper.steps[0].validate?.({
        interface: 'ether1',
        interfaceIP: '192.168.1.1/24',
      });

      expect(validation?.valid).toBe(true);
      expect(Object.keys(validation?.errors || {})).toHaveLength(0);
    });
  });

  describe('pool step validation', () => {
    it('should fail validation when poolStart is missing', async () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      const validation = await result.current.stepper.steps[1].validate?.({
        poolEnd: '192.168.1.254',
      });

      expect(validation?.valid).toBe(false);
      expect(validation?.errors.poolStart).toBeDefined();
    });

    it('should fail validation when poolEnd is missing', async () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      const validation = await result.current.stepper.steps[1].validate?.({
        poolStart: '192.168.1.100',
      });

      expect(validation?.valid).toBe(false);
      expect(validation?.errors.poolEnd).toBeDefined();
    });

    it('should fail validation when pool range is invalid (end < start)', async () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      const validation = await result.current.stepper.steps[1].validate?.({
        poolStart: '192.168.1.200',
        poolEnd: '192.168.1.100',
      });

      expect(validation?.valid).toBe(false);
      expect(validation?.errors.poolEnd).toBeDefined();
    });

    it('should pass validation when pool range is valid', async () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      const validation = await result.current.stepper.steps[1].validate?.({
        poolStart: '192.168.1.100',
        poolEnd: '192.168.1.254',
        interfaceIP: '192.168.1.1/24',
      });

      expect(validation?.valid).toBe(true);
      expect(Object.keys(validation?.errors || {})).toHaveLength(0);
    });

    it('should fail validation when pool overlaps with interface IP', async () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      const validation = await result.current.stepper.steps[1].validate?.({
        poolStart: '192.168.1.1',
        poolEnd: '192.168.1.254',
        interfaceIP: '192.168.1.1/24',
      });

      expect(validation?.valid).toBe(false);
      expect(validation?.errors.poolStart).toBeDefined();
      expect(validation?.errors.poolEnd).toBeDefined();
    });

    it('should fail validation when pool is not in same subnet as interface', async () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      const validation = await result.current.stepper.steps[1].validate?.({
        poolStart: '192.168.2.100',
        poolEnd: '192.168.2.254',
        interfaceIP: '192.168.1.1/24',
      });

      expect(validation?.valid).toBe(false);
      expect(validation?.errors.poolStart).toBeDefined();
      expect(validation?.errors.poolEnd).toBeDefined();
    });
  });

  describe('network step validation', () => {
    it('should fail validation when gateway is missing', async () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      const validation = await result.current.stepper.steps[2].validate?.({
        dnsServers: ['8.8.8.8'],
        leaseTime: '1d',
      });

      expect(validation?.valid).toBe(false);
      expect(validation?.errors.gateway).toBeDefined();
    });

    it('should fail validation when DNS servers are missing', async () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      const validation = await result.current.stepper.steps[2].validate?.({
        gateway: '192.168.1.1',
        leaseTime: '1d',
      });

      expect(validation?.valid).toBe(false);
      expect(validation?.errors.dnsServers).toBeDefined();
    });

    it('should fail validation when DNS servers array is empty', async () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      const validation = await result.current.stepper.steps[2].validate?.({
        gateway: '192.168.1.1',
        dnsServers: [],
        leaseTime: '1d',
      });

      expect(validation?.valid).toBe(false);
      expect(validation?.errors.dnsServers).toBeDefined();
    });

    it('should fail validation when more than 3 DNS servers', async () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      const validation = await result.current.stepper.steps[2].validate?.({
        gateway: '192.168.1.1',
        dnsServers: ['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1'],
        leaseTime: '1d',
      });

      expect(validation?.valid).toBe(false);
      expect(validation?.errors.dnsServers).toBeDefined();
    });

    it('should fail validation when lease time is missing', async () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      const validation = await result.current.stepper.steps[2].validate?.({
        gateway: '192.168.1.1',
        dnsServers: ['8.8.8.8'],
      });

      expect(validation?.valid).toBe(false);
      expect(validation?.errors.leaseTime).toBeDefined();
    });

    it('should pass validation with valid network settings', async () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      const validation = await result.current.stepper.steps[2].validate?.({
        gateway: '192.168.1.1',
        dnsServers: ['8.8.8.8', '8.8.4.4'],
        leaseTime: '1d',
        domain: 'home.local',
        ntpServer: 'pool.ntp.org',
      });

      expect(validation?.valid).toBe(true);
      expect(Object.keys(validation?.errors || {})).toHaveLength(0);
    });

    it('should pass validation with 1-3 DNS servers', async () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      // 1 DNS server
      let validation = await result.current.stepper.steps[2].validate?.({
        gateway: '192.168.1.1',
        dnsServers: ['8.8.8.8'],
        leaseTime: '1d',
      });
      expect(validation?.valid).toBe(true);

      // 2 DNS servers
      validation = await result.current.stepper.steps[2].validate?.({
        gateway: '192.168.1.1',
        dnsServers: ['8.8.8.8', '8.8.4.4'],
        leaseTime: '1d',
      });
      expect(validation?.valid).toBe(true);

      // 3 DNS servers
      validation = await result.current.stepper.steps[2].validate?.({
        gateway: '192.168.1.1',
        dnsServers: ['8.8.8.8', '8.8.4.4', '1.1.1.1'],
        leaseTime: '1d',
      });
      expect(validation?.valid).toBe(true);
    });
  });

  describe('review step', () => {
    it('should have no validation function', () => {
      const { result } = renderHook(() => useDHCPWizard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.stepper.steps[3].validate).toBeUndefined();
    });
  });
});
