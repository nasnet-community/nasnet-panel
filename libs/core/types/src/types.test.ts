import { describe, it, expect } from 'vitest';
import type {
  WANLinkConfig,
  VPNConnection,
  LANInterface,
  FirewallRule,
  ApiResponse,
  ApiError,
  RouterStatusResponse,
  AppConfig,
  ApplicationState,
  RouterConnectionConfig
} from './index.js';

describe('Type Definitions', () => {
  describe('Router Types', () => {
    it('should have WAN type definition', () => {
      const wanLink: WANLinkConfig = {
        id: 'wan1',
        name: 'WAN Interface',
        type: 'dhcp',
        isEnabled: true
      };
      expect(wanLink.id).toBe('wan1');
      expect(wanLink.type).toBe('dhcp');
    });

    it('should have VPN type definition', () => {
      const vpnConn: VPNConnection = {
        id: 'vpn1',
        name: 'VPN Connection',
        protocol: 'wireguard',
        status: 'disconnected',
        isEnabled: true
      };
      expect(vpnConn.protocol).toBe('wireguard');
      expect(vpnConn.status).toBe('disconnected');
    });

    it('should have LAN type definition', () => {
      const lanInterface: LANInterface = {
        id: 'ether1',
        name: 'ether1',
        type: 'ethernet',
        isEnabled: true
      };
      expect(lanInterface.name).toBe('ether1');
    });

    it('should have Firewall rule type definition', () => {
      const rule: FirewallRule = {
        id: 'rule1',
        chain: 'input',
        protocol: 'tcp',
        action: 'accept',
        disabled: false,
        order: 1
      };
      expect(rule.chain).toBe('input');
      expect(rule.action).toBe('accept');
    });
  });

  describe('API Types', () => {
    it('should have ApiResponse type', () => {
      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'test' }
      };
      expect(response.success).toBe(true);
      expect(response.data.message).toBe('test');
    });

    it('should have ApiError type', () => {
      const error: ApiError = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request'
        }
      };
      expect(error.success).toBe(false);
      expect(error.error.code).toBe('INVALID_REQUEST');
    });

    it('should have RouterStatusResponse type', () => {
      const status: RouterStatusResponse = {
        isOnline: true,
        uptime: 86400,
        cpuUsage: 45,
        memoryUsage: 60,
        diskUsage: 70,
        timestamp: new Date()
      };
      expect(status.uptime).toBe(86400);
      expect(status.cpuUsage).toBe(45);
    });
  });

  describe('Config Types', () => {
    it('should have AppConfig type', () => {
      const config: AppConfig = {
        api: {
          baseUrl: 'http://localhost:3000',
          timeout: 5000
        },
        ui: {
          theme: 'light',
          language: 'en'
        },
        router: {
          defaultPort: 8728,
          retryAttempts: 2,
          retryDelay: 1000
        },
        features: {
          isWireGuardVPNEnabled: true,
          isDHCPMonitoringEnabled: true,
          isFirewallViewerEnabled: true,
          isSafetyPipelineEnabled: true
        }
      };
      expect(config.api.baseUrl).toBe('http://localhost:3000');
      expect(config.ui.theme).toBe('light');
    });

    it('should have RouterConnectionConfig type', () => {
      const connConfig: RouterConnectionConfig = {
        address: '192.168.1.1',
        port: 8728,
        username: 'admin',
        password: 'password',
        timeout: 5000,
        useTLS: false,
        verifyCertificate: false
      };
      expect(connConfig.address).toBe('192.168.1.1');
    });

    it('should have ApplicationState type', () => {
      const state: ApplicationState = {
        currentRouter: {
          address: '192.168.1.1',
          port: 8728,
          username: 'admin',
          password: 'secret',
          useTLS: false,
          verifyCertificate: false,
          timeout: 10000
        },
        savedRouters: [],
        userPreferences: {
          theme: 'dark',
          language: 'fa',
          autoRefreshInterval: 5000
        }
      };
      expect(state.currentRouter?.address).toBe('192.168.1.1');
      expect(state.userPreferences.theme).toBe('dark');
    });
  });
});
