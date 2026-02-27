import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyFixCommand } from './fix-applicator';
import * as apiClient from '@nasnet/api-client/core';
import type { FixSuggestion } from '../types/troubleshoot.types';

/**
 * @description Unit tests for fix-applicator service.
 * Tests automatic fix application, manual fix rejection, and error handling.
 */

// Mock the Apollo Client
vi.mock('@nasnet/api-client/core', () => ({
  apolloClient: {
    mutate: vi.fn(),
  },
}));

vi.mock('@nasnet/api-client/queries', () => ({
  APPLY_TROUBLESHOOT_FIX: 'MOCK_MUTATION',
}));

describe('applyFixCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should apply automatic fix successfully', async () => {
    const fix: FixSuggestion = {
      issueCode: 'WAN_DISABLED',
      title: 'Enable WAN Interface',
      description: 'Enable WAN to restore connectivity',
      command: '/interface/enable [find where default-name~"ether1"]',
      confidence: 'high',
      requiresConfirmation: true,
      isManualFix: false,
    };

    vi.spyOn(apiClient.apolloClient, 'mutate').mockResolvedValue({
      data: {
        applyTroubleshootFix: {
          success: true,
          message: 'WAN interface enabled successfully',
        },
      },
    } as any);

    const result = await applyFixCommand('session-123', fix);

    expect(result.success).toBe(true);
    expect(result.message).toBe('WAN interface enabled successfully');
    expect(result.rollbackId).toBeDefined();
  });

  it('should reject manual fixes with actionable steps', async () => {
    const fix: FixSuggestion = {
      issueCode: 'WAN_LINK_DOWN',
      title: 'Check Physical Connection',
      description: 'Cable appears disconnected',
      command: null,
      confidence: null,
      requiresConfirmation: false,
      isManualFix: true,
      manualSteps: ['Check cable connection', 'Try a different cable', 'Restart modem'],
    };

    const result = await applyFixCommand('session-123', fix);

    expect(result.success).toBe(false);
    expect(result.message).toContain('requires manual intervention');
    expect(result.message).toContain('Check cable connection');
  });

  it('should reject fix with missing command', async () => {
    const fix: FixSuggestion = {
      issueCode: 'NO_INTERNET',
      title: 'Contact ISP',
      description: 'ISP issue detected',
      command: null,
      confidence: null,
      requiresConfirmation: false,
      isManualFix: false, // Not marked as manual but has no command
    };

    const result = await applyFixCommand('session-123', fix);

    expect(result.success).toBe(false);
    expect(result.message).toContain('requires manual intervention');
  });

  it('should handle GraphQL mutation failure with actionable error', async () => {
    const fix: FixSuggestion = {
      issueCode: 'GATEWAY_UNREACHABLE',
      title: 'Renew Connection',
      description: 'Renew DHCP lease',
      command: '/ip/dhcp-client/renew [find]',
      confidence: 'high',
      requiresConfirmation: true,
      isManualFix: false,
    };

    vi.spyOn(apiClient.apolloClient, 'mutate').mockResolvedValue({
      data: {
        applyTroubleshootFix: null,
      },
    } as any);

    const result = await applyFixCommand('session-123', fix);

    expect(result.success).toBe(false);
    expect(result.message).toContain('router connection');
  });

  it('should handle GraphQL mutation error with actionable message', async () => {
    const fix: FixSuggestion = {
      issueCode: 'DNS_FAILED',
      title: 'Switch to Cloudflare DNS',
      description: 'Use 1.1.1.1',
      command: '/ip/dns/set servers=1.1.1.1,1.0.0.1',
      confidence: 'high',
      requiresConfirmation: true,
      isManualFix: false,
    };

    const error = new Error('Connection refused');
    vi.spyOn(apiClient.apolloClient, 'mutate').mockRejectedValue(error);

    const result = await applyFixCommand('session-123', fix);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Connection refused');
  });

  it('should handle unexpected errors with fallback message', async () => {
    const fix: FixSuggestion = {
      issueCode: 'NAT_MISSING',
      title: 'Add NAT Rule',
      description: 'Configure NAT',
      command: '/ip/firewall/nat/add chain=srcnat action=masquerade',
      confidence: 'high',
      requiresConfirmation: true,
      isManualFix: false,
    };

    vi.spyOn(apiClient.apolloClient, 'mutate').mockRejectedValue('Unexpected error');

    const result = await applyFixCommand('session-123', fix);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Verify your router is connected');
  });

  it('should generate rollbackId only on success', async () => {
    const fix: FixSuggestion = {
      issueCode: 'WAN_DISABLED',
      title: 'Enable WAN Interface',
      description: 'Enable WAN',
      command: '/interface/enable [find]',
      confidence: 'high',
      requiresConfirmation: true,
      isManualFix: false,
    };

    vi.spyOn(apiClient.apolloClient, 'mutate').mockResolvedValue({
      data: {
        applyTroubleshootFix: {
          success: true,
          message: 'Applied',
        },
      },
    } as any);

    const result = await applyFixCommand('session-123', fix);

    expect(result.success).toBe(true);
    expect(result.rollbackId).toBe('rollback_WAN_DISABLED');
  });

  it('should not generate rollbackId on failure', async () => {
    const fix: FixSuggestion = {
      issueCode: 'GATEWAY_TIMEOUT',
      title: 'Restart Connection',
      description: 'Renew connection',
      command: '/ip/dhcp-client/release [find]; :delay 2s; /ip/dhcp-client/renew [find]',
      confidence: 'medium',
      requiresConfirmation: true,
      isManualFix: false,
    };

    vi.spyOn(apiClient.apolloClient, 'mutate').mockResolvedValue({
      data: {
        applyTroubleshootFix: {
          success: false,
          message: 'Command failed',
        },
      },
    } as any);

    const result = await applyFixCommand('session-123', fix);

    expect(result.success).toBe(false);
    expect(result.rollbackId).toBeUndefined();
  });
});
