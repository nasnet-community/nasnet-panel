/**
 * Network Detection Tests
 * Unit tests for WAN interface and gateway detection utilities (NAS-5.11)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectWanInterface, detectGateway } from './network-detection';
import { apolloClient } from '@nasnet/api-client/core';
import { DiagnosticError } from '../types/troubleshoot.types';

// Mock Apollo Client
vi.mock('@nasnet/api-client/core', () => ({
  apolloClient: {
    query: vi.fn(),
  },
}));

describe('Network Detection', () => {
  const mockRouterId = 'router-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectWanInterface', () => {
    it('should return WAN interface name from GraphQL query', async () => {
      const mockInterface = 'ether1';

      vi.mocked(apolloClient.query).mockResolvedValueOnce({
        data: {
          detectWanInterface: mockInterface,
        },
        loading: false,
        networkStatus: 7,
      } as any);

      const result = await detectWanInterface(mockRouterId);

      expect(result).toBe(mockInterface);
      expect(apolloClient.query).toHaveBeenCalledWith({
        query: expect.anything(),
        variables: { routerId: mockRouterId },
        fetchPolicy: 'network-only',
      });
    });

    it('should handle alternative WAN interface names', async () => {
      const mockInterface = 'ether2-gateway';

      vi.mocked(apolloClient.query).mockResolvedValueOnce({
        data: {
          detectWanInterface: mockInterface,
        },
        loading: false,
        networkStatus: 7,
      } as any);

      const result = await detectWanInterface(mockRouterId);

      expect(result).toBe(mockInterface);
    });

    it('should throw DiagnosticError when no default route is configured', async () => {
      vi.mocked(apolloClient.query).mockResolvedValueOnce({
        data: {
          detectWanInterface: null,
        },
        loading: false,
        networkStatus: 7,
      } as any);

      await expect(detectWanInterface(mockRouterId)).rejects.toThrow(DiagnosticError);
      await expect(detectWanInterface(mockRouterId)).rejects.toThrow('No default route configured');
    });

    it('should throw DiagnosticError when GraphQL query fails', async () => {
      vi.mocked(apolloClient.query).mockRejectedValueOnce(new Error('Network error'));

      await expect(detectWanInterface(mockRouterId)).rejects.toThrow(DiagnosticError);
      await expect(detectWanInterface(mockRouterId)).rejects.toThrow('Network error');
    });

    it('should use network-only fetch policy for fresh data', async () => {
      vi.mocked(apolloClient.query).mockResolvedValueOnce({
        data: {
          detectWanInterface: 'ether1',
        },
        loading: false,
        networkStatus: 7,
      } as any);

      await detectWanInterface(mockRouterId);

      expect(apolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({
          fetchPolicy: 'network-only',
        })
      );
    });
  });

  describe('detectGateway', () => {
    it('should return gateway IP from DHCP client', async () => {
      const mockGateway = '192.168.1.1';

      vi.mocked(apolloClient.query).mockResolvedValueOnce({
        data: {
          detectGateway: mockGateway,
        },
        loading: false,
        networkStatus: 7,
      } as any);

      const result = await detectGateway(mockRouterId);

      expect(result).toBe(mockGateway);
      expect(apolloClient.query).toHaveBeenCalledWith({
        query: expect.anything(),
        variables: { routerId: mockRouterId },
        fetchPolicy: 'network-only',
      });
    });

    it('should return gateway IP from static route when no DHCP', async () => {
      const mockGateway = '10.0.0.1';

      vi.mocked(apolloClient.query).mockResolvedValueOnce({
        data: {
          detectGateway: mockGateway,
        },
        loading: false,
        networkStatus: 7,
      } as any);

      const result = await detectGateway(mockRouterId);

      expect(result).toBe(mockGateway);
    });

    it('should return null when no gateway is found', async () => {
      vi.mocked(apolloClient.query).mockResolvedValueOnce({
        data: {
          detectGateway: null,
        },
        loading: false,
        networkStatus: 7,
      } as any);

      const result = await detectGateway(mockRouterId);

      expect(result).toBeNull();
    });

    it('should handle empty gateway string', async () => {
      vi.mocked(apolloClient.query).mockResolvedValueOnce({
        data: {
          detectGateway: '',
        },
        loading: false,
        networkStatus: 7,
      } as any);

      const result = await detectGateway(mockRouterId);

      expect(result).toBeNull();
    });

    it('should throw DiagnosticError when GraphQL query fails', async () => {
      vi.mocked(apolloClient.query).mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(detectGateway(mockRouterId)).rejects.toThrow(DiagnosticError);
      await expect(detectGateway(mockRouterId)).rejects.toThrow('Connection timeout');
    });

    it('should handle various gateway IP formats', async () => {
      const gatewayFormats = ['192.168.1.1', '10.0.0.1', '172.16.0.1', '8.8.8.8'];

      for (const gateway of gatewayFormats) {
        vi.mocked(apolloClient.query).mockResolvedValueOnce({
          data: {
            detectGateway: gateway,
          },
          loading: false,
          networkStatus: 7,
        } as any);

        const result = await detectGateway(mockRouterId);
        expect(result).toBe(gateway);
      }
    });
  });

  describe('Error Handling', () => {
    it('should preserve DiagnosticError when thrown', async () => {
      vi.mocked(apolloClient.query).mockResolvedValueOnce({
        data: {
          detectWanInterface: null,
        },
        loading: false,
        networkStatus: 7,
      } as any);

      try {
        await detectWanInterface(mockRouterId);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DiagnosticError);
        expect((error as DiagnosticError).code).toBe('NO_DEFAULT_ROUTE');
      }
    });

    it('should wrap generic errors in DiagnosticError', async () => {
      vi.mocked(apolloClient.query).mockRejectedValueOnce(new Error('Generic error'));

      try {
        await detectWanInterface(mockRouterId);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DiagnosticError);
        expect((error as DiagnosticError).code).toBe('DETECTION_FAILED');
      }
    });
  });
});
