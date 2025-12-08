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
        enabled: true
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
        enabled: true
      };
      expect(vpnConn.protocol).toBe('wireguard');
      expect(vpnConn.status).toBe('disconnected');
    });

    it('should have LAN type definition', () => {
      const lanInterface: LANInterface = {
        name: 'eth0',
        ipAddress: '192.168.1.1',
        netmask: '255.255.255.0',
        enabled: true
      };
      expect(lanInterface.name).toBe('eth0');
    });

    it('should have Firewall rule type definition', () => {
      const rule: FirewallRule = {
        id: 'rule1',
        chain: 'input',
        protocol: 'tcp',
        action: 'accept',
        enabled: true
      };
      expect(rule.chain).toBe('input');
      expect(rule.action).toBe('accept');
    });
  });

  describe('API Types', () => {
    it('should have ApiResponse type', () => {
      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'test' },
        timestamp: new Date().toISOString()
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
        },
        timestamp: new Date().toISOString()
      };
      expect(error.success).toBe(false);
      expect(error.error.code).toBe('INVALID_REQUEST');
    });

    it('should have RouterStatusResponse type', () => {
      const status: RouterStatusResponse = {
        uptime: 86400,
        cpu: 45,
        memory: 60,
        disk: 70
      };
      expect(status.uptime).toBe(86400);
      expect(status.cpu).toBe(45);
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
          port: 80,
          retries: 2
        },
        features: {
          vpn: true,
          firewall: true,
          dhcp: true
        }
      };
      expect(config.api.baseUrl).toBe('http://localhost:3000');
      expect(config.ui.theme).toBe('light');
    });

    it('should have RouterConnectionConfig type', () => {
      const connConfig: RouterConnectionConfig = {
        address: '192.168.1.1',
        port: 80,
        username: 'admin',
        password: 'password',
        timeout: 5000
      };
      expect(connConfig.address).toBe('192.168.1.1');
    });

    it('should have ApplicationState type', () => {
      const state: ApplicationState = {
        currentRouter: {
          id: 'router1',
          name: 'Main Router',
          address: '192.168.1.1',
          port: 80,
          lastConnected: new Date()
        },
        userPreferences: {
          theme: 'dark',
          language: 'fa'
        }
      };
      expect(state.currentRouter.name).toBe('Main Router');
      expect(state.userPreferences.theme).toBe('dark');
    });
  });
});
