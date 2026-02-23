import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FIX_REGISTRY, getFix, storeDnsConfigForRollback } from './fix-registry';
import type { DiagnosticResult } from '../types/troubleshoot.types';

/**
 * @description Unit tests for fix registry and utility functions.
 * Tests fix lookup, DNS rollback capture, and registry structure.
 */

describe('FIX_REGISTRY', () => {
  it('should contain all required issue codes', () => {
    const requiredIssues = [
      'WAN_LINK_DOWN',
      'WAN_DISABLED',
      'GATEWAY_UNREACHABLE',
      'GATEWAY_TIMEOUT',
      'NO_INTERNET',
      'INTERNET_TIMEOUT',
      'DNS_FAILED',
      'DNS_TIMEOUT',
      'NAT_MISSING',
      'NAT_DISABLED',
    ];

    for (const issue of requiredIssues) {
      expect(FIX_REGISTRY[issue]).toBeDefined();
      expect(FIX_REGISTRY[issue].issueCode).toBe(issue);
    }
  });

  it('should have consistent structure for manual fixes', () => {
    const manualFixes = [
      FIX_REGISTRY.WAN_LINK_DOWN,
      FIX_REGISTRY.NO_INTERNET,
      FIX_REGISTRY.INTERNET_TIMEOUT,
    ];

    for (const fix of manualFixes) {
      expect(fix.isManualFix).toBe(true);
      expect(fix.command).toBeNull();
      expect(fix.confidence).toBeNull();
      expect(fix.manualSteps).toBeDefined();
      expect(fix.manualSteps!.length).toBeGreaterThan(0);
    }
  });

  it('should have consistent structure for automatic fixes', () => {
    const autoFixes = [
      FIX_REGISTRY.WAN_DISABLED,
      FIX_REGISTRY.GATEWAY_UNREACHABLE,
      FIX_REGISTRY.DNS_FAILED,
      FIX_REGISTRY.NAT_MISSING,
    ];

    for (const fix of autoFixes) {
      expect(fix.isManualFix).toBe(false);
      expect(fix.command).toBeDefined();
      expect(fix.confidence).toBeDefined();
      expect(['high', 'medium']).toContain(fix.confidence);
    }
  });

  it('should have confirmation required for dangerous fixes', () => {
    const dangerousFixes = [
      'WAN_DISABLED',
      'GATEWAY_UNREACHABLE',
      'GATEWAY_TIMEOUT',
      'DNS_FAILED',
      'DNS_TIMEOUT',
      'NAT_MISSING',
      'NAT_DISABLED',
    ];

    for (const issueCode of dangerousFixes) {
      expect(FIX_REGISTRY[issueCode].requiresConfirmation).toBe(true);
    }
  });

  it('WAN_DISABLED should have rollback command', () => {
    const fix = FIX_REGISTRY.WAN_DISABLED;
    expect(fix.rollbackCommand).toBeDefined();
    expect(fix.rollbackCommand).toContain('/interface/disable');
  });

  it('NAT fixes should have rollback support', () => {
    const natMissing = FIX_REGISTRY.NAT_MISSING;
    const natDisabled = FIX_REGISTRY.NAT_DISABLED;

    expect(natMissing.rollbackCommand).toBeDefined();
    expect(natDisabled.rollbackCommand).toBeDefined();
  });

  it('should have actionable descriptions', () => {
    for (const [issueCode, fix] of Object.entries(FIX_REGISTRY)) {
      expect(fix.description).toBeDefined();
      expect(fix.description.length).toBeGreaterThan(10);
      expect(fix.title).toBeDefined();
      expect(fix.title.length).toBeGreaterThan(3);
    }
  });

  it('should organize fixes by category in comments', () => {
    expect(FIX_REGISTRY.WAN_LINK_DOWN).toBeDefined();
    expect(FIX_REGISTRY.WAN_DISABLED).toBeDefined();
    expect(FIX_REGISTRY.GATEWAY_UNREACHABLE).toBeDefined();
    expect(FIX_REGISTRY.GATEWAY_TIMEOUT).toBeDefined();
    expect(FIX_REGISTRY.DNS_FAILED).toBeDefined();
    expect(FIX_REGISTRY.NAT_MISSING).toBeDefined();
  });
});

describe('getFix', () => {
  it('should return fix when issue code is found', () => {
    const result: DiagnosticResult = {
      success: false,
      message: 'DNS failed',
      issueCode: 'DNS_FAILED',
      executionTimeMs: 0,
    };

    const fix = getFix('dns', result);

    expect(fix).toBeDefined();
    expect(fix?.issueCode).toBe('DNS_FAILED');
    expect(fix?.title).toBe('Switch to Cloudflare DNS');
  });

  it('should return undefined when issue code is not found', () => {
    const result: DiagnosticResult = {
      success: false,
      message: 'Unknown issue',
      issueCode: 'UNKNOWN_ISSUE',
      executionTimeMs: 0,
    };

    const fix = getFix('unknown', result);

    expect(fix).toBeUndefined();
  });

  it('should return undefined when result has no issue code', () => {
    const result: DiagnosticResult = {
      success: true,
      message: 'All good',
      issueCode: undefined,
      executionTimeMs: 0,
    };

    const fix = getFix('wan', result);

    expect(fix).toBeUndefined();
  });

  it('should handle all registry issue codes correctly', () => {
    for (const issueCode of Object.keys(FIX_REGISTRY)) {
      const result: DiagnosticResult = {
        success: false,
        message: 'Test',
        issueCode: issueCode,
        executionTimeMs: 0,
      };

      const fix = getFix('test', result);

      expect(fix).toBeDefined();
      expect(fix?.issueCode).toBe(issueCode);
    }
  });

  it('should prioritize issue code over step ID', () => {
    const result: DiagnosticResult = {
      success: false,
      message: 'NAT issue',
      issueCode: 'NAT_DISABLED',
      executionTimeMs: 0,
    };

    const fixDns = getFix('dns', result); // Step is DNS
    const fixNat = getFix('nat', result); // Step is NAT

    expect(fixDns?.issueCode).toBe('NAT_DISABLED'); // Should use issue code, not step
    expect(fixNat?.issueCode).toBe('NAT_DISABLED'); // Should use issue code, not step
    expect(fixDns).toEqual(fixNat); // Should return same fix
  });
});

describe('storeDnsConfigForRollback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should capture DNS server configuration', async () => {
    const mockExecuteCommand = vi.fn().mockResolvedValue({
      servers: '8.8.8.8,8.8.4.4',
    });

    const rollbackCmd = await storeDnsConfigForRollback('router-123', mockExecuteCommand);

    expect(rollbackCmd).toBe('/ip/dns/set servers=8.8.8.8,8.8.4.4');
    expect(mockExecuteCommand).toHaveBeenCalledWith(
      'router-123',
      '/ip/dns/print'
    );
  });

  it('should return null if servers field is missing', async () => {
    const mockExecuteCommand = vi.fn().mockResolvedValue({
      // No servers field
      status: 'enabled',
    });

    const rollbackCmd = await storeDnsConfigForRollback('router-123', mockExecuteCommand);

    expect(rollbackCmd).toBeNull();
  });

  it('should return null on command execution error', async () => {
    const mockExecuteCommand = vi.fn().mockRejectedValue(
      new Error('Router offline')
    );

    const rollbackCmd = await storeDnsConfigForRollback('router-123', mockExecuteCommand);

    expect(rollbackCmd).toBeNull();
  });

  it('should handle empty servers list', async () => {
    const mockExecuteCommand = vi.fn().mockResolvedValue({
      servers: '',
    });

    const rollbackCmd = await storeDnsConfigForRollback('router-123', mockExecuteCommand);

    expect(rollbackCmd).toBe('/ip/dns/set servers=');
  });

  it('should preserve server order in rollback command', async () => {
    const servers = '1.1.1.1,1.0.0.1,8.8.8.8';
    const mockExecuteCommand = vi.fn().mockResolvedValue({
      servers: servers,
    });

    const rollbackCmd = await storeDnsConfigForRollback('router-123', mockExecuteCommand);

    expect(rollbackCmd).toBe(`/ip/dns/set servers=${servers}`);
  });

  it('should log warning on error', async () => {
    const mockExecuteCommand = vi.fn().mockRejectedValue(
      new Error('DNS query failed')
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await storeDnsConfigForRollback('router-123', mockExecuteCommand);

    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to capture DNS config for rollback:',
      'DNS query failed'
    );

    warnSpy.mockRestore();
  });

  it('should handle non-Error exceptions', async () => {
    const mockExecuteCommand = vi.fn().mockRejectedValue('Generic error string');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const rollbackCmd = await storeDnsConfigForRollback('router-123', mockExecuteCommand);

    expect(rollbackCmd).toBeNull();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
