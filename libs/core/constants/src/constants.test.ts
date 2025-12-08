import { describe, it, expect } from 'vitest';
import { ROUTES, API_ENDPOINTS, SOCKET_EVENTS, SOCKET_EVENTS_EMIT, SOCKET_EVENTS_ON } from './index';

describe('Constants', () => {
  describe('ROUTES', () => {
    it('should have main navigation routes', () => {
      expect(ROUTES.HOME).toBe('/');
      expect(ROUTES.DASHBOARD).toBe('/dashboard');
    });

    it('should have router routes', () => {
      expect(ROUTES.ROUTER_LIST).toBe('/routers');
      expect(ROUTES.ROUTER_DETAIL).toBe('/routers/:id');
    });

    it('should have network configuration routes', () => {
      expect(ROUTES.WAN).toBe('/network/wan');
      expect(ROUTES.LAN).toBe('/network/lan');
      expect(ROUTES.FIREWALL).toBe('/network/firewall');
    });

    it('should have VPN routes', () => {
      expect(ROUTES.VPN_LIST).toBe('/vpn/list');
      expect(ROUTES.VPN_CLIENT).toBe('/vpn/client');
      expect(ROUTES.VPN_SERVER).toBe('/vpn/server');
    });

    it('should have settings routes', () => {
      expect(ROUTES.SETTINGS).toBe('/settings');
      expect(ROUTES.SYSTEM_SETTINGS).toBe('/settings/system');
    });

    it('should have error routes', () => {
      expect(ROUTES.NOT_FOUND).toBe('/404');
      expect(ROUTES.UNAUTHORIZED).toBe('/401');
      expect(ROUTES.FORBIDDEN).toBe('/403');
    });
  });

  describe('API_ENDPOINTS', () => {
    it('should have router endpoints', () => {
      expect(API_ENDPOINTS.ROUTER_STATUS).toBe('/api/v1/router/status');
      expect(API_ENDPOINTS.ROUTER_INFO).toBe('/api/v1/router/info');
    });

    it('should have functions for parameterized endpoints', () => {
      const endpoint = API_ENDPOINTS.ROUTER_DETAIL('router1');
      expect(endpoint).toBe('/api/v1/routers/router1');
    });

    it('should have network endpoints', () => {
      expect(API_ENDPOINTS.WAN_CONFIG).toBe('/api/v1/network/wan');
      expect(API_ENDPOINTS.FIREWALL_RULES).toBe('/api/v1/network/firewall/rules');
    });

    it('should have VPN endpoints', () => {
      expect(API_ENDPOINTS.VPN_CONNECTIONS).toBe('/api/v1/vpn/connections');
      expect(API_ENDPOINTS.VPN_SERVER_CONFIG).toBe('/api/v1/vpn/server');
    });

    it('should have DHCP endpoints', () => {
      expect(API_ENDPOINTS.DHCP_CONFIG).toBe('/api/v1/network/dhcp');
      expect(API_ENDPOINTS.DHCP_LEASES).toBe('/api/v1/network/dhcp/leases');
    });

    it('should have config endpoints', () => {
      expect(API_ENDPOINTS.CONFIG_GET).toBe('/api/v1/config');
      expect(API_ENDPOINTS.CONFIG_APPLY).toBe('/api/v1/config/apply');
      expect(API_ENDPOINTS.CONFIG_BACKUP).toBe('/api/v1/config/backup');
    });

    it('should have auth endpoints', () => {
      expect(API_ENDPOINTS.AUTH_LOGIN).toBe('/api/v1/auth/login');
      expect(API_ENDPOINTS.AUTH_LOGOUT).toBe('/api/v1/auth/logout');
    });

    it('should have health endpoints', () => {
      expect(API_ENDPOINTS.HEALTH).toBe('/api/v1/health');
      expect(API_ENDPOINTS.HEALTH_PING).toBe('/api/v1/health/ping');
    });
  });

  describe('SOCKET_EVENTS', () => {
    it('should have connection events', () => {
      expect(SOCKET_EVENTS_EMIT.CONNECT).toBe('connect');
      expect(SOCKET_EVENTS_EMIT.DISCONNECT).toBe('disconnect');
    });

    it('should have router events', () => {
      expect(SOCKET_EVENTS_EMIT.ROUTER_SUBSCRIBE).toBe('router:subscribe');
      expect(SOCKET_EVENTS_ON.ROUTER_STATUS_UPDATE).toBe('router:status-update');
    });

    it('should have VPN events', () => {
      expect(SOCKET_EVENTS_EMIT.VPN_SUBSCRIBE).toBe('vpn:subscribe');
      expect(SOCKET_EVENTS_ON.VPN_STATUS_UPDATE).toBe('vpn:status-update');
    });

    it('should have firewall events', () => {
      expect(SOCKET_EVENTS_EMIT.FIREWALL_SUBSCRIBE).toBe('firewall:subscribe');
      expect(SOCKET_EVENTS_ON.FIREWALL_RULE_UPDATED).toBe('firewall:rule-updated');
    });

    it('should have network events', () => {
      expect(SOCKET_EVENTS_EMIT.NETWORK_SUBSCRIBE).toBe('network:subscribe');
      expect(SOCKET_EVENTS_ON.NETWORK_INTERFACE_UPDATED).toBe('network:interface-updated');
    });

    it('should have monitoring events', () => {
      expect(SOCKET_EVENTS_EMIT.METRICS_SUBSCRIBE).toBe('metrics:subscribe');
      expect(SOCKET_EVENTS_ON.METRICS_UPDATE).toBe('metrics:update');
      expect(SOCKET_EVENTS_ON.LOG_ENTRY).toBe('log:entry');
    });

    it('should have config events', () => {
      expect(SOCKET_EVENTS_EMIT.CONFIG_APPLY).toBe('config:apply');
      expect(SOCKET_EVENTS_ON.CONFIG_APPLIED).toBe('config:applied');
    });

    it('should have alert events', () => {
      expect(SOCKET_EVENTS_ON.ALERT).toBe('alert');
      expect(SOCKET_EVENTS_ON.WARNING).toBe('warning');
      expect(SOCKET_EVENTS_ON.INFO).toBe('info');
      expect(SOCKET_EVENTS_ON.SUCCESS).toBe('success');
    });

    it('should have combined SOCKET_EVENTS', () => {
      expect(Object.keys(SOCKET_EVENTS).length).toBeGreaterThan(0);
      expect(SOCKET_EVENTS.CONNECT).toBe('connect');
      expect(SOCKET_EVENTS.ROUTER_STATUS_UPDATE).toBe('router:status-update');
    });
  });
});
