import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectISP, getWanIpForISPDetection } from './isp-detection';

/**
 * @description Unit tests for ISP detection utilities.
 * Tests IP-to-ISP lookup, normalization, support info retrieval, and WAN IP extraction.
 */

// Mock fetch for ip-api.com
global.fetch = vi.fn();

describe('detectISP', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect ISP from public IP', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        isp: 'Comcast Inc',
        org: 'Comcast ISP',
      }),
    });

    const result = await detectISP('203.0.113.42');

    expect(result.detected).toBe(true);
    expect(result.name).toBe('Comcast Inc');
    expect(result.supportPhone).toBe('1-800-934-6489');
    expect(result.supportUrl).toBe('https://www.xfinity.com/support');
  });

  it('should handle unknown ISP with graceful fallback', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        isp: 'UnknownISP Corp',
        org: 'UnknownISP',
      }),
    });

    const result = await detectISP('203.0.113.1');

    expect(result.detected).toBe(true);
    expect(result.name).toBe('UnknownISP Corp');
    expect(result.supportPhone).toBeNull();
    expect(result.supportUrl).toBeNull();
  });

  it('should handle HTTP error responses gracefully', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 429, // Rate limited
    });

    const result = await detectISP('203.0.113.1');

    expect(result.detected).toBe(false);
    expect(result.name).toBeNull();
    expect(result.supportPhone).toBeNull();
    expect(result.supportUrl).toBeNull();
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network timeout'));

    const result = await detectISP('203.0.113.1');

    expect(result.detected).toBe(false);
    expect(result.name).toBeNull();
  });

  it('should normalize ISP names for matching', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        isp: 'AT&T Communications Corp, Inc.',
        org: 'AT&T Inc.',
      }),
    });

    const result = await detectISP('203.0.113.1');

    expect(result.detected).toBe(true);
    expect(result.supportPhone).toBe('1-800-288-2020');
  });

  it('should match Verizon ISP with support info', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        isp: 'Verizon Communications',
        org: 'Verizon',
      }),
    });

    const result = await detectISP('203.0.113.1');

    expect(result.detected).toBe(true);
    expect(result.name).toBe('Verizon Communications');
    expect(result.supportPhone).toBe('1-800-837-4966');
  });

  it('should match Spectrum ISP with support info', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        isp: 'Spectrum',
        org: 'Charter Spectrum',
      }),
    });

    const result = await detectISP('203.0.113.1');

    expect(result.detected).toBe(true);
    expect(result.supportPhone).toBe('1-833-267-6094');
  });

  it('should handle missing ISP info from response', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        country: 'US',
        // No isp or org field
      }),
    });

    const result = await detectISP('203.0.113.1');

    expect(result.detected).toBe(false);
    expect(result.name).toBeNull();
  });

  it('should fetch with correct ip-api.com URL', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ isp: 'TestISP' }),
    });

    await detectISP('203.0.113.42');

    expect(global.fetch).toHaveBeenCalledWith('http://ip-api.com/json/203.0.113.42?fields=isp,org');
  });
});

describe('getWanIpForISPDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract WAN IP from DHCP client', async () => {
    const mockExecuteCommand = vi.fn().mockResolvedValue([{ address: '203.0.113.42/24' }]);
    const mockDetectWanInterface = vi.fn();

    const result = await getWanIpForISPDetection(
      'router-123',
      mockExecuteCommand,
      mockDetectWanInterface
    );

    expect(result).toBe('203.0.113.42');
    expect(mockExecuteCommand).toHaveBeenCalledWith(
      'router-123',
      '/ip/dhcp-client/print where status=bound'
    );
    expect(mockDetectWanInterface).not.toHaveBeenCalled(); // Should not need fallback
  });

  it('should fall back to WAN interface addresses if DHCP has no IP', async () => {
    const mockExecuteCommand = vi
      .fn()
      .mockResolvedValueOnce([]) // DHCP has no addresses
      .mockResolvedValueOnce([{ address: '192.168.1.100/24' }]); // WAN interface addresses
    const mockDetectWanInterface = vi.fn().mockResolvedValue('ether1');

    const result = await getWanIpForISPDetection(
      'router-123',
      mockExecuteCommand,
      mockDetectWanInterface
    );

    expect(result).toBe('192.168.1.100');
    expect(mockDetectWanInterface).toHaveBeenCalledWith('router-123');
    expect(mockExecuteCommand).toHaveBeenCalledTimes(2);
  });

  it('should return null if no WAN IP is found', async () => {
    const mockExecuteCommand = vi
      .fn()
      .mockResolvedValueOnce([]) // DHCP empty
      .mockResolvedValueOnce([]); // WAN interface empty
    const mockDetectWanInterface = vi.fn().mockResolvedValue('ether1');

    const result = await getWanIpForISPDetection(
      'router-123',
      mockExecuteCommand,
      mockDetectWanInterface
    );

    expect(result).toBeNull();
  });

  it('should handle command execution errors gracefully', async () => {
    const mockExecuteCommand = vi.fn().mockRejectedValue(new Error('Connection lost'));
    const mockDetectWanInterface = vi.fn();

    const result = await getWanIpForISPDetection(
      'router-123',
      mockExecuteCommand,
      mockDetectWanInterface
    );

    expect(result).toBeNull();
  });

  it('should handle DHCP client with undefined address field', async () => {
    const mockExecuteCommand = vi
      .fn()
      .mockResolvedValueOnce([{ name: 'dhcp1' }]) // DHCP has no address
      .mockResolvedValueOnce([{ address: '10.0.0.5/24' }]);
    const mockDetectWanInterface = vi.fn().mockResolvedValue('ether1');

    const result = await getWanIpForISPDetection(
      'router-123',
      mockExecuteCommand,
      mockDetectWanInterface
    );

    expect(result).toBe('10.0.0.5');
  });

  it('should extract IP from CIDR notation correctly', async () => {
    const mockExecuteCommand = vi.fn().mockResolvedValue([{ address: '198.51.100.1/32' }]);
    const mockDetectWanInterface = vi.fn();

    const result = await getWanIpForISPDetection(
      'router-123',
      mockExecuteCommand,
      mockDetectWanInterface
    );

    expect(result).toBe('198.51.100.1');
  });

  it('should use first DHCP client result if multiple exist', async () => {
    const mockExecuteCommand = vi
      .fn()
      .mockResolvedValue([{ address: '203.0.113.10/24' }, { address: '203.0.113.11/24' }]);
    const mockDetectWanInterface = vi.fn();

    const result = await getWanIpForISPDetection(
      'router-123',
      mockExecuteCommand,
      mockDetectWanInterface
    );

    expect(result).toBe('203.0.113.10');
  });

  it('should handle detection failures with error logging', async () => {
    const mockExecuteCommand = vi.fn().mockRejectedValue(new Error('Router unreachable'));
    const mockDetectWanInterface = vi.fn();

    // Spy on console.warn
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await getWanIpForISPDetection(
      'router-123',
      mockExecuteCommand,
      mockDetectWanInterface
    );

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to retrieve WAN IP'),
      expect.any(String)
    );

    warnSpy.mockRestore();
  });
});
